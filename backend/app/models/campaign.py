"""
Campaign Model for Unified Workflow and Approval Orchestration (Phase 6)
Connects creative briefs, marketing drafts, design assets, multi-track AI reviews,
human approval decisions, and activity logs under a single governance container.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    ForeignKey,
    JSON,
    Integer,
    DateTime,
)
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class Campaign(TimestampedModel):
    __tablename__ = "campaigns"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    product_name = Column(String(255), nullable=True)
    target_audience = Column(String(255), nullable=True)
    campaign_objective = Column(Text, nullable=True)
    target_channel = Column(String(50), default="omnichannel", nullable=False)
    target_jurisdiction = Column(String(50), default="Global", nullable=False)
    regulated_category = Column(String(50), default="general_commercial", nullable=False)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical
    deadline = Column(DateTime(timezone=True), nullable=True)

    owner_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_reviewer_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Workflow status: draft, in_progress, ai_review_pending, ai_review_in_progress,
    # human_review_pending, changes_requested, re_review_pending, approved, rejected, archived
    status = Column(String(50), default="draft", nullable=False, index=True)
    creative_brief = Column(Text, nullable=True)

    # Governance policy configuration (required review tracks, risk thresholds)
    policy_config = Column(JSON, nullable=False, default=dict)

    # Campaign metadata (tags, custom attributes, reviewer notes)
    campaign_metadata = Column(JSON, nullable=False, default=dict)

    # Optimistic concurrency control version counter
    version = Column(Integer, default=1, nullable=False)

    # Relationships
    organization = relationship("Organization")
    owner = relationship("User", foreign_keys=[owner_id])
    assigned_reviewer = relationship("User", foreign_keys=[assigned_reviewer_id])
    submissions = relationship(
        "ContentSubmission",
        back_populates="campaign",
        foreign_keys="ContentSubmission.campaign_id",
        order_by="desc(ContentSubmission.created_at)",
    )
    media_items = relationship(
        "MediaItem",
        back_populates="campaign",
        foreign_keys="MediaItem.campaign_id",
        order_by="desc(MediaItem.created_at)",
    )
