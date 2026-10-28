"""
Notification Service (Phase 6)
Delivers in-app notifications with read status tracking and idempotency deduplication.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationService:
    @staticmethod
    def dispatch_notification(
        db: Session,
        organization_id: str,
        recipient_id: str,
        title: str,
        message: str,
        notification_type: str,
        link_url: Optional[str] = None,
        sender_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """
        Creates an in-app notification.
        If idempotency_key is provided and already exists, returns the existing record
        to prevent duplicate alerts during retries.
        """
        if idempotency_key:
            existing = (
                db.query(Notification)
                .filter(
                    Notification.organization_id == organization_id,
                    Notification.idempotency_key == idempotency_key,
                )
                .first()
            )
            if existing:
                return existing

        notif = Notification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            organization_id=organization_id,
            recipient_id=recipient_id,
            sender_id=sender_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link_url=link_url,
            idempotency_key=idempotency_key,
            details=details or {},
            is_read=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def list_user_notifications(
        db: Session,
        organization_id: str,
        recipient_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Notification]:
        """Lists tenant-isolated notifications for the recipient."""
        query = db.query(Notification).filter(
            Notification.organization_id == organization_id,
            Notification.recipient_id == recipient_id,
        )
        if unread_only:
            query = query.filter(Notification.is_read == False)

        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def mark_read(
        db: Session,
        organization_id: str,
        recipient_id: str,
        notification_id: str,
    ) -> Optional[Notification]:
        """Marks a notification as read with a timestamp."""
        notif = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.organization_id == organization_id,
                Notification.recipient_id == recipient_id,
            )
            .first()
        )
        if notif and not notif.is_read:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_read(
        db: Session,
        organization_id: str,
        recipient_id: str,
    ) -> int:
        """Marks all pending notifications as read for the recipient."""
        now = datetime.now(timezone.utc)
        updated = (
            db.query(Notification)
            .filter(
                Notification.organization_id == organization_id,
                Notification.recipient_id == recipient_id,
                Notification.is_read == False,
            )
            .update({Notification.is_read: True, Notification.read_at: now}, synchronize_session=False)
        )
        db.commit()
        return updated
