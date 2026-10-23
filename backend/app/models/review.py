from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ReviewDecision(TimestampedModel):
    __tablename__ = "review_decisions"

    submission_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(36), ForeignKey("content_revisions.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Decisions: approve, reject, request_changes
    action = Column(String(50), nullable=False, index=True)
    comments = Column(Text, nullable=True)
    review_metadata = Column(JSON, nullable=True, default=dict)

    submission = relationship("ContentSubmission", back_populates="reviews")
    reviewer = relationship("User")
