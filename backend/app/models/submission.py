from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ContentSubmission(TimestampedModel):
    __tablename__ = "content_submissions"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String(50), default="text", nullable=False)  # text, document, image, video
    
    # Workflow status: draft, submitted, auditing, changes_requested, resubmitted, pending_approval, approved, rejected
    status = Column(String(50), default="draft", nullable=False, index=True)
    current_revision_id = Column(String(36), nullable=True)

    organization = relationship("Organization", back_populates="submissions")
    revisions = relationship("ContentRevision", back_populates="submission", cascade="all, delete-orphan", foreign_keys="ContentRevision.submission_id")
    audits = relationship("AuditRun", back_populates="submission", cascade="all, delete-orphan")
    reviews = relationship("ReviewDecision", back_populates="submission", cascade="all, delete-orphan")
