"""Brand Guideline and Rule Models."""

from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, TenantMixin, generate_uuid


class BrandGuideline(Base, TimestampMixin, TenantMixin):
    __tablename__ = "brand_guidelines"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    version = Column(String(32), default="1.0", nullable=False)
    category = Column(String(64), nullable=False)  # tone_and_voice, terminology, claims, visual, etc.
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    rules = relationship("GuidelineRule", back_populates="guideline", cascade="all, delete-orphan")


class GuidelineRule(Base, TimestampMixin):
    __tablename__ = "guideline_rules"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    guideline_id = Column(String(64), ForeignKey("brand_guidelines.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_key = Column(String(128), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    severity = Column(String(32), default="medium", nullable=False)  # critical, high, medium, low, info
    rule_config = Column(JSON, default=dict)  # stores prohibited terms, regex patterns, target tone, etc.
    is_active = Column(Boolean, default=True, nullable=False)

    guideline = relationship("BrandGuideline", back_populates="rules")
