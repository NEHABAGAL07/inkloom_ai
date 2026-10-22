"""AI Brand Governance Audit Engine.

Orchestrates deterministic rule-based checks and optional LLM model adapters.
Produces strictly validated results conforming to `contracts/audit-result.schema.json`.
"""

import time
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.schemas.audit import (
    AuditResultSchema,
    FindingSchema,
    EngineMetadataSchema,
)
from app.schemas.common import AuditStatusEnum, FindingSeverityEnum
from app.services.ai_audit.guideline_retrieval import GuidelineRetriever, RetrievedRule
from app.services.ai_audit.terminology import TerminologyChecker
from app.services.ai_audit.tone_analysis import ToneAnalyzer
from app.services.ai_audit.claim_checking import ClaimChecker
from app.core.config import settings


class LLMModelAdapter:
    """Abstract interface for optional generative AI model adapters."""

    def __init__(self, provider: str, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.provider = provider
        self.api_key = api_key
        self.model_name = model_name

    def is_configured(self) -> bool:
        return bool(self.api_key and self.provider != "rule_based_fallback")

    def run_advanced_audit(self, text: str, rules: List[RetrievedRule]) -> List[FindingSchema]:
        """Hook for calling external LLM providers (e.g. Gemini, OpenAI) if configured."""
        # Baseline scaffold returns empty; falls back to deterministic rule checkers
        return []


class AIAuditEngine:
    """Core AI audit engine for brand governance."""

    ENGINE_VERSION = "inkloom-audit-engine-v1.0.0"

    def __init__(
        self,
        retriever: Optional[GuidelineRetriever] = None,
        terminology_checker: Optional[TerminologyChecker] = None,
        tone_analyzer: Optional[ToneAnalyzer] = None,
        claim_checker: Optional[ClaimChecker] = None,
        model_adapter: Optional[LLMModelAdapter] = None,
    ):
        self.retriever = retriever or GuidelineRetriever()
        self.terminology_checker = terminology_checker or TerminologyChecker()
        self.tone_analyzer = tone_analyzer or ToneAnalyzer()
        self.claim_checker = claim_checker or ClaimChecker()
        self.model_adapter = model_adapter or LLMModelAdapter(
            provider=settings.LLM_PROVIDER,
            api_key=settings.LLM_API_KEY,
            model_name=settings.LLM_MODEL_NAME,
        )

    def audit_text(
        self,
        text: str,
        content_id: str,
        audit_id: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        extractors_used: Optional[List[str]] = None,
    ) -> AuditResultSchema:
        """Execute brand governance checks on extracted text."""
        start_time = time.perf_counter()
        audit_uuid = audit_id or str(uuid.uuid4())
        extractors = extractors_used or ["plain_text_extractor"]

        # 1. Retrieve applicable brand guidelines
        rules = self.retriever.get_rules_for_content(
            content_type="text",
            custom_rules=custom_rules,
        )

        # 2. Run rule-based checkers
        findings: List[FindingSchema] = []
        findings.extend(self.terminology_checker.check(text, rules))
        findings.extend(self.tone_analyzer.check(text, rules))
        findings.extend(self.claim_checker.check(text, rules))

        # 3. Optional LLM adapter invocation
        ai_model_used = None
        if self.model_adapter.is_configured():
            ai_findings = self.model_adapter.run_advanced_audit(text, rules)
            findings.extend(ai_findings)
            ai_model_used = self.model_adapter.model_name

        # 4. Compute aggregate compliance status
        overall_status = self._calculate_overall_status(findings)
        summary = self._generate_summary(findings, overall_status)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return AuditResultSchema(
            schema_version="1.0.0",
            audit_id=audit_uuid,
            content_id=content_id,
            overall_status=overall_status,
            summary=summary,
            findings=findings,
            created_at=datetime.now(timezone.utc).isoformat(),
            engine_metadata=EngineMetadataSchema(
                engine_version=self.ENGINE_VERSION,
                execution_time_ms=execution_time_ms,
                rules_checked_count=len(rules),
                ai_model_used=ai_model_used,
                extractors_used=extractors,
            ),
        )

    def _calculate_overall_status(self, findings: List[FindingSchema]) -> AuditStatusEnum:
        """Calculate overall status from finding severities."""
        if not findings:
            return AuditStatusEnum.PASSED

        severities = {f.severity for f in findings}
        requires_review = any(f.requires_human_review for f in findings)

        if FindingSeverityEnum.CRITICAL in severities:
            return AuditStatusEnum.FAILED
        if FindingSeverityEnum.HIGH in severities:
            return AuditStatusEnum.WARNING if not requires_review else AuditStatusEnum.NEEDS_HUMAN_REVIEW
        if requires_review:
            return AuditStatusEnum.NEEDS_HUMAN_REVIEW
        return AuditStatusEnum.WARNING

    def _generate_summary(self, findings: List[FindingSchema], status: AuditStatusEnum) -> str:
        """Generate human-readable executive audit summary."""
        if not findings:
            return "Content successfully conforms to all verified brand guidelines, terminology rules, and tone standards."

        count = len(findings)
        categories = list({f.category.value for f in findings})
        cat_str = ", ".join(categories)
        return (
            f"Audit completed with status '{status.value}'. Detected {count} finding(s) across categories: {cat_str}. "
            f"Review suggested corrections and ensure compliance before publication."
        )
