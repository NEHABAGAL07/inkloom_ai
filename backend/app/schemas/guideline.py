from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class GuidelineRuleBase(BaseModel):
    category: str
    rule_name: str
    section: Optional[str] = None
    severity_default: str = "medium"
    rule_definition: Dict[str, Any]
    requires_human_review: bool = False
    source_url: Optional[str] = None

    # Compliance Governance & Hierarchy fields
    rule_type: str = "brand_standard"  # legal_mandatory, legal_policy, brand_standard, campaign_rule, advisory
    priority_level: int = 3            # 1 (mandatory legal) to 5 (advisory)
    jurisdiction: str = "Global"       # US, EU, UK, Global
    industry: str = "General"          # SaaS, Fintech, Healthcare, General
    content_channels: Optional[List[str]] = None
    authoritative_source: Optional[str] = None
    source_revision_date: Optional[str] = None
    effective_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    verification_status: str = "verified"  # verified, unverified_suggestion, requires_legal_review, overdue_for_review
    evidence_required: bool = False
    evidence_description: Optional[str] = None
    required_disclosure: Optional[str] = None


class GuidelineRuleCreate(GuidelineRuleBase):
    pass


class GuidelineRuleResponse(GuidelineRuleBase):
    id: str
    guideline_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandGuidelineBase(BaseModel):
    name: str
    description: Optional[str] = None
    version: str = "1.0.0"
    is_active: bool = True
    jurisdiction: str = "Global"
    industry: str = "General"
    product_category: Optional[str] = "Enterprise Software"


class BrandGuidelineCreate(BrandGuidelineBase):
    rules: Optional[List[GuidelineRuleCreate]] = None


class BrandGuidelineResponse(BrandGuidelineBase):
    id: str
    organization_id: str
    status: str = "published"
    published_at: Optional[datetime] = None
    published_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    rules: Optional[List[GuidelineRuleResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class BrandGuidelineProfileResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    version: str
    status: str  # draft, submitted, changes_requested, rejected, approved, published, archived
    is_active: bool
    published_at: Optional[datetime] = None
    published_by: Optional[str] = None

    # Role and authorization flags
    is_manager: bool = False
    can_edit: bool = False
    can_review_legal: bool = False
    can_publish: bool = False
    user_role: str = "viewer"

    # Governance workflow metadata
    submission_notes: Optional[str] = None
    submitted_by: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_decision: Optional[str] = None
    review_rationale: Optional[str] = None
    requires_legal_approval: bool = True

    # Jurisdiction and applicability scope
    jurisdiction: str = "Global"
    industry: str = "General"
    product_category: Optional[str] = "Enterprise Software"
    content_channels: Optional[List[str]] = None
    effective_date: Optional[datetime] = None
    review_date: Optional[datetime] = None

    # Data payloads (Draft only visible to authorized editors)
    draft_data: Optional[Dict[str, Any]] = None
    published_data: Optional[Dict[str, Any]] = None
    rules: Optional[List[GuidelineRuleResponse]] = None

    # Product legal disclaimer
    compliance_disclaimer: str = (
        "Inkloom AI supports compliance workflows. Guidelines and automated audit results "
        "do not constitute a formal legal opinion or guarantee dispute immunity."
    )

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandGuidelineDraftUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    jurisdiction: Optional[str] = None
    industry: Optional[str] = None
    product_category: Optional[str] = None
    content_channels: Optional[List[str]] = None
    draft_data: Dict[str, Any]


class BrandGuidelineSubmitReviewRequest(BaseModel):
    submission_notes: str = Field(..., min_length=3, description="Summary of changes proposed for legal review")
    requires_legal_approval: bool = True
    jurisdiction: Optional[str] = None
    industry: Optional[str] = None
    content_channels: Optional[List[str]] = None


class BrandGuidelineReviewDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected|changes_requested)$")
    rationale: str = Field(..., min_length=5, description="Legal/compliance rationale for decision")


class BrandGuidelinePublishRequest(BaseModel):
    version: str = Field(..., min_length=1)
    changelog: Optional[str] = None
    confirm_legal_clearance: bool = True


class BrandGuidelineRollbackRequest(BaseModel):
    version_id: str
    rationale: str = Field(..., min_length=5)


class BrandGuidelineVersionResponse(BaseModel):
    id: str
    guideline_id: str
    organization_id: str
    version: str
    changelog: Optional[str] = None
    published_by: str
    published_at: datetime
    snapshot_data: Dict[str, Any]
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    approval_rationale: Optional[str] = None
    jurisdiction: str = "Global"
    industry: str = "General"
    effective_date: Optional[datetime] = None
    review_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EffectiveSettingsResponse(BaseModel):
    media_type: str
    effective_settings: Dict[str, Any]
    inherited_keys: List[str]
    overridden_keys: List[str]
    conflicts: List[Dict[str, Any]] = Field(default_factory=list)


class RuleConflictItem(BaseModel):
    rule_name: str
    conflicting_with: str
    category: str
    priority_high: str
    priority_low: str
    explanation: str
    escalate_to_legal: bool
    remediation_suggestion: str


class ConflictCheckResponse(BaseModel):
    total_conflicts: int
    conflicts: List[RuleConflictItem]
    priority_hierarchy: List[Dict[str, Any]]
    compliance_disclaimer: str


class ClarificationReportCreate(BaseModel):
    rule_reference: str = Field(..., min_length=2)
    report_type: str = Field(default="unclear", pattern="^(unclear|conflicting|missing_exception|outdated)$")
    description: str = Field(..., min_length=5)


class ClarificationReportResponse(BaseModel):
    id: str
    guideline_id: str
    organization_id: str
    user_email: str
    user_name: str
    rule_reference: str
    report_type: str
    description: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClarificationReportResolve(BaseModel):
    status: str = Field(..., pattern="^(resolved|dismissed)$")
    resolution_notes: str = Field(..., min_length=3)


class StarterTemplateRule(BaseModel):
    category: str
    rule_name: str
    rule_type: str
    priority_level: int
    jurisdiction: str
    industry: str
    authoritative_source: Optional[str] = None
    source_url: Optional[str] = None
    verification_status: str
    severity_default: str
    requires_human_review: bool
    description: str
    rule_definition: Dict[str, Any]
    required_disclosure: Optional[str] = None
