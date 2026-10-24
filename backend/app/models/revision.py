from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ContentRevision(TimestampedModel):
    __tablename__ = "content_revisions"

    submission_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, default=1, nullable=False)
    raw_text = Column(Text, nullable=True)
    file_path = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    media_metadata = Column(JSON, nullable=True, default=dict)

    submission = relationship("ContentSubmission", back_populates="revisions", foreign_keys=[submission_id])
    audits = relationship("AuditRun", back_populates="revision", cascade="all, delete-orphan")
