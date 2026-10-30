"""
Review Cycle & Real-Time Feedback API Routes
Endpoints for shared multi-departmental reviews (Manager, Marketing, Legal),
persistent departmental feedback, Designer feedback summaries, and real-time SSE stream.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    AuthContext,
    UserRole,
    require_roles,
)
from app.models import ReviewCycle, ContentSubmission, ContentRevision
from app.schemas.review_cycle import (
    ReviewCycleResponse,
    DepartmentReviewSubmit,
    DesignerFeedbackSummaryResponse,
    FinalApprovalSubmit,
)
from app.services.review_cycle_service import ReviewCycleService
from app.services.realtime_broadcaster import broadcaster

router = APIRouter(prefix="/review-cycles", tags=["Centralized Review Cycles & Departmental Reviews"])
feedback_router = APIRouter(prefix="/feedback", tags=["Designer Feedback & Reviews"])
realtime_router = APIRouter(prefix="/realtime", tags=["Real-Time Governance Stream"])


@router.get("", response_model=List[ReviewCycleResponse])
def list_review_cycles(
    submission_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Lists review cycles for the authenticated organization or a specific submission."""
    query = (
        db.query(ReviewCycle)
        .filter(ReviewCycle.organization_id == auth.organization_id)
    )
    if submission_id:
        query = query.filter(ReviewCycle.submission_id == submission_id)

    return query.order_by(ReviewCycle.created_at.desc()).all()


@router.get("/{cycle_id}", response_model=ReviewCycleResponse)
def get_review_cycle(
    cycle_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieves a single review cycle with its 3 independent departmental reviews and feedback records."""
    cycle = (
        db.query(ReviewCycle)
        .filter(
            ReviewCycle.id == cycle_id,
            ReviewCycle.organization_id == auth.organization_id,
        )
        .first()
    )
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found.")
    return cycle


@router.post("/{cycle_id}/department-review", response_model=ReviewCycleResponse, status_code=status.HTTP_201_CREATED)
def submit_department_review(
    cycle_id: str,
    payload: DepartmentReviewSubmit,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.LEGAL,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Submits an independent departmental review for Manager, Marketing, or Legal.
    Enforces that:
    - Manager submits for 'manager'
    - Marketing submits for 'marketing'
    - Legal submits for 'legal'
    - One department cannot overwrite another's review
    - All 3 departments must complete before the cycle is finished.
    """
    return ReviewCycleService.submit_departmental_review(
        db=db,
        auth=auth,
        cycle_id=cycle_id,
        payload=payload,
    )


@router.post("/{cycle_id}/final-approval", response_model=ReviewCycleResponse)
def grant_final_approval(
    cycle_id: str,
    payload: Optional[FinalApprovalSubmit] = None,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(require_roles(UserRole.ADMIN)),
):
    """
    Manager / Brand Admin final publication approval.
    Can only be granted after all three departments have completed review with no changes requested.
    """
    return ReviewCycleService.grant_final_approval(
        db=db,
        auth=auth,
        cycle_id=cycle_id,
        comments=payload.comments if payload else None,
    )


@feedback_router.get("/designer-summary", response_model=DesignerFeedbackSummaryResponse)
@feedback_router.get("/my-designs", response_model=DesignerFeedbackSummaryResponse)
def get_designer_feedback(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Dedicated endpoint powering the Designer 'New Feedback' view:
    Returns feedback counters, grouped designs, version history, and individual departmental cards.
    """
    return ReviewCycleService.get_designer_feedback_summary(
        db=db,
        auth=auth,
    )


@realtime_router.get("/events")
async def realtime_governance_stream(
    token: Optional[str] = Query(default=None),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits real-time workflow events: new_submission, new_feedback, department_reviewed,
    review_cycle_completed, changes_requested, new_revision, final_approval_status_changed.
    """
    return StreamingResponse(
        broadcaster.sse_event_stream(auth.organization_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

