"""Inkloom AI - Central AI Audit Orchestrator Module.

Coordinates multi-stage governance checks:
1. Input normalization and validation
2. Guideline and campaign context resolution
3. Tenant-isolated evidence and fact retrieval
4. Deterministic rule execution (terminology, forbidden keywords, required phrases)
5. Tone and brand voice analysis
6. Empirical claim checking (supported vs contradicted vs unverified vs unavailable)
7. Readability and accessibility checks
8. Revision-aware comparison when prior revision text is provided
9. Normalization, span validation, and deduplication
10. Transparent risk assessment and advisory publication readiness
11. Telemetry and return of validated AuditResultSchema
"""

import time
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.audit import (
    AuditResultSchema,
    FindingSchema,
    EngineMetadataSchema,
)
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
from app.services.ai_audit.risk_assessment import RiskAssessor
from app.services.ai_audit.output_validation import FindingPipeline
from app.services.ai_audit.llm_adapter import (
    BaseLLMAdapter,
    create_llm_adapter,
)
from app.core.config import settings


class AIAuditOrchestrator:
    """Multi-stage AI Brand Governance Audit Orchestrator."""

    ENGINE_VERSION = "inkloom-audit-engine-v1.0.0"

    def __init__(
        self,
        retriever: Optional[GuidelineRetriever] = None,
        evidence_retriever: Optional[EvidenceRetriever] = None,
        terminology_checker: Optional[TerminologyChecker] = None,
        brand_voice_analyzer: Optional[BrandVoiceAnalyzer] = None,
        claim_checker: Optional[ClaimChecker] = None,
        rules_engine: Optional[DeterministicRuleEngine] = None,
        quality_checker: Optional[ContentQualityChecker] = None,
        llm_adapter: Optional[BaseLLMAdapter] = None,
    ):
        self.retriever = retriever or GuidelineRetriever()
        self.evidence_retriever = evidence_retriever or EvidenceRetriever()
        self.terminology_checker = terminology_checker or TerminologyChecker()
        self.brand_voice_analyzer = brand_voice_analyzer or BrandVoiceAnalyzer()
        self.claim_checker = claim_checker or ClaimChecker()
        self.rules_engine = rules_engine or DeterministicRuleEngine()
        self.quality_checker = quality_checker or ContentQualityChecker()
        self.llm_adapter = llm_adapter or create_llm_adapter(
            provider=settings.LLM_PROVIDER,
            api_key=settings.LLM_API_KEY,
            model_name=settings.LLM_MODEL_NAME,
        )

    def execute_audit(
        self,
        text: str,
        context: ContentContext,
        audit_id: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        extractors_used: Optional[List[str]] = None,
    ) -> Tuple[AuditResultSchema, Optional[RevisionDiff], AdvisoryOutcomeEnum]:
        """Execute full 11-step brand governance audit cycle."""
        start_time = time.perf_counter()
        audit_uuid = audit_id or str(uuid.uuid4())
        extractors = extractors_used or ["plain_text_extractor"]

        # 1. Input normalization & safety bounds
        clean_text = (text or "").strip()
        if not clean_text:
            clean_text = "Sample brand content under evaluation."

        # 2. Guideline & rule retrieval
        rules = self.retriever.get_rules_for_content(
            content_type=context.content_type,
            custom_rules=custom_rules,
        )

        # 3. Tenant-isolated evidence and fact retrieval
        verified_facts = self.evidence_retriever.get_verified_facts(
            organization_id=context.organization_id
        )
        learned_preferences = self.evidence_retriever.get_learned_preferences(
            organization_id=context.organization_id
        )

        # 4. Deterministic checks
        raw_findings: List[FindingSchema] = []

        # 4a. Terminology checks
        raw_findings.extend(
            self.terminology_checker.check(
                text=clean_text,
                rules=rules,
                learned_preferences=learned_preferences,
            )
        )

        # 4b. General deterministic rules (disclosures, regex, boundaries)
        raw_findings.extend(
            self.rules_engine.check(
                text=clean_text,
                rules=rules,
                context=context,
            )
        )

        # 4c. Tone & Brand Voice
        raw_findings.extend(
            self.brand_voice_analyzer.check(
                text=clean_text,
                rules=rules,
                context=context,
            )
        )

        # 4d. Claim Verification & Contradiction Detection
        raw_findings.extend(
            self.claim_checker.check(
                text=clean_text,
                rules=rules,
                verified_facts=verified_facts,
            )
        )

        # 4e. Content Quality, Readability, and Accessibility
        raw_findings.extend(
            self.quality_checker.check(
                text=clean_text,
                context=context,
            )
        )

        # 5. Specialized AI Checks via LLM Adapter if configured
        ai_model_used = None
        if self.llm_adapter.is_configured():
            try:
                ai_findings = self.llm_adapter.run_advanced_audit(
                    text=clean_text,
                    rules=rules,
                    context=context,
                )
                raw_findings.extend(ai_findings)
                ai_model_used = self.llm_adapter.model_name
            except Exception:
                # LLM failure must never crash the audit; deterministic checks survive
                pass

        # 6. Revision comparison if prior revision is provided
        revision_diff: Optional[RevisionDiff] = None
        if context.previous_revision_text and context.previous_revision_text.strip():
            revision_diff = self._compare_revisions(
                current_findings=raw_findings,
                current_text=clean_text,
                previous_text=context.previous_revision_text,
                rules=rules,
                context=context,
            )

        # 7. Finding Normalization & Deduplication Pipeline
        final_findings = FindingPipeline.process(raw_findings, clean_text)

        # 8. Risk Assessment and Status Determination
        overall_status, advisory_outcome, summary = RiskAssessor.evaluate(final_findings)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        result_schema = AuditResultSchema(
            schema_version="1.0.0",
            audit_id=audit_uuid,
            content_id=context.content_id,
            overall_status=overall_status,
            summary=summary,
            findings=final_findings,
            created_at=datetime.now(timezone.utc).isoformat(),
            engine_metadata=EngineMetadataSchema(
                engine_version=self.ENGINE_VERSION,
                execution_time_ms=execution_time_ms,
                rules_checked_count=len(rules),
                ai_model_used=ai_model_used,
                extractors_used=extractors,
            ),
        )

        return result_schema, revision_diff, advisory_outcome

    def _compare_revisions(
        self,
        current_findings: List[FindingSchema],
        current_text: str,
        previous_text: str,
        rules: List[RetrievedRule],
        context: ContentContext,
    ) -> RevisionDiff:
        """Compares current revision findings with findings from previous revision."""
        # Run deterministic evaluation on previous text
        prev_findings_raw: List[FindingSchema] = []
        prev_findings_raw.extend(self.terminology_checker.check(previous_text, rules))
        prev_findings_raw.extend(self.brand_voice_analyzer.check(previous_text, rules, context))
        prev_findings_raw.extend(self.claim_checker.check(previous_text, rules))
        prev_findings = FindingPipeline.process(prev_findings_raw, previous_text)

        def finding_sig(f: FindingSchema) -> Tuple[str, str]:
            ev = (f.evidence or "").strip().lower()
            return (f.title, ev)

        prev_sigs = {finding_sig(f): f.title for f in prev_findings}
        curr_sigs = {finding_sig(f): f.title for f in current_findings}

        resolved_keys = set(prev_sigs.keys()) - set(curr_sigs.keys())
        persistent_keys = set(prev_sigs.keys()) & set(curr_sigs.keys())
        new_keys = set(curr_sigs.keys()) - set(prev_sigs.keys())

        resolved_titles = [prev_sigs[k] for k in resolved_keys]
        persistent_titles = [curr_sigs[k] for k in persistent_keys]
        new_titles = [curr_sigs[k] for k in new_keys]

        return RevisionDiff(
            resolved_count=len(resolved_titles),
            persistent_count=len(persistent_titles),
            new_findings_count=len(new_titles),
            resolved_titles=resolved_titles,
            persistent_titles=persistent_titles,
            new_titles=new_titles,
        )
