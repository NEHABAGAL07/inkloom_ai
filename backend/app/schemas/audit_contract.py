"""
Shared Audit Result Pydantic Contract
Conforms strictly to contracts/audit-result.schema.json
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class OverallAuditStatus(str, Enum):
    COMPLIANT = "compliant"
    NEEDS_REVIEW = "needs_review"
    NON_COMPLIANT = "non_compliant"
    ERROR = "error"


class FindingCategory(str, Enum):
    TONE_VOICE = "tone_voice"
    TERMINOLOGY = "terminology"
    CLAIM_VERIFICATION = "claim_verification"
    VISUAL_BRAND = "visual_brand"
    ACCESSIBILITY = "accessibility"
    EDITORIAL_STANDARDS = "editorial_standards"
    LEGAL_COMPLIANCE = "legal_compliance"


class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingStatus(str, Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    DISMISSED = "dismissed"
    MANUAL_CHECK_REQUIRED = "manual_check_required"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    UNVERIFIED = "unverified"
    CONTRADICTED = "contradicted"
    NOT_APPLICABLE = "not_applicable"


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class FindingLocation(BaseModel):
    page_number: Optional[int] = Field(default=None, ge=1)
    line_number: Optional[int] = Field(default=None, ge=1)
    start_char: Optional[int] = Field(default=None, ge=0)
    end_char: Optional[int] = Field(default=None, ge=0)
    timestamp_seconds: Optional[float] = Field(default=None, ge=0.0)
    bounding_box: Optional[BoundingBox] = None


class SourceReference(BaseModel):
    guideline_id: Optional[str] = None
    section: Optional[str] = None
    rule_name: str
    source_url: Optional[str] = None
    is_external: Optional[bool] = False
    verification_status: VerificationStatus


class SuggestedCorrection(BaseModel):
    replacement_text: str
    rationale: str
    preserves_intent: Optional[bool] = True


class Finding(BaseModel):
    id: str
    category: FindingCategory
    severity: FindingSeverity
    title: str
    message: str
    evidence: Optional[str] = None
    source_reference: Optional[SourceReference] = None
    confidence: float = Field(ge=0.0, le=1.0)
    suggested_correction: Optional[SuggestedCorrection] = None
    status: FindingStatus = FindingStatus.OPEN
    location: Optional[FindingLocation] = None
    requires_human_review: bool = False

    model_config = ConfigDict(extra="forbid")


class AuditSummary(BaseModel):
    compliance_score: float = Field(ge=0.0, le=100.0)
    total_findings: int = Field(ge=0)
    critical_count: int = Field(ge=0)
    high_count: int = Field(ge=0)
    medium_count: int = Field(ge=0)
    low_count: int = Field(ge=0)
    info_count: int = Field(ge=0)
    human_review_required: bool
    verdict_overview: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class EngineMetadata(BaseModel):
    engine_version: str
    execution_time_ms: float = Field(ge=0.0)
    modules_executed: List[str]
    models_used: Optional[List[str]] = Field(default_factory=list)
    warnings: Optional[List[str]] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class AuditResult(BaseModel):
    schema_version: str = "1.0.0"
    audit_id: str
    content_id: str
    revision_id: Optional[str] = None
    overall_status: OverallAuditStatus
    summary: AuditSummary
    findings: List[Finding]
    created_at: datetime
    engine_metadata: EngineMetadata

    model_config = ConfigDict(extra="forbid")
