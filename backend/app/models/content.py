"""Content Submission and Revision Models."""

from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, TenantMixin, generate_uuid


class ContentSubmission(Base, TimestampMixin, TenantMixin):
    """Represents a submitted piece of content undergoing brand governance."""
    __tablename__ = "content_submissions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content_type = Column(String(32), default="text", nullable=False)  # text, document, image, video
    current_status = Column(String(32), default="draft", nullable=False)  # matches workflow states
    current_revision_num = Column(Integer, default=1, nullable=False)

    author = relationship("User", back_populates="submissions")
    revisions = relationship("ContentRevision", back_populates="submission", cascade="all, delete-orphan")
    reviews = relationship("ReviewDecisionModel", back_populates="submission", cascade="all, delete-orphan")


class ContentRevision(Base, TimestampMixin):
    """Tracks each iteration or upload of a content submission."""
    __tablename__ = "content_revisions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    submission_id = Column(String(64), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_num = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=True)
    file_path = Column(String(1000), nullable=True)
    file_metadata = Column(JSON, default=dict)

    submission = relationship("ContentSubmission", back_populates="revisions")
    audits = relationship("AuditResultModel", back_populates="revision", cascade="all, delete-orphan")
