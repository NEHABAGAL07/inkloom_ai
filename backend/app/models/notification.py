"""
Notification Model for Workflow Assignments, Requests, and Decisions (Phase 6)
Stores tenant-isolated in-app notifications with read tracking and idempotency deduplication.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    ForeignKey,
    Boolean,
    DateTime,
    JSON,
)
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class Notification(TimestampedModel):
    __tablename__ = "notifications"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recipient_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Notification categories: review_assigned, review_completed, changes_requested,
    # approved, rejected, revision_created, deadline_approaching, system_alert
    notification_type = Column(String(50), nullable=False, index=True)
    link_url = Column(String(255), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Safe deduplication during workflow retries
    idempotency_key = Column(String(100), nullable=True, unique=True, index=True)
    details = Column(JSON, nullable=False, default=dict)

    # Relationships
    organization = relationship("Organization")
    recipient = relationship("User", foreign_keys=[recipient_id])
    sender = relationship("User", foreign_keys=[sender_id])
