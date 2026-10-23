"""Inkloom AI - Brand Governance Audit Engine.

Orchestrates deterministic rule-based checks, evidence-aware claim verifications,
and optional LLM adapters.
Conforms strictly to `contracts/audit-result.schema.json`.
"""

from typing import List, Dict, Any, Optional, Tuple
from app.schemas.audit import AuditResultSchema, FindingSchema
from app.schemas.common import AuditStatusEnum
from app.services.ai_audit.interface import (
    ContentContext,
    RevisionDiff,
    AdvisoryOutcomeEnum,
)
from app.services.ai_audit.guideline_retrieval import GuidelineRetriever, RetrievedRule
from app.services.ai_audit.evidence_retrieval import EvidenceRetriever
from app.services.ai_audit.terminology import TerminologyChecker
from app.services.ai_audit.brand_voice import BrandVoiceAnalyzer
from app.services.ai_audit.claim_checking import ClaimChecker
from app.services.ai_audit.rules_engine import DeterministicRuleEngine
from app.services.ai_audit.content_quality import ContentQualityChecker
from app.services.ai_audit.llm_adapter import (
    BaseLLMAdapter,
    RuleBasedFallbackAdapter,
    MockLLMAdapter,
    create_llm_adapter,
)
from app.services.ai_audit.orchestrator import AIAuditOrchestrator
from app.core.config import settings


# Backward-compatible LLMModelAdapter alias
class LLMModelAdapter(BaseLLMAdapter):
    """Backward-compatible adapter interface for legacy test/caller compatibility."""

    def __init__(
        self,
        provider: str = "rule_based_fallback",
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        super().__init__(provider=provider, api_key=api_key, model_name=model_name)
        self._inner = create_llm_adapter(provider=provider, api_key=api_key, model_name=model_name)

    def is_configured(self) -> bool:
        return self._inner.is_configured()

    def run_advanced_audit(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        return self._inner.run_advanced_audit(text=text, rules=rules, context=context)


class AIAuditEngine:
    """Core AI audit engine for brand governance and compliance verification."""

    ENGINE_VERSION = AIAuditOrchestrator.ENGINE_VERSION

    def __init__(
        self,
        retriever: Optional[GuidelineRetriever] = None,
        terminology_checker: Optional[TerminologyChecker] = None,
        tone_analyzer: Optional[BrandVoiceAnalyzer] = None,
        claim_checker: Optional[ClaimChecker] = None,
        model_adapter: Optional[BaseLLMAdapter] = None,
        evidence_retriever: Optional[EvidenceRetriever] = None,
        rules_engine: Optional[DeterministicRuleEngine] = None,
        quality_checker: Optional[ContentQualityChecker] = None,
    ):
        self.retriever = retriever or GuidelineRetriever()
        self.evidence_retriever = evidence_retriever or EvidenceRetriever()
        self.terminology_checker = terminology_checker or TerminologyChecker()
        self.tone_analyzer = tone_analyzer or BrandVoiceAnalyzer()
        self.claim_checker = claim_checker or ClaimChecker()
        self.rules_engine = rules_engine or DeterministicRuleEngine()
        self.quality_checker = quality_checker or ContentQualityChecker()
        self.model_adapter = model_adapter or create_llm_adapter(
            provider=settings.LLM_PROVIDER,
            api_key=settings.LLM_API_KEY,
            model_name=settings.LLM_MODEL_NAME,
        )

        # Underlying orchestrator
        self.orchestrator = AIAuditOrchestrator(
            retriever=self.retriever,
            evidence_retriever=self.evidence_retriever,
            terminology_checker=self.terminology_checker,
            brand_voice_analyzer=self.tone_analyzer,
            claim_checker=self.claim_checker,
            rules_engine=self.rules_engine,
            quality_checker=self.quality_checker,
            llm_adapter=self.model_adapter,
        )

    def audit_text(
        self,
        text: str,
        content_id: str,
        audit_id: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        extractors_used: Optional[List[str]] = None,
        context: Optional[ContentContext] = None,
        verified_facts: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> AuditResultSchema:
        """
        Execute brand governance audit on text content.
        Preserves complete backward compatibility with the existing API.
        """
        ctx = context or ContentContext(
            content_id=content_id,
            organization_id="org-default",
            content_type="text",
            raw_text=text,
        )

        if verified_facts:
            from app.services.ai_audit.interface import VerifiedFact
            for f in verified_facts:
                if isinstance(f, dict):
                    self.evidence_retriever.register_verified_fact(
                        VerifiedFact(
                            fact_id=f.get("id", f.get("fact_id", "fact-custom")),
                            organization_id=ctx.organization_id,
                            claim_category=f.get("claim_category", f.get("category", "metric")),
                            statement=f.get("statement", f.get("text", "")),
                            approved_value=f.get("approved_value"),
                            source_reference=f.get("source_reference"),
                        )
                    )

        result, _, _ = self.orchestrator.execute_audit(
            text=text,
            context=ctx,
            audit_id=audit_id,
            custom_rules=custom_rules,
            extractors_used=extractors_used,
        )
        return result

    def audit_with_context(
        self,
        text: str,
        context: ContentContext,
        audit_id: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        extractors_used: Optional[List[str]] = None,
    ) -> Tuple[AuditResultSchema, Optional[RevisionDiff], AdvisoryOutcomeEnum]:
        """Execute brand audit with full revision awareness and advisory outcome."""
        return self.orchestrator.execute_audit(
            text=text,
            context=context,
            audit_id=audit_id,
            custom_rules=custom_rules,
            extractors_used=extractors_used,
        )
