"""
Knowledge Item & Provenance Pydantic Schemas
Defines request/response contracts for enterprise knowledge items, legal sources,
certified facts, and empirical benchmarks.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class KnowledgeSourceType(str, Enum):
    # Legal & Statutory Sources
    LEGISLATION = "legislation"
    REGULATION = "regulation"
    OFFICIAL_GUIDANCE = "official_guidance"
    INTERNAL_COMPANY_POLICY = "internal_company_policy"
    MODEL_GENERATED_EXPLANATION = "model_generated_explanation"

    # Empirical & Technical Knowledge
    VERIFIED_FACT = "verified_fact"
    CERTIFIED_CLAIM = "certified_claim"

    # Brand Standards & Design
    BRAND_RULE = "brand_rule"
    ASSET_METADATA = "asset_metadata"


class KnowledgeCategory(str, Enum):
    LEGAL_COMPLIANCE = "legal_compliance"
    CLAIM_VERIFICATION = "claim_verification"
    TONE_VOICE = "tone_voice"
    TERMINOLOGY = "terminology"
    VISUAL_BRAND = "visual_brand"
    ACCESSIBILITY = "accessibility"
    EDITORIAL_STANDARDS = "editorial_standards"
    PRODUCT_SPECIFICATION = "product_specification"


class EvidenceStatus(str, Enum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    UNVERIFIED = "unverified"
    UNAVAILABLE = "unavailable"


class RuleApplicability(str, Enum):
    APPLICABLE = "applicable"
    NOT_APPLICABLE = "not_applicable"
    UNCERTAIN = "uncertain"
    CONFLICTING_REQUIREMENTS = "conflicting_requirements"


class RulePriorityType(str, Enum):
    LEGAL_MANDATORY = "legal_mandatory"        # Priority 1: Statutory / Regulatory
    LEGAL_POLICY = "legal_policy"              # Priority 2: Board / Internal Legal Policy
    BRAND_STANDARD = "brand_standard"          # Priority 3: Official Brand Identity & Tone
    CAMPAIGN_RULE = "campaign_rule"            # Priority 4: Channel / Campaign Specific
    ADVISORY = "advisory"                      # Priority 5: Stylistic / Recommendation


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    UNVERIFIED = "unverified"
    CONTRADICTED = "contradicted"
    REQUIRES_LEGAL_REVIEW = "requires_legal_review"
    OVERDUE_FOR_REVIEW = "overdue_for_review"


class KnowledgeItemBase(BaseModel):
    source_type: KnowledgeSourceType
    category: KnowledgeCategory
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    content_payload: Dict[str, Any] = Field(default_factory=dict)
    source_reference: Optional[str] = Field(None, max_length=512)
    source_url: Optional[str] = Field(None, max_length=512)
    jurisdiction: str = Field(default="Global", max_length=100)
    industry: str = Field(default="General", max_length=100)
    content_channels: Optional[List[str]] = Field(default_factory=list)
    publication_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    version: str = Field(default="1.0.0", max_length=50)
    rule_type: RulePriorityType = RulePriorityType.BRAND_STANDARD
    priority_level: int = Field(default=3, ge=1, le=5)
    authoritative_source: Optional[str] = Field(None, max_length=255)
    responsible_owner: Optional[str] = Field(None, max_length=255, description="Designated human owner or steward")
    tags: Optional[List[str]] = Field(default_factory=list)


class KnowledgeItemCreate(KnowledgeItemBase):
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    evidence_status: EvidenceStatus = EvidenceStatus.UNAVAILABLE
    is_active: bool = True

    @model_validator(mode="after")
    def validate_model_generated_not_verified(self):
        if (
            self.source_type == KnowledgeSourceType.MODEL_GENERATED_EXPLANATION
            and self.verification_status == VerificationStatus.VERIFIED
        ):
            raise ValueError(
                "Model-generated explanations cannot be created as 'verified'. "
                "AI-generated rationale must remain unverified or undergo human legal review."
            )
        return self


class KnowledgeItemUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content_payload: Optional[Dict[str, Any]] = None
    source_reference: Optional[str] = None
    source_url: Optional[str] = None
    jurisdiction: Optional[str] = None
    industry: Optional[str] = None
    content_channels: Optional[List[str]] = None
    publication_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    version: Optional[str] = None
    rule_type: Optional[RulePriorityType] = None
    priority_level: Optional[int] = Field(None, ge=1, le=5)
    authoritative_source: Optional[str] = None
    responsible_owner: Optional[str] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None


class KnowledgeVerificationRequest(BaseModel):
    verification_status: VerificationStatus
    verification_rationale: str = Field(..., min_length=3)
    evidence_status: Optional[EvidenceStatus] = None

    @model_validator(mode="after")
    def validate_verification(self):
        if self.verification_status == VerificationStatus.VERIFIED and not self.verification_rationale:
            raise ValueError("Verification rationale is required when certifying a knowledge item.")
        return self


class KnowledgeItemResponse(KnowledgeItemBase):
    id: str
    organization_id: str
    verification_status: VerificationStatus
    evidence_status: EvidenceStatus
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_rationale: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeSearchFilter(BaseModel):
    query: Optional[str] = None
    source_types: Optional[List[KnowledgeSourceType]] = None
    categories: Optional[List[KnowledgeCategory]] = None
    jurisdictions: Optional[List[str]] = None
    verification_statuses: Optional[List[VerificationStatus]] = None
    rule_types: Optional[List[RulePriorityType]] = None
    max_priority_level: Optional[int] = Field(None, ge=1, le=5)
    channel: Optional[str] = None
    is_active: bool = True
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class UnifiedRetrievalResultItem(BaseModel):
    id: str
    source_type: str
    category: str
    title: str
    summary_or_excerpt: str
    provenance_reference: Optional[str] = None
    source_url: Optional[str] = None
    jurisdiction: str = "Global"
    priority_level: int = 3
    rule_type: str = "brand_standard"
    verification_status: str = "unverified"
    evidence_status: str = "unavailable"
    is_binding: bool = False
    relevance_score: float = 1.0
    responsible_owner: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UnifiedRetrievalResponse(BaseModel):
    organization_id: str
    query: Optional[str] = None
    total_matches: int
    results: List[UnifiedRetrievalResultItem]
    unavailable_evidence_requested: List[str] = Field(default_factory=list)
    search_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
