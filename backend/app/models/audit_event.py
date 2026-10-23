from sqlalchemy import Column, String, ForeignKey, JSON
from app.models.base_model import TimestampedModel


class AuditEvent(TimestampedModel):
    """
    Immutable audit log recording every key governance action,
    state transition, AI execution, and human decision.
    """
    __tablename__ = "audit_events"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # submission, revision, audit_run, review, guideline
    entity_id = Column(String(36), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # status_changed, audit_completed, review_approved, etc.
    details = Column(JSON, nullable=False, default=dict)
