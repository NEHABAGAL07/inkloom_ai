"""
Pydantic Schemas for Phase 5: Evidence-Grounded Legal Copilot
Defines structured data contracts for:
- Compliance Review Intake & Configuration
- Authoritative Legal & Regulatory Source Records
- Claim-by-Claim Factual Verification & Risk Analysis
- Conservative Suggested Wording Revisions
- 10-Section Structured Legal Review Reports
- Reviewer Decisions and Feedback
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class LegalAuthorityLevel(str, Enum):
    """Hierarchy of legal authority."""
    BINDING_LAW = "binding_law"                     # Statutory law, enacted codes, judicial precedent
    OFFICIAL_GUIDANCE = "official_guidance"         # Administrative regulator guidance (FTC, EDPB, SEC)
    ENFORCEMENT_MATERIAL = "enforcement_material"   # Official consent decrees, enforcement actions
    INTERNAL_POLICY = "internal_policy"             # Approved corporate policies, guidelines
    COMMENTARY = "commentary"                       # Non-authoritative legal commentary
    BEST_PRACTICE = "best_practice"                 # General industry compliance recommendation


class EvidenceVerificationStatus(str, Enum):
    """Explicit status of evidence substantiation for marketing claims."""
    SUPPORTED = "supported"                     # Substantiated by verified benchmark or cert
    CONTRADICTED = "contradicted"               # Directly conflicts with known facts or certs
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"  # Claims made without documentation on record
    NOT_CHECKED = "not_checked"                 # Factual check pending or not requested
    CONFLICTING_SOURCES = "conflicting_sources" # Multiple sources present conflicting data


class LegalFindingCategory(str, Enum):
    """Categories of legal and regulatory marketing risk."""
    UNSUPPORTED_PERFORMANCE = "unsupported_performance"
    ABSOLUTE_GUARANTEE = "absolute_guarantee"
    MISLEADING_COMPARISON = "misleading_comparison"
    UNSUBSTANTIATED_STATISTIC = "unsubstantiated_statistic"
    INADEQUATE_DISCLOSURE = "inadequate_disclosure"
    ENDORSEMENT_TESTIMONIAL = "endorsement_testimonial"
    ENVIRONMENTAL_CLAIM = "environmental_claim"
    PRICING_PROMOTIONAL = "pricing_promotional"
    SENSITIVE_REGULATED = "sensitive_regulated"
    PRODUCT_FACT_CONFLICT = "product_fact_conflict"
    VISUAL_DISCLAIMER_MISMATCH = "visual_disclaimer_mismatch"
    AI_TRANSPARENCY_DISCLOSURE = "ai_transparency_disclosure"


class TargetJurisdiction(str, Enum):
    """Supported target jurisdictions."""
    GLOBAL = "Global"
    US = "US"
    US_CA = "US-CA"
    EU = "EU"
    UK = "UK"
    CA = "CA"
    AU = "AU"


class RegulatedProductCategory(str, Enum):
    """Regulated industry sectors requiring heightened legal scrutiny."""
    B2B_ENTERPRISE_SAAS = "b2b_enterprise_saas"
    FINANCIAL_SERVICES = "financial_services"
    HEALTHCARE_LIFE_SCIENCES = "healthcare_life_sciences"
    CONSUMER_TECH_AI = "consumer_tech_ai"
    GENERAL_COMMERCIAL = "general_commercial"


class FindingSeverityLevel(str, Enum):
    """Triage severity indicator (not a judicial determination)."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


# =========================================================================
# Source Records & Provenance
# =========================================================================

class AuthoritativeLegalSource(BaseModel):
    """
    Verified citation from an authoritative statutory code or official regulator.
    Zero fabrication rule: No synthetic provisions or URLs.
    """
    source_id: str
    title: str
    issuing_authority: str
    jurisdiction: str
    authority_level: LegalAuthorityLevel
    citation: str
    publication_or_effective_date: Optional[str] = None
    section_or_provision: Optional[str] = None
    source_url: Optional[str] = None
    retrieval_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    excerpt: str
    is_binding: bool = False

    model_config = ConfigDict(from_attributes=True)


# =========================================================================
# Claim Verification & Findings
# =========================================================================

class LegalClaimReviewItem(BaseModel):
    """
    Detailed evaluation of a specific marketing claim or content segment.
    """
    id: str
    claim_text: str
    location: Optional[str] = None
    category: LegalFindingCategory
    severity: FindingSeverityLevel
    issue_explanation: str
    applicable_jurisdiction: str
    supporting_citations: List[AuthoritativeLegalSource] = Field(default_factory=list)
    evidence_status: EvidenceVerificationStatus
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in finding identification")
    suggested_correction: Optional[str] = None
    question_for_content_owner: Optional[str] = None
    requires_qualified_legal_review: bool = True
    uncertainty_or_limitation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================================
# Conservative Revisions
# =========================================================================

class ConservativeRevisionSuggestion(BaseModel):
    """
    Conservative alternative wording designed to preserve marketing intent
    while eliminating legal ambiguity or unverified absolute guarantees.
    """
    id: str
    original_text: str
    proposed_text: str
    material_change_explanation: str
    supporting_evidence_rationale: str
    remaining_assumptions: List[str] = Field(default_factory=list)
    is_ai_generated: bool = True
    is_approved: bool = False

    model_config = ConfigDict(from_attributes=True)


# =========================================================================
# Intake & Review Requests
# =========================================================================

class LegalReviewRequest(BaseModel):
    """
    Structured intake for an evidence-grounded legal compliance review.
    Accepts saved draft IDs or direct standalone content.
    """
    title: Optional[str] = Field(None, description="Campaign or review title")
    content_text: str = Field(..., min_length=1, description="Content copy or transcript to review")
    submission_id: Optional[str] = Field(None, description="Linked ContentSubmission ID if reviewing saved draft")
    revision_id: Optional[str] = Field(None, description="Linked ContentRevision ID")
    product_name: Optional[str] = Field(None, description="Product or service name")
    intended_audience: Optional[str] = Field(None, description="Target demographic, B2B/B2C, consumer vs professional")
    target_jurisdiction: TargetJurisdiction = Field(default=TargetJurisdiction.GLOBAL, description="Target country or jurisdiction")
    marketing_channel: Optional[str] = Field("web", description="Channel (social, ad, email, website, print)")
    regulated_category: RegulatedProductCategory = Field(default=RegulatedProductCategory.B2B_ENTERPRISE_SAAS)
    campaign_objective: Optional[str] = Field(None, description="Marketing intent or campaign goal")
    known_product_claims: List[str] = Field(default_factory=list, description="Explicit claims made by product team")
    supporting_evidence_notes: Optional[str] = Field(None, description="Internal test results or documentation notes")
    specific_legal_questions: List[str] = Field(default_factory=list, description="Specific questions from counsel or marketing")

    model_config = ConfigDict(extra="ignore")


# =========================================================================
# Full 10-Section Legal Review Report
# =========================================================================

class CampaignContextScope(BaseModel):
    product_name: str = "Not Specified"
    intended_audience: str = "General Audience"
    marketing_channel: str = "web"
    regulated_category: str = "general_commercial"
    campaign_objective: str = "Commercial Promotion"
    content_word_count: int = 0

    model_config = ConfigDict(extra="allow")

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)


class JurisdictionAssumptionsScope(BaseModel):
    target_jurisdiction: str = "Global"
    statutory_scope: List[str] = Field(default_factory=list)
    assumptions_made: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)


class LegalReviewReport(BaseModel):
    """
    Formal 10-section compliance evaluation report.
    Grounds findings in authoritative law, flags missing evidence,
    and preserves human decision-making boundaries.
    """
    report_id: str
    review_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submission_id: Optional[str] = None
    revision_id: Optional[str] = None

    # Section 1: Executive Summary & Verdict Overview
    executive_summary: str
    overall_risk_verdict: str  # e.g. "Action Required Before Public Release", "Low Risk", "Severe Legal Exposure"
    compliance_score: float = Field(ge=0.0, le=100.0)

    # Section 2: Content & Campaign Context
    campaign_context: CampaignContextScope

    # Section 3: Jurisdictions & Legal Assumptions Considered
    jurisdictions_and_assumptions: JurisdictionAssumptionsScope

    # Section 4: High-Priority Potential Risks (Triage list)
    high_priority_risks: List[str]

    # Section 5: Claim-by-Claim Analysis & Evidence Matrix
    claims_analysis: List[LegalClaimReviewItem]

    # Section 6: Source & Evidence Register
    authoritative_sources_register: List[AuthoritativeLegalSource]

    # Section 7: Suggested Conservative Wording Changes
    suggested_wording_revisions: List[ConservativeRevisionSuggestion]

    # Section 8: Missing Evidence & Unanswered Questions
    missing_evidence_and_questions: List[str]

    # Section 9: Items Requiring Qualified Legal Review
    items_requiring_human_legal_counsel: List[str]

    # Section 10: Limitations, Disclaimers, and Date of Review
    limitations_and_disclaimers: str
    review_date: str

    model_config = ConfigDict(from_attributes=True)


class ApplyRevisionRequest(BaseModel):
    """Explicit request by an authorized user to apply a conservative revision."""
    revision_suggestion_id: str
    updated_text: str
    change_summary: str = Field(default="Applied conservative legal wording revision")


class RecordLegalFeedbackRequest(BaseModel):
    """Records human legal counsel sign-off, rejection, or changes requested."""
    action: str = Field(..., description="approve, reject, request_changes")
    comments: Optional[str] = None
    conditions_or_stipulations: Optional[List[str]] = Field(default_factory=list)
