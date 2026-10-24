"""
Knowledge Item & Provenance Model for AI Brand Governance
Captures verified product facts, certified promotional claims, legal sources,
regulatory references, and approved brand knowledge with full provenance tracking.
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class KnowledgeItem(TimestampedModel):
    __tablename__ = "knowledge_items"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Source classification:
    # 'legislation', 'regulation', 'official_guidance', 'internal_company_policy',
    # 'model_generated_explanation', 'verified_fact', 'certified_claim', 'brand_rule', 'asset_metadata'
    source_type = Column(String(50), nullable=False, index=True)

    # Functional category:
    # 'legal_compliance', 'claim_verification', 'tone_voice', 'terminology',
    # 'visual_brand', 'accessibility', 'editorial_standards', 'product_specification'
    category = Column(String(50), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Structured knowledge payload:
    # Stores benchmark numbers, citation clauses, replacement text, trigger patterns, or operational limits
    content_payload = Column(JSON, nullable=False, default=dict)

    # Provenance and source citations:
    # E.g. 'FTC Act 15 U.S.C. § 45(a)(1)', 'AICPA SOC 2 Type II Report 2025'
    source_reference = Column(String(512), nullable=True)
    # Original source URL if genuine and accessible; never fabricated
    source_url = Column(String(512), nullable=True)

    # Scope & jurisdiction
    jurisdiction = Column(String(100), default="Global", nullable=False, index=True)
    industry = Column(String(100), default="General", nullable=False, index=True)
    content_channels = Column(JSON, nullable=True)  # e.g., ["social", "web", "press_release", "packaging"]

    # Effective lifecycle dates
    publication_date = Column(DateTime(timezone=True), nullable=True)
    effective_date = Column(DateTime(timezone=True), nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)
    version = Column(String(50), default="1.0.0", nullable=False)

    # Human-authoritative verification state:
    # 'verified', 'unverified', 'contradicted', 'requires_legal_review', 'overdue_for_review'
    # Core principle: Never marked verified merely because an LLM says it is correct.
    verification_status = Column(String(50), default="unverified", nullable=False, index=True)

    # Empirical evidence state:
    # 'supported', 'contradicted', 'unverified', 'unavailable'
    evidence_status = Column(String(50), default="unavailable", nullable=False, index=True)

    # Governance rule hierarchy:
    # 'legal_mandatory' (1), 'legal_policy' (2), 'brand_standard' (3), 'campaign_rule' (4), 'advisory' (5)
    rule_type = Column(String(50), default="brand_standard", nullable=False, index=True)
    priority_level = Column(Integer, default=3, nullable=False, index=True)

    # Attribution & human accountability
    authoritative_source = Column(String(255), nullable=True)
    verified_by = Column(String(255), nullable=True)  # User ID or officer name who certified the item
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_rationale = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False, index=True)
    tags = Column(JSON, nullable=True, default=list)

    organization = relationship("Organization", back_populates="knowledge_items")
