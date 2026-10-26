"""
Brand Guideline Chatbot API Routes
Provides natural-language conversational answers strictly grounded in tenant brand documents and rules.
Includes user session history, grounded citations, prompt injection defense, mode tracking, and feedback.
"""
import time
from typing import List, Optional, Dict
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.session import get_db
from app.core.config import settings
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    AskQuestionRequest,
    AskQuestionResponse,
    CitationItem,
    SessionResponse,
    SessionDetailResponse,
    MessageFeedbackRequest,
    ChatStatusResponse,
)
from app.services.document_intelligence.retrieval import DocumentRetrievalService
from app.services.ai_audit.llm_adapter import get_llm_adapter

router = APIRouter(prefix="/chat", tags=["Brand Guideline Assistant"])

# In-memory rate limiter: user_id -> list of timestamps
_USER_RATE_LIMITS: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60.0  # seconds


def _check_rate_limit(user_id: str):
    max_requests = getattr(settings, "CHAT_RATE_LIMIT_PER_MINUTE", 10)
    now = time.time()
    timestamps = _USER_RATE_LIMITS[user_id]
    # Prune timestamps older than window
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(valid_timestamps) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: You have reached the limit of {max_requests} requests per minute. Please wait a moment.",
        )
    valid_timestamps.append(now)
    _USER_RATE_LIMITS[user_id] = valid_timestamps


@router.get("/status", response_model=ChatStatusResponse)
def get_chat_status(
    auth_context: AuthContext = Depends(get_current_auth_context),
):
    """
    Inspects assistant LLM provider and status.
    Restricted to Brand Admin and Legal & Compliance roles.
    Never returns secrets or API keys.
    """
    if not any(r in auth_context.roles for r in (UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Brand Admin or Legal & Compliance can inspect assistant status.",
        )

    llm_enabled = bool(settings.LLM_API_KEY and settings.LLM_PROVIDER.lower() in ("gemini", "google"))
    return ChatStatusResponse(
        llm_enabled=llm_enabled,
        provider=settings.LLM_PROVIDER,
        model=settings.LLM_MODEL_NAME or "gemini-1.5-flash",
    )


@router.post("/ask", response_model=AskQuestionResponse)
def ask_question(
    payload: AskQuestionRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Asks a natural language question grounded in the authenticated organization's brand documents.
    Returns the assistant's answer, exact citations (doc name + page + snippet), confidence, and mode.
    """
    # 0. Validate input length
    question_text = payload.question.strip()
    if len(question_text) < 2 or len(question_text) > 1000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question must be between 2 and 1000 characters.",
        )

    # 1. Enforce per-user rate limit
    _check_rate_limit(auth_context.user_id)

    # 2. Resolve or create chat session (org_id AND user_id isolation)
    session = None
    if payload.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == payload.session_id,
                ChatSession.organization_id == auth_context.organization_id,
                ChatSession.user_id == auth_context.user_id,
            )
            .first()
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied.",
            )
    else:
        short_title = question_text[:40]
        if len(question_text) > 40:
            short_title += "..."
        session = ChatSession(
            organization_id=auth_context.organization_id,
            user_id=auth_context.user_id,
            title=short_title or "Brand Assistant Inquiry",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # 3. Record user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=question_text,
    )
    db.add(user_msg)
    db.commit()

    # 4. Retrieve relevant passages (filtered strictly by organization_id)
    retrieved_passages = DocumentRetrievalService.retrieve_passages(
        db=db,
        organization_id=auth_context.organization_id,
        query=question_text,
        top_k=5,
    )

    # 5. Pre-retrieval minimum score check:
    # If no passage passes threshold, return not_found WITHOUT calling LLM (saves cost & prevents hallucination)
    MIN_RELEVANCE_THRESHOLD = 0.10
    if not retrieved_passages or retrieved_passages[0].get("score", 0.0) < MIN_RELEVANCE_THRESHOLD:
        not_found_answer = "I couldn't find this in your uploaded documents."
        asst_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=not_found_answer,
            citations=[],
            confidence="not_found",
            mode="extractive",
        )
        db.add(asst_msg)
        session.updated_at = datetime.now(timezone.utc)
        db.commit()

        return AskQuestionResponse(
            session_id=session.id,
            answer=not_found_answer,
            citations=[],
            confidence="not_found",
            mode="extractive",
        )

    # 6. Fetch prior session history (last ~6 messages for conversational context)
    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(6)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(recent_messages)]

    # 7. Generate grounded answer via configured LLM / FallbackAdapter
    adapter = get_llm_adapter()
    generation_result = adapter.generate_grounded_answer(
        question=question_text,
        passages=retrieved_passages,
        history=history,
    )

    raw_answer = generation_result.get("answer", "")
    returned_passage_ids = set(generation_result.get("used_passage_ids", []))
    confidence = generation_result.get("confidence", "medium")
    mode = generation_result.get("mode", "extractive")

    # 8. Post-validate citations: keep ONLY citations whose passage id was actually retrieved
    passages_by_id = {p["chunk_id"]: p for p in retrieved_passages}
    valid_citations: List[CitationItem] = []

    for chunk_id in returned_passage_ids:
        if chunk_id in passages_by_id:
            p = passages_by_id[chunk_id]
            valid_citations.append(
                CitationItem(
                    document_id=p["document_id"],
                    document_name=p["document_name"],
                    page=p.get("page"),
                    section=p.get("section"),
                    source_type=p.get("source_type", "document"),
                    snippet=p["snippet"],
                )
            )

    # Enforce zero citations if not found
    if confidence == "not_found" or "couldn't find" in raw_answer.lower():
        confidence = "not_found"
        valid_citations = []
        raw_answer = "I couldn't find this in your uploaded documents."
    elif not valid_citations and retrieved_passages:
        # If model answered positively but cited unknown/fake IDs, drop them and fall back to top retrieved passages
        top_p = retrieved_passages[0]
        valid_citations.append(
            CitationItem(
                document_id=top_p["document_id"],
                document_name=top_p["document_name"],
                page=top_p.get("page"),
                section=top_p.get("section"),
                source_type=top_p.get("source_type", "document"),
                snippet=top_p["snippet"],
            )
        )

    # 9. Record assistant message with mode
    asst_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=raw_answer,
        citations=[c.model_dump() for c in valid_citations],
        confidence=confidence,
        mode=mode,
    )
    db.add(asst_msg)

    # Update session modified timestamp
    session.updated_at = datetime.now(timezone.utc)
    db.commit()

    return AskQuestionResponse(
        session_id=session.id,
        answer=raw_answer,
        citations=valid_citations,
        confidence=confidence,
        mode=mode,
    )


@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Lists conversation sessions owned by the authenticated user in their current organization.
    Multi-tenant and multi-user isolation enforced.
    """
    sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.organization_id == auth_context.organization_id,
            ChatSession.user_id == auth_context.user_id,
        )
        .order_by(ChatSession.updated_at.desc())
        .all()
    )

    results = []
    for s in sessions:
        results.append(
            SessionResponse(
                id=s.id,
                organization_id=s.organization_id,
                user_id=s.user_id,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=len(s.messages),
            )
        )
    return results


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Retrieves full chat history for a session.
    Returns 404 if session does not belong to caller or caller's organization.
    """
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.organization_id == auth_context.organization_id,
            ChatSession.user_id == auth_context.user_id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied.",
        )

    return SessionDetailResponse(
        id=session.id,
        organization_id=session.organization_id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages),
        messages=session.messages,
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Deletes a chat session and all its messages.
    Returns 404 if session does not belong to caller or caller's organization.
    """
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.organization_id == auth_context.organization_id,
            ChatSession.user_id == auth_context.user_id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied.",
        )

    db.delete(session)
    db.commit()
    return None


@router.post("/messages/{message_id}/feedback")
def submit_message_feedback(
    message_id: str,
    payload: MessageFeedbackRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Records helpfulness feedback (thumbs up / down and optional comment) on an assistant message.
    Verifies caller owns the associated session.
    """
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found.",
        )

    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == msg.session_id,
            ChatSession.organization_id == auth_context.organization_id,
            ChatSession.user_id == auth_context.user_id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to message session.",
        )

    msg.feedback = {
        "helpful": payload.helpful,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "user_id": auth_context.user_id,
    }
    db.commit()
    return {"status": "success", "message_id": message_id, "feedback": msg.feedback}
