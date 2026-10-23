from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class BrandGuideline(TimestampedModel):
    __tablename__ = "brand_guidelines"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(50), default="1.0.0", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="guidelines")
    rules = relationship("GuidelineRule", back_populates="guideline", cascade="all, delete-orphan")


class GuidelineRule(TimestampedModel):
    __tablename__ = "guideline_rules"

    guideline_id = Column(String(36), ForeignKey("brand_guidelines.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # tone_voice, terminology, claim_verification, visual_brand, accessibility
    rule_name = Column(String(255), nullable=False)
    section = Column(String(255), nullable=True)
    severity_default = Column(String(50), default="medium", nullable=False)  # critical, high, medium, low, info
    rule_definition = Column(JSON, nullable=False)  # holds patterns, forbidden words, tone attributes, claim benchmarks
    requires_human_review = Column(Boolean, default=False, nullable=False)
    source_url = Column(String(512), nullable=True)

    guideline = relationship("BrandGuideline", back_populates="rules")
