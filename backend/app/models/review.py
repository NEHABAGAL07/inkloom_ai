"""Review Decisions and Immutable Audit Event Trail Models."""

from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, TenantMixin, generate_uuid


class ReviewDecisionModel(Base, TimestampMixin, TenantMixin):
    """Stores human reviewer decisions for content submissions."""
    __tablename__ = "review_decisions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    content_id = Column(String(64), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(64), ForeignKey("content_revisions.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(32), nullable=False)  # approve, reject, request_changes
    comments = Column(Text, nullable=False)
    decision_metadata = Column(JSON, default=dict)

    submission = relationship("ContentSubmission", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")


class AuditEventModel(Base, TimestampMixin, TenantMixin):
    """Immutable audit trail for all governance and workflow actions."""
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    actor_id = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(64), nullable=False)  # content, guideline, review, asset
    entity_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)  # created, updated, status_transition, reviewed
    details = Column(JSON, default=dict)
