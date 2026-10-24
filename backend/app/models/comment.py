from sqlalchemy import Column, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ContentComment(TimestampedModel):
    """
    Comment and change-request model for submissions.
    Enables Manager, Legal, and Marketing teams to leave targeted feedback
    on designer uploads with an interactive tick/resolution workflow.
    """
    __tablename__ = "content_comments"

    submission_id = Column(
        String(36),
        ForeignKey("content_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    author_name = Column(String(255), nullable=False)
    author_role = Column(String(50), nullable=False)  # admin, compliance_officer, marketing, designer
    comment_text = Column(Text, nullable=False)
    category = Column(String(50), default="general", nullable=False)  # visual_design, legal_compliance, copy_tone, brand_rules, general
    
    # Resolution Tracking: Tick sign workflow for designer fixes
    is_resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(255), nullable=True)
    resolution_note = Column(Text, nullable=True)

    submission = relationship("ContentSubmission", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])
