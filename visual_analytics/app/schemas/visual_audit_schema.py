"""Schemas for Visual Brand Auditing matching contract and prompt specifications."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AuditSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class VisualFindingCategory(str, Enum):
    VISUAL_COMPLIANCE = "visual_compliance"
    ACCESSIBILITY = "accessibility"
    BRAND_COLOR = "brand_color"
    LOGO_VERIFICATION = "logo_verification"
    PROMOTIONAL_CLAIM = "promotional_claim"
    TERMINOLOGY = "terminology"


class EvidenceStatus(str, Enum):
    DETECTED = "detected"
    NOT_DETECTED = "not_detected"
    INCONCLUSIVE = "inconclusive"
    FALLBACK = "fallback"


class VisualFinding(BaseModel):
    id: str
    category: str
    severity: AuditSeverity
    title: str
    original_text: Optional[str] = None
    explanation: str
    evidence_status: EvidenceStatus = EvidenceStatus.DETECTED
    measured_value: Optional[Any] = None
    required_value: Optional[Any] = None
    suggestion: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    source_reference: Optional[str] = None
    bounding_box: Optional[Dict[str, float]] = None


class ImageMetadata(BaseModel):
    filename: str
    width: int
    height: int
    format: str
    file_size_bytes: int
    aspect_ratio: float


class DominantColor(BaseModel):
    hex: str
    rgb: List[int]
    coverage_pct: float
    is_approved: bool
    nearest_approved_hex: Optional[str] = None
    delta_e: Optional[float] = None


class ColorAnalysisResult(BaseModel):
    dominant_colors: List[DominantColor]
    approved_palette: List[Dict[str, str]]
    off_brand_colors_detected: List[DominantColor]
    palette_adherence_pct: float
    explanation: str


class LogoVerificationResult(BaseModel):
    verification_status: str  # verified_match, possible_match, missing, inconclusive, not_applicable
    matched_logo_id: Optional[str] = None
    matched_logo_name: Optional[str] = None
    similarity_score: float
    threshold_applied: float
    is_compliant: bool
    explanation: str


class AccessibilityContrastResult(BaseModel):
    measured_contrast_ratio: float
    required_contrast_ratio: float
    passes_aa_normal: bool
    passes_aa_large: bool
    passes_aaa_normal: bool
    text_color_hex: Optional[str] = None
    background_color_hex: Optional[str] = None
    estimated_font_size_pt: Optional[float] = None
    text_size_adequate: bool = True
    alt_text_status: str  # provided, missing, generic, not_applicable
    alt_text_warning: Optional[str] = None
    remediation_suggestion: Optional[str] = None


class VisualAuditSummary(BaseModel):
    total_findings: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class VisualAuditResult(BaseModel):
    audit_id: str
    status: str  # completed, failed, warning, inconclusive
    image_metadata: ImageMetadata
    extracted_text: str
    ocr_status: str  # completed, unavailable, no_text_detected, fallback
    ocr_confidence: Optional[float] = None
    summary: VisualAuditSummary
    findings: List[VisualFinding]
    color_analysis: Optional[ColorAnalysisResult] = None
    logo_verification: Optional[LogoVerificationResult] = None
    accessibility: Optional[AccessibilityContrastResult] = None
    created_at: str

    def to_inkloom_contract(self, content_id: Optional[str] = None) -> Dict[str, Any]:
        """Convert to Inkloom AI's canonical shared contract (`contracts/audit-result.schema.json`)."""
        contract_findings = []
        for f in self.findings:
            # Map category into enum values accepted by contracts/audit-result.schema.json
            cat = f.category
            if cat in ("brand_color", "logo_verification", "visual_compliance"):
                standard_cat = "visual_compliance"
            elif cat == "accessibility":
                standard_cat = "accessibility"
            elif cat == "promotional_claim":
                standard_cat = "claim_verification"
            elif cat == "terminology":
                standard_cat = "terminology"
            else:
                standard_cat = "visual_compliance"

            contract_findings.append({
                "id": f.id,
                "category": standard_cat,
                "severity": f.severity.value,
                "title": f.title,
                "message": f.explanation,
                "evidence": f.original_text or (str(f.measured_value) if f.measured_value is not None else None),
                "source_reference": f.source_reference or "Brand Guidelines v1.0",
                "confidence": round(f.confidence, 2),
                "suggested_correction": f.suggestion,
                "status": "flagged",
                "location": {
                    "start_offset": None,
                    "end_offset": None,
                    "line": None,
                    "page": 1,
                    "timestamp_seconds": None,
                    "selector": None,
                    "bounding_box": f.bounding_box,
                } if f.bounding_box else None,
                "requires_human_review": f.severity in (AuditSeverity.CRITICAL, AuditSeverity.HIGH),
            })

        overall_status = "passed"
        if self.summary.critical > 0 or self.summary.high > 0:
            overall_status = "failed"
        elif self.summary.medium > 0:
            overall_status = "warning"
        elif self.summary.low > 0:
            overall_status = "passed"

        summary_text = (
            f"Visual audit completed with {self.summary.total_findings} findings "
            f"({self.summary.critical} critical, {self.summary.high} high, {self.summary.medium} medium, "
            f"{self.summary.low} low). OCR Status: {self.ocr_status}."
        )

        return {
            "schema_version": "1.0.0",
            "audit_id": self.audit_id,
            "content_id": content_id or f"vis-cnt-{self.audit_id[-8:]}",
            "overall_status": overall_status,
            "summary": summary_text,
            "findings": contract_findings,
            "created_at": self.created_at,
            "engine_metadata": {
                "engine_version": "1.0.0-visual-qa",
                "execution_time_ms": 120.0,
                "rules_checked_count": 8,
                "ai_model_used": None,
                "extractors_used": ["image_processor", "ocr_extractor", "color_quantizer"],
            },
        }
