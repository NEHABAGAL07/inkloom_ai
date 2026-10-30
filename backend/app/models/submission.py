<<<<<<< HEAD
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
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)

    organization = relationship("Organization", back_populates="submissions")
    campaign = relationship("Campaign", back_populates="submissions")
    revisions = relationship("ContentRevision", back_populates="submission", cascade="all, delete-orphan", foreign_keys="ContentRevision.submission_id", order_by="desc(ContentRevision.version_number)")
    audits = relationship("AuditRun", back_populates="submission", cascade="all, delete-orphan")
    reviews = relationship("ReviewDecision", back_populates="submission", cascade="all, delete-orphan")
    review_cycles = relationship("ReviewCycle", back_populates="submission", cascade="all, delete-orphan", order_by="desc(ReviewCycle.cycle_number)")
    comments = relationship("ContentComment", back_populates="submission", cascade="all, delete-orphan", order_by="ContentComment.created_at.desc()")

    @property
    def raw_text(self):
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id:
                    return r.raw_text
            return self.revisions[0].raw_text
        return None

    @property
    def file_name(self):
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id and r.file_name:
                    return r.file_name
            for r in self.revisions:
                if r.file_name:
                    return r.file_name
        if self.title and any(self.title.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf", ".mp4"]):
            return self.title.replace("Design Asset: ", "")
        return None

    @property
    def file_path(self):
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id:
                    return r.file_path
            return self.revisions[0].file_path
        return None

    @property
    def media_url(self):
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id:
                    if r.file_path and (r.file_path.startswith("data:") or r.file_path.startswith("http") or r.file_path.startswith("/")):
                        return r.file_path
                    if r.raw_text and (r.raw_text.startswith("data:") or r.raw_text.startswith("http") or r.raw_text.startswith("/")):
                        return r.raw_text
            for r in self.revisions:
                if r.file_path and (r.file_path.startswith("data:") or r.file_path.startswith("http") or r.file_path.startswith("/")):
                    return r.file_path
                if r.raw_text and (r.raw_text.startswith("data:") or r.raw_text.startswith("http") or r.raw_text.startswith("/")):
                    return r.raw_text
        return None
=======
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
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)

    organization = relationship("Organization", back_populates="submissions")
    campaign = relationship("Campaign", back_populates="submissions")
    revisions = relationship("ContentRevision", back_populates="submission", cascade="all, delete-orphan", foreign_keys="ContentRevision.submission_id", order_by="desc(ContentRevision.version_number)")
    audits = relationship("AuditRun", back_populates="submission", cascade="all, delete-orphan")
    reviews = relationship("ReviewDecision", back_populates="submission", cascade="all, delete-orphan")
    comments = relationship("ContentComment", back_populates="submission", cascade="all, delete-orphan", order_by="ContentComment.created_at.desc()")
    media_items = relationship("MediaItem", back_populates="submission", cascade="all, delete-orphan", foreign_keys="MediaItem.submission_id")

    @property
    def raw_text(self):
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id:
                    return r.raw_text
            return self.revisions[0].raw_text
        return None

    @property
    def file_name(self):
        if self.media_items:
            return self.media_items[0].original_filename
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id and r.file_name:
                    return r.file_name
            for r in self.revisions:
                if r.file_name:
                    return r.file_name
        if self.title and any(self.title.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf", ".mp4"]):
            return self.title.replace("Design Asset: ", "")
        return None

    @property
    def file_path(self):
        if self.media_items:
            return self.media_items[0].file_path
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id:
                    return r.file_path
            return self.revisions[0].file_path
        return None

    @property
    def media_url(self):
        if self.media_items:
            return self.media_items[0].media_url
        if self.revisions:
            for r in self.revisions:
                if self.current_revision_id and r.id == self.current_revision_id:
                    if r.file_path and (r.file_path.startswith("data:") or r.file_path.startswith("http") or r.file_path.startswith("/")):
                        return r.file_path
                    if r.raw_text and (r.raw_text.startswith("data:") or r.raw_text.startswith("http") or r.raw_text.startswith("/")):
                        return r.raw_text
            for r in self.revisions:
                if r.file_path and (r.file_path.startswith("data:") or r.file_path.startswith("http") or r.file_path.startswith("/")):
                    return r.file_path
                if r.raw_text and (r.raw_text.startswith("data:") or r.raw_text.startswith("http") or r.raw_text.startswith("/")):
                    return r.raw_text
        return None
>>>>>>> 83a65e189b2c5eb7f9f2b7c2702f006bbaa49626
