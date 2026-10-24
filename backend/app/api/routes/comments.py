from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.models import ContentSubmission, ContentComment, AuditEvent
from app.schemas.comment import CommentCreate, CommentResolveToggle, CommentResponse, CommentsListResponse

router = APIRouter(prefix="/submissions/{submission_id}/comments", tags=["Designer Feedback & Comments"])


def get_role_display_name(roles: List[UserRole]) -> str:
    if UserRole.ADMIN in roles:
        return "Manager"
    if UserRole.COMPLIANCE_OFFICER in roles:
        return "Legal / Compliance"
    if UserRole.MARKETING in roles:
        return "Marketing"
    if UserRole.DESIGNER in roles:
        return "Designer"
    return roles[0].value if roles else "Team Member"


@router.get("", response_model=CommentsListResponse)
def list_comments(
    submission_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    List all review comments, feedback, and designer change requests for a submission.
    Provides resolution counts for tracking what is done vs. what still needs to be fixed.
    """
    sub = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    comments = (
        db.query(ContentComment)
        .filter(
            ContentComment.submission_id == submission_id,
            ContentComment.organization_id == auth.organization_id,
        )
        .order_by(ContentComment.created_at.desc())
        .all()
    )

    total_count = len(comments)
    resolved_count = sum(1 for c in comments if c.is_resolved)
    open_count = total_count - resolved_count

    return CommentsListResponse(
        comments=comments,
        total_count=total_count,
        open_count=open_count,
        resolved_count=resolved_count,
    )


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    submission_id: str,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Add a targeted change request or improvement comment on a designer's uploaded asset or copy.
    Accessible strictly to Manager, Legal Department, and Marketing Department.
    Designers have access to view all comments and mark them as done (✓).
    """
    sub = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    # Only Manager, Legal Department, and Marketing Department can add suggestions / improvement comments
    allowed_roles = {UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER, UserRole.MARKETING}
    if not any(role in allowed_roles for role in auth.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Manager, Legal Department, and Marketing Department have access to submit suggestions and improvements for designer uploads.",
        )

    role_str = auth.roles[0].value if auth.roles else "viewer"
    author_name = auth.full_name or auth.email or "Team Reviewer"

    comment = ContentComment(
        submission_id=sub.id,
        organization_id=auth.organization_id,
        author_id=auth.user_id,
        author_name=author_name,
        author_role=role_str,
        comment_text=payload.comment_text.strip(),
        category=payload.category or "visual_design",
        is_resolved=False,
    )
    db.add(comment)
    db.flush()

    # Audit trail event
    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="comment",
        entity_id=comment.id,
        event_type="comment_added",
        details={
            "submission_id": sub.id,
            "category": comment.category,
            "author_role": role_str,
        },
    )
    db.add(event)
    db.commit()
    db.refresh(comment)

    return comment


@router.patch("/{comment_id}/resolve", response_model=CommentResponse)
def toggle_comment_resolution(
    submission_id: str,
    comment_id: str,
    payload: CommentResolveToggle,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Toggle resolution status (tick sign) when a designer fixes the requested issue,
    or reopens it if additional revisions are required.
    """
    comment = (
        db.query(ContentComment)
        .filter(
            ContentComment.id == comment_id,
            ContentComment.submission_id == submission_id,
            ContentComment.organization_id == auth.organization_id,
        )
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")

    resolver_name = auth.full_name or auth.email or "Designer"

    if payload.is_resolved:
        comment.is_resolved = True
        comment.resolved_at = datetime.now(timezone.utc)
        comment.resolved_by = resolver_name
        if payload.resolution_note:
            comment.resolution_note = payload.resolution_note
        event_type = "comment_resolved"
    else:
        comment.is_resolved = False
        comment.resolved_at = None
        comment.resolved_by = None
        comment.resolution_note = None
        event_type = "comment_reopened"

    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="comment",
        entity_id=comment.id,
        event_type=event_type,
        details={
            "submission_id": submission_id,
            "is_resolved": comment.is_resolved,
            "resolver": resolver_name,
        },
    )
    db.add(event)
    db.commit()
    db.refresh(comment)

    return comment
