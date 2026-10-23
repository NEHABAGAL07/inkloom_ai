from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


def default_invitation_expiry():
    return datetime.now(timezone.utc) + timedelta(days=7)


class Invitation(TimestampedModel):
    __tablename__ = "invitations"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), default="marketing", nullable=False)  # admin, designer, compliance_officer, marketing
    token = Column(String(64), unique=True, nullable=False, index=True)
    invited_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime(timezone=True), default=default_invitation_expiry, nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)

    organization = relationship("Organization", back_populates="invitations")
    invited_by = relationship("User", foreign_keys=[invited_by_id])
