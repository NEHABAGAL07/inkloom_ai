from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.models import ContentSubmission, ReviewDecision, AuditEvent
from app.schemas.review import ReviewDecisionCreate, ReviewDecisionResponse, ReviewAction
from app.schemas.submission import ContentSubmissionResponse
from app.workflow.state_machine import WorkflowStateMachine, WorkflowState, WorkflowTransitionError

router = APIRouter(prefix="/reviews", tags=["Review Queue & Decisions"])


@router.get("/pending", response_model=List[ContentSubmissionResponse])
def list_pending_reviews(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieve submissions requiring human reviewer action."""
    return (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.organization_id == auth.organization_id,
            ContentSubmission.status.in_([
                WorkflowState.SUBMITTED.value,
                WorkflowState.PENDING_APPROVAL.value,
                WorkflowState.CHANGES_REQUESTED.value,
            ]),
        )
        .order_by(ContentSubmission.updated_at.desc())
        .all()
    )


@router.post("/decide", response_model=ReviewDecisionResponse, status_code=status.HTTP_201_CREATED)
def submit_review_decision(
    payload: ReviewDecisionCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Submit a human reviewer decision: approve, reject, or request changes.
    Enforces that only designated reviewers/admins can authorize publication approval.
    """
    submission = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == payload.submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    # Map action to target workflow state
    action_to_state = {
        ReviewAction.APPROVE: WorkflowState.APPROVED.value,
        ReviewAction.REJECT: WorkflowState.REJECTED.value,
        ReviewAction.REQUEST_CHANGES: WorkflowState.CHANGES_REQUESTED.value,
    }
    target_state = action_to_state[payload.action]

    # Validate state transition with role guards
    user_primary_role = auth.roles[0].value if auth.roles else "creator"
    try:
        WorkflowStateMachine.validate_transition(
            current=submission.status,
            target=target_state,
            actor_role=user_primary_role,
            is_ai_action=False,
        )
    except WorkflowTransitionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Separation of duties: non-admin creators cannot approve their own content
    if target_state == WorkflowState.APPROVED.value and submission.creator_id == auth.user_id:
        if not auth.has_role(UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Separation of duties policy: Creators cannot approve their own submissions. An independent compliance reviewer must sign off.",
            )

    decision = ReviewDecision(
        submission_id=submission.id,
        revision_id=payload.revision_id or submission.current_revision_id,
        reviewer_id=auth.user_id,
        action=payload.action.value,
        comments=payload.comments,
        review_metadata=payload.review_metadata or {},
    )
    db.add(decision)
    db.flush()

    submission.status = target_state

    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="review_decision",
        entity_id=decision.id,
        event_type=f"review_{payload.action.value}",
        details={
            "submission_id": submission.id,
            "decision": payload.action.value,
            "comments": payload.comments,
            "new_status": target_state,
        },
    )
    db.add(event)
    db.commit()
    db.refresh(decision)
    return decision
