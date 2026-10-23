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


from app.services.ai_audit.interface import BaseAuditService
from app.services.ai_audit.llm_adapter import HostedLLMAdapter, BaseLLMAdapter


class AIAuditEngine(BaseAuditService):
    """Core AI audit engine for brand governance conforming to BaseAuditService."""

    ENGINE_VERSION = AIAuditOrchestrator.ENGINE_VERSION

    def __init__(
        self,
        retriever: Optional[GuidelineRetriever] = None,
        terminology_checker: Optional[TerminologyChecker] = None,
        tone_analyzer: Optional[BrandVoiceAnalyzer] = None,
        claim_checker: Optional[ClaimChecker] = None,
        model_adapter: Optional[BaseLLMAdapter] = None,
    ):
        self.retriever = retriever or GuidelineRetriever()
        self.evidence_retriever = evidence_retriever or EvidenceRetriever()
        self.terminology_checker = terminology_checker or TerminologyChecker()
        self.tone_analyzer = tone_analyzer or BrandVoiceAnalyzer()
        self.claim_checker = claim_checker or ClaimChecker()
        self.model_adapter = model_adapter or HostedLLMAdapter(
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
        text: Optional[str] = None,
        content_id: Optional[str] = None,
        audit_id: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        extractors_used: Optional[List[str]] = None,
        content: Optional[str] = None,
        guidelines: Optional[List[Dict[str, Any]]] = None,
        verified_facts: Optional[List[Dict[str, Any]]] = None,
    ) -> AuditResultSchema:
        """
        Execute brand governance checks on content.
        Signature supports audit_text(content, guidelines, verified_facts) as well as legacy signatures.
        """
        raw_text = content if content is not None else (text or "")
        cid = content_id or f"cnt-{uuid.uuid4().hex[:8]}"
        rules_input = guidelines if guidelines is not None else custom_rules

        start_time = time.perf_counter()
        audit_uuid = audit_id or str(uuid.uuid4())
        extractors = extractors_used or ["plain_text_extractor"]

        # 1. Retrieve applicable brand guidelines
        rules = self.retriever.get_rules_for_content(
            content_type="text",
            custom_rules=rules_input,
        )

        # 2. Run rule-based checkers
        findings: List[FindingSchema] = []
        findings.extend(self.terminology_checker.check(raw_text, rules))
        findings.extend(self.tone_analyzer.check(raw_text, rules))
        findings.extend(self.claim_checker.check(raw_text, rules, verified_facts=verified_facts))

        # 3. Optional LLM adapter invocation
        ai_model_used = None
        if self.model_adapter.is_configured():
            ai_findings = self.model_adapter.run_advanced_audit(raw_text, rules, verified_facts=verified_facts)
            findings.extend(ai_findings)
            ai_model_used = getattr(self.model_adapter, "model_name", None)

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
