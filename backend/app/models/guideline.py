from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class BrandGuideline(TimestampedModel):
    __tablename__ = "brand_guidelines"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(50), default="1.0.0", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Workflow & Publication status:
    # 'draft', 'submitted', 'changes_requested', 'rejected', 'approved', 'published', 'archived'
    status = Column(String(50), default="draft", nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    published_by = Column(String(255), nullable=True)

    # Review & Approval tracking
    submission_notes = Column(Text, nullable=True)
    submitted_by = Column(String(255), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_decision = Column(String(50), nullable=True)  # approved, rejected, changes_requested
    review_rationale = Column(Text, nullable=True)
    requires_legal_approval = Column(Boolean, default=True, nullable=False)

    # Applicability scope & metadata
    jurisdiction = Column(String(100), default="Global", nullable=False)
    industry = Column(String(100), default="General", nullable=False)
    product_category = Column(String(100), default="Enterprise Software", nullable=True)
    content_channels = Column(JSON, nullable=True)
    effective_date = Column(DateTime(timezone=True), nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)

    # Structured Brand Guidelines Payload (Identity, Voice, Color, Typography, Logos, Layout, Rules, Media, Compliance)
    draft_data = Column(JSON, nullable=True)
    published_data = Column(JSON, nullable=True)

    organization = relationship("Organization", back_populates="guidelines")
    rules = relationship("GuidelineRule", back_populates="guideline", cascade="all, delete-orphan")
    versions = relationship("BrandGuidelineVersion", back_populates="guideline", cascade="all, delete-orphan", order_by="desc(BrandGuidelineVersion.created_at)")
    clarification_reports = relationship("GuidelineClarificationReport", back_populates="guideline", cascade="all, delete-orphan")


class BrandGuidelineVersion(TimestampedModel):
    __tablename__ = "brand_guideline_versions"

    guideline_id = Column(String(36), ForeignKey("brand_guidelines.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    changelog = Column(Text, nullable=True)
    published_by = Column(String(255), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False)
    snapshot_data = Column(JSON, nullable=False)

    # Legal approval audit trail
    approved_by = Column(String(255), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approval_rationale = Column(Text, nullable=True)
    jurisdiction = Column(String(100), default="Global", nullable=False)
    industry = Column(String(100), default="General", nullable=False)
    effective_date = Column(DateTime(timezone=True), nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)

    guideline = relationship("BrandGuideline", back_populates="versions")


class GuidelineRule(TimestampedModel):
    __tablename__ = "guideline_rules"

    guideline_id = Column(String(36), ForeignKey("brand_guidelines.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # tone_voice, terminology, claim_verification, visual_brand, accessibility, legal_compliance
    rule_name = Column(String(255), nullable=False)
    section = Column(String(255), nullable=True)
    severity_default = Column(String(50), default="medium", nullable=False)  # critical, high, medium, low, info
    rule_definition = Column(JSON, nullable=False)  # holds patterns, forbidden words, tone attributes, claim benchmarks
    requires_human_review = Column(Boolean, default=False, nullable=False)
    source_url = Column(String(512), nullable=True)

    # Governance rule hierarchy & verification metadata
    rule_type = Column(String(50), default="brand_standard", nullable=False)  # legal_mandatory, legal_policy, brand_standard, campaign_rule, advisory
    priority_level = Column(Integer, default=3, nullable=False)  # 1 (highest / mandatory legal) to 5 (advisory)
    jurisdiction = Column(String(100), default="Global", nullable=False)
    industry = Column(String(100), default="General", nullable=False)
    content_channels = Column(JSON, nullable=True)
    authoritative_source = Column(String(255), nullable=True)
    source_revision_date = Column(String(100), nullable=True)
    effective_date = Column(DateTime(timezone=True), nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)
    verification_status = Column(String(50), default="verified", nullable=False)  # verified, unverified_suggestion, requires_legal_review, overdue_for_review
    evidence_required = Column(Boolean, default=False, nullable=False)
    evidence_description = Column(Text, nullable=True)
    required_disclosure = Column(Text, nullable=True)

    guideline = relationship("BrandGuideline", back_populates="rules")


class GuidelineClarificationReport(TimestampedModel):
    __tablename__ = "guideline_clarification_reports"

    guideline_id = Column(String(36), ForeignKey("brand_guidelines.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=False)
    user_name = Column(String(255), nullable=False)
    rule_reference = Column(String(255), nullable=False)
    report_type = Column(String(50), default="unclear", nullable=False)  # unclear, conflicting, missing_exception, outdated
    description = Column(Text, nullable=False)
    status = Column(String(50), default="open", nullable=False)  # open, in_review, resolved, dismissed
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    guideline = relationship("BrandGuideline", back_populates="clarification_reports")

