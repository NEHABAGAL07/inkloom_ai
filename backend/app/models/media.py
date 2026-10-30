"""
Media Storage and Asset Metadata Model
Represents permanently persisted media files (images, videos, documents)
uploaded by designers, creators, and administrators with tenant scoping.
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class MediaItem(TimestampedModel):
    __tablename__ = "media_items"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    campaign_id = Column(
        String(36),
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    submission_id = Column(
        String(36),
        ForeignKey("content_submissions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=False, default="image")  # image, video, document, other
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    uploaded_by = Column(String(255), nullable=True)  # user ID or email
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True)  # active, submitted, approved, archived
    extra_metadata = Column(JSON, nullable=True, default=dict)

    # Relationships
    organization = relationship("Organization", back_populates="media_items")
    campaign = relationship("Campaign", back_populates="media_items")
    submission = relationship("ContentSubmission", back_populates="media_items")

    @property
    def media_url(self) -> str:
        """Returns relative public API URL to stream/view this media file."""
        return f"/api/v1/media/file/{self.id}"
