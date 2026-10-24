"""
Integration Contracts for Future AI Capabilities
Defines typed request/response schemas for:
1. Advanced Content Audit Engine
2. Marketing Copilot
3. Designer Copilot
4. Legal Research & Compliance Copilot
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.ai_context import (
    SharedAIContext,
    BrandRuleContext,
    VerifiedFactContext,
    LegalSourceContext,
    RuleConflictDetail,
)
from app.schemas.audit_contract import OverallAuditStatus, Finding, AuditSummary, EngineMetadata


# -------------------------------------------------------------
# 1. Advanced Content Audit Engine Contract
# -------------------------------------------------------------
class AuditExecutionRequest(BaseModel):
    submission_id: str
    revision_id: Optional[str] = None
    content_text: Optional[str] = None
    media_type: str = "text/plain"
    channels: Optional[List[str]] = Field(default_factory=lambda: ["web"])
    target_jurisdiction: Optional[str] = "Global"
    dry_run: bool = False


class AuditExecutionResponse(BaseModel):
    audit_run_id: str
    submission_id: str
    revision_id: Optional[str] = None
    overall_status: OverallAuditStatus
    summary: AuditSummary
    findings: List[Finding]
    applicable_rules: List[BrandRuleContext]
    verified_facts_evaluated: List[VerifiedFactContext]
    conflicts_detected: List[RuleConflictDetail]
    engine_metadata: EngineMetadata

    model_config = ConfigDict(extra="ignore")


# -------------------------------------------------------------
# 2. Marketing Copilot Contract
# -------------------------------------------------------------
class MarketingCopilotRequest(BaseModel):
    prompt: str = Field(..., min_length=3)
    campaign_theme: Optional[str] = None
    channel: str = Field(default="web", description="Target distribution channel (e.g. social, web, email)")
    target_audience: Optional[str] = None
    content_type: str = Field(default="copy", description="Headline, paragraph, ad_copy, or article")
    requested_tone: Optional[str] = None
    factual_topics: Optional[List[str]] = Field(default_factory=list)


class MarketingCopilotResponse(BaseModel):
    copilot_session_id: str
    suggested_copy: str
    tone_alignment_notes: str
    used_verified_facts: List[VerifiedFactContext]
    checked_brand_rules: List[BrandRuleContext]
    disclaimers_required: List[str]
    unverified_claim_warnings: List[str]
    confidence_score: float = Field(ge=0.0, le=1.0)
    requires_human_approval: bool = True

    model_config = ConfigDict(extra="ignore")


# -------------------------------------------------------------
# 3. Designer Copilot Contract
# -------------------------------------------------------------
class DesignerCopilotRequest(BaseModel):
    asset_type: str = Field(default="logo", description="logo, color_palette, typography, or layout")
    visual_context: Optional[str] = None
    target_channel: str = Field(default="digital_display")
    color_palette_query: Optional[str] = None
    layout_constraints: Optional[Dict[str, Any]] = None


class WCAGContrastCheck(BaseModel):
    foreground_hex: str
    background_hex: str
    contrast_ratio: float
    wcag_aa_passed: bool
    wcag_aaa_passed: bool
    is_mandatory_legal: bool = True


class DesignerCopilotResponse(BaseModel):
    copilot_session_id: str
    approved_asset_urls: List[str]
    color_specifications: List[Dict[str, Any]]
    contrast_evaluations: List[WCAGContrastCheck]
    typography_rules: List[BrandRuleContext]
    safe_area_margins: Dict[str, Any]
    design_recommendations: List[str]
    requires_human_signoff: bool = True

    model_config = ConfigDict(extra="ignore")


# -------------------------------------------------------------
# 4. Legal Research & Compliance Copilot Contract
# -------------------------------------------------------------
class LegalCopilotRequest(BaseModel):
    query_text: str = Field(..., min_length=3)
    jurisdiction: str = Field(default="Global")
    industry: Optional[str] = None
    content_excerpt: Optional[str] = None
    target_claim: Optional[str] = None
    include_case_law_guidance: bool = True


class LegalCopilotResponse(BaseModel):
    copilot_session_id: str
    query_analyzed: str
    jurisdiction_applied: str
    applicable_statutes: List[LegalSourceContext]
    regulations: List[LegalSourceContext]
    agency_guidance: List[LegalSourceContext]
    internal_policies: List[LegalSourceContext]
    conflicts_identified: List[RuleConflictDetail]
    binding_legal_disclaimers: List[str]
    risk_level: str = Field(default="low", description="low, medium, high, critical")
    statutory_citations: List[str]
    legal_opinion_disclaimer: str = (
        "LEGAL ADVISORY NOTICE: Inkloom AI outputs provide organizational research and automated rule "
        "matching. They do NOT constitute formal legal advice or create an attorney-client relationship. "
        "Independent verification by an authorized Legal Officer is required."
    )
    requires_human_signoff: bool = True

    model_config = ConfigDict(extra="ignore")
