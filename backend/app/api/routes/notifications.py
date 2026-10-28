"""
Notification API Routes (Phase 6 In-App Notifications)
Endpoints for viewing, filtering, and acknowledging workflow alerts and review assignments.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext
from app.schemas.campaign import NotificationResponse
from app.services.workflow.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Lists in-app notifications for the authenticated user within their tenant."""
    return NotificationService.list_user_notifications(
        db=db,
        organization_id=auth.organization_id,
        recipient_id=auth.user_id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )


@router.post("/{notification_id}/read", response_model=Optional[NotificationResponse])
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Marks a single notification as read."""
    return NotificationService.mark_read(
        db=db,
        organization_id=auth.organization_id,
        recipient_id=auth.user_id,
        notification_id=notification_id,
    )


@router.post("/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Marks all pending notifications as read for the current user."""
    updated_count = NotificationService.mark_all_read(
        db=db,
        organization_id=auth.organization_id,
        recipient_id=auth.user_id,
    )
    return {"message": "All notifications marked as read.", "count": updated_count}
