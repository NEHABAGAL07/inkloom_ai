"""Review Decisions and Human Approval Workflow API Routes."""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import CurrentUser, get_current_user, require_roles, RoleEnum
from app.schemas.review import ReviewDecisionCreate, ReviewDecisionResponse
from app.workflow.state_machine import resolve_human_review_action, WorkflowTransitionError
from app.schemas.common import WorkflowStateEnum
from app.api.routes.content import _SUBMISSION_STORE

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/decision", response_model=ReviewDecisionResponse)
async def submit_review_decision(
    payload: ReviewDecisionCreate,
    current_user: CurrentUser = Depends(require_roles(RoleEnum.REVIEWER, RoleEnum.ADMIN)),
):
    """
    Record an official human reviewer approval or rejection decision.
    Only authorized reviewers or admins can grant publication approval.
    """
    now = datetime.now(timezone.utc)

    # Current state of content
    current_state = WorkflowStateEnum.PENDING_APPROVAL
    if payload.content_id in _SUBMISSION_STORE:
        current_state = _SUBMISSION_STORE[payload.content_id].current_status

    try:
        new_state = resolve_human_review_action(
            current_state=current_state,
            action=payload.action,
        )
    except WorkflowTransitionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Update in-memory state
    if payload.content_id in _SUBMISSION_STORE:
        _SUBMISSION_STORE[payload.content_id].current_status = new_state
        _SUBMISSION_STORE[payload.content_id].updated_at = now

    return ReviewDecisionResponse(
        id=f"dec-{int(now.timestamp())}",
        content_id=payload.content_id,
        revision_id=payload.revision_id,
        reviewer_id=current_user.user_id,
        action=payload.action,
        comments=payload.comments,
        created_at=now,
        new_workflow_status=new_state,
    )


@router.get("/queue", response_model=List[dict])
async def list_pending_review_queue(
    current_user: CurrentUser = Depends(get_current_user),
):
    """List submissions awaiting human reviewer sign-off."""
    return [
        {
            "content_id": "cnt-demo-001",
            "title": "Global Launch Press Release",
            "author_email": "creator@example.com",
            "workflow_status": "pending_approval",
            "findings_count": 3,
            "submitted_at": "2026-10-22T10:15:00Z",
            "requires_action": True,
        },
        {
            "content_id": "cnt-demo-002",
            "title": "Social Campaign - Banner Series",
            "author_email": "marketing@example.com",
            "workflow_status": "changes_requested",
            "findings_count": 1,
            "submitted_at": "2026-10-22T11:45:00Z",
            "requires_action": False,
        },
    ]
