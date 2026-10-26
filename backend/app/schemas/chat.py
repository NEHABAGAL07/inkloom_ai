"""
Pydantic Schemas for Brand Guideline Chatbot API
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CitationItem(BaseModel):
    document_id: str
    document_name: str
    page: Optional[int] = None
    section: Optional[str] = None
    source_type: str = "document"  # "document" | "guideline_rule"
    snippet: str


class AskQuestionRequest(BaseModel):
    session_id: Optional[str] = None
    question: str = Field(..., min_length=2, max_length=1000, description="Natural language brand question")


class AskQuestionResponse(BaseModel):
    session_id: str
    answer: str
    citations: List[CitationItem] = []
    confidence: str  # "high", "medium", "low", "not_found"
    mode: str = "extractive"  # "llm" | "extractive"


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    role: str
    content: str
    citations: Optional[List[Dict[str, Any]]] = None
    confidence: str
    mode: Optional[str] = "extractive"
    feedback: Optional[Dict[str, Any]] = None
    created_at: datetime


class ChatStatusResponse(BaseModel):
    llm_enabled: bool
    provider: str
    model: str


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class SessionDetailResponse(SessionResponse):
    messages: List[MessageResponse] = []


class MessageFeedbackRequest(BaseModel):
    helpful: bool
    comment: Optional[str] = None
