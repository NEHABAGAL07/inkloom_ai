from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext
from app.models import ContentSubmission, ContentRevision, AuditEvent
from app.schemas.submission import (
    ContentSubmissionCreate,
    ContentSubmissionResponse,
    ContentRevisionCreate,
    ContentRevisionResponse,
)
from app.workflow.state_machine import WorkflowState
from app.schemas.audit_contract import AuditResult
from app.services.audit_orchestrator import AuditOrchestrator

router = APIRouter(prefix="/submissions", tags=["Content Submissions"])


@router.get("", response_model=List[ContentSubmissionResponse])
def list_submissions(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """List submissions for the tenant."""
    return (
        db.query(ContentSubmission)
        .filter(ContentSubmission.organization_id == auth.organization_id)
        .order_by(ContentSubmission.created_at.desc())
        .all()
    )


@router.post("", response_model=ContentSubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(
    payload: ContentSubmissionCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Create a new content submission with an initial revision."""
    submission = ContentSubmission(
        organization_id=auth.organization_id,
        creator_id=auth.user_id,
        title=payload.title,
        description=payload.description,
        content_type=payload.content_type,
        status=WorkflowState.SUBMITTED.value,
    )
    db.add(submission)
    db.flush()

    text_content = payload.initial_text or payload.media_url or ""
    if text_content or payload.file_name or payload.media_url or payload.file_path:
        revision = ContentRevision(
            submission_id=submission.id,
            version_number=1,
            raw_text=text_content or None,
            file_name=payload.file_name or (payload.title if payload.content_type in ["image", "video"] else None),
            file_path=payload.media_url or payload.file_path or None,
            file_size_bytes=len(text_content.encode("utf-8")) if text_content else 0,
            media_metadata=payload.media_metadata or {},
        )
        db.add(revision)
        db.flush()
        submission.current_revision_id = revision.id

    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="submission",
        entity_id=submission.id,
        event_type="submission_created",
        details={"title": submission.title, "content_type": submission.content_type},
    )
    db.add(event)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/{submission_id}", response_model=ContentSubmissionResponse)
def get_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    submission = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    return submission


@router.post("/{submission_id}/revisions", response_model=ContentRevisionResponse, status_code=status.HTTP_201_CREATED)
def create_revision(
    submission_id: str,
    payload: ContentRevisionCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Add a new revision to an existing submission (e.g. after changes requested)."""
    submission = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    max_ver = (
        db.query(ContentRevision.version_number)
        .filter(ContentRevision.submission_id == submission_id)
        .order_by(ContentRevision.version_number.desc())
        .first()
    )
    next_ver = (max_ver[0] + 1) if max_ver else 1

    file_path_val = payload.file_path or (payload.raw_text if payload.raw_text and (payload.raw_text.startswith("data:") or payload.raw_text.startswith("http")) else None)
    revision = ContentRevision(
        submission_id=submission.id,
        version_number=next_ver,
        raw_text=payload.raw_text,
        file_name=payload.file_name,
        file_path=file_path_val,
        file_size_bytes=payload.file_size_bytes or (len(payload.raw_text.encode("utf-8")) if payload.raw_text else 0),
        media_metadata=payload.media_metadata or {},
    )
    db.add(revision)
    db.flush()

    submission.current_revision_id = revision.id
    submission.status = WorkflowState.RESUBMITTED.value

    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="revision",
        entity_id=revision.id,
        event_type="revision_created",
        details={"version_number": next_ver, "submission_id": submission.id},
    )
    db.add(event)
    db.commit()
    db.refresh(revision)
    return revision


@router.post("/{submission_id}/audit", response_model=AuditResult, status_code=status.HTTP_201_CREATED)
def audit_submission(
    submission_id: str,
    revision_id: Optional[str] = None,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Triggers brand governance audit for submission."""
    submission = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    return AuditOrchestrator.execute_audit_for_submission(
        db=db,
        submission_id=submission.id,
        revision_id=revision_id,
        actor_id=auth.user_id,
    )
