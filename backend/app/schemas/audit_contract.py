"""
Shared Audit Result Pydantic Contract
Conforms strictly to contracts/audit-result.schema.json
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, model_validator


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
    MARKETING_QUALITY = "marketing_quality"
    CROSS_RULE_CONFLICT = "cross_rule_conflict"
    POLICY = "editorial_standards"


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
    SUPPORTED = "supported"
    UNAVAILABLE = "unavailable"


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
    message: str = ""
    evidence: Optional[str] = None
    source_reference: Optional[SourceReference] = None
    confidence: float = Field(ge=0.0, le=1.0)
    suggested_correction: Optional[SuggestedCorrection] = None
    status: FindingStatus = FindingStatus.OPEN
    location: Optional[FindingLocation] = None
    requires_human_review: bool = False

    # Extended Phase 2 Evidence & Provenance Fields
    original_text: Optional[str] = None
    explanation: Optional[str] = None
    rule_reference: Optional[str] = None
    evidence_status: Optional[str] = None
    evidence_references: Optional[List[str]] = Field(default_factory=list)
    jurisdiction: Optional[str] = None
    correction_rationale: Optional[str] = None
    review_required: bool = False
    limitations: Optional[str] = None
    alternative_punchlines: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="before")
    @classmethod
    def sync_finding_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        # Synchronize aliases for bidirectional contract compatibility
        if "explanation" in data and not data.get("message"):
            data["message"] = data["explanation"]
        elif "message" in data and not data.get("explanation"):
            data["explanation"] = data["message"]

        if "original_text" in data and not data.get("evidence"):
            data["evidence"] = data["original_text"]
        elif "evidence" in data and not data.get("original_text"):
            data["original_text"] = data["evidence"]

        if data.get("review_required") is True:
            data["requires_human_review"] = True
        elif data.get("requires_human_review") is True:
            data["review_required"] = True

        if not data.get("correction_rationale") and data.get("suggested_correction"):
            corr = data["suggested_correction"]
            if isinstance(corr, dict):
                data["correction_rationale"] = corr.get("rationale")
            elif hasattr(corr, "rationale"):
                data["correction_rationale"] = corr.rationale

        if not data.get("evidence_status") and data.get("source_reference"):
            sr = data["source_reference"]
            if isinstance(sr, dict):
                data["evidence_status"] = sr.get("verification_status")
            elif hasattr(sr, "verification_status"):
                data["evidence_status"] = sr.verification_status.value if hasattr(sr.verification_status, "value") else str(sr.verification_status)

        return data


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
