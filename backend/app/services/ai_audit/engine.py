"""
AI Brand Governance Audit Engine — Phase 2 Architecture
Coordinates the 12-stage evidence-grounded brand audit pipeline:
1. Context validation & immutable content version resolution
2. Channel, audience, product, and jurisdiction profiling
3. Approved brand rules retrieval
4. Authorized verified facts & benchmark retrieval (supported, contradicted, unverified, unavailable)
5. Authoritative statutory and regulatory references retrieval (distinguishing binding law from recommendations)
6. Deterministic pattern matching (terminology, forbidden words, warranty liabilities, mandatory disclosures)
7. Semantic contextual analysis with prompt-injection neutralization & safe LLM fallback
8. Media, visual branding, and accessibility evaluation (contrast ratio WCAG AA, logo clearspace)
9. Marketing effectiveness, message quality, and alternative punchlines
10. Cross-rule conflict detection and precedence resolution
11. Intelligent, intent-preserving correction generation & re-validation
12. Finding deduplication, compliance scoring, and validated report assembly
"""
import time
import logging
from typing import List, Dict, Any, Optional

from app.schemas.audit_contract import AuditResult
from app.services.ai_audit.context_resolver import AuditContextResolver
from app.services.ai_audit.evidence_retriever import EvidenceRetriever
from app.services.ai_audit.deterministic_checker import DeterministicChecker
from app.services.ai_audit.semantic_analyzer import SemanticAnalyzer
from app.services.ai_audit.media_evaluator import MediaAuditEvaluator
from app.services.ai_audit.marketing_evaluator import MarketingQualityEvaluator
from app.services.ai_audit.cross_rule_checker import CrossRuleConflictChecker
from app.services.ai_audit.intelligent_corrector import IntelligentCorrector
from app.services.ai_audit.result_validator import AuditResultValidator

logger = logging.getLogger("inkloom.ai_audit_engine")


class AIAuditEngine:
    ENGINE_VERSION = "0.3.0-governance-engine"

    @classmethod
    def run_audit(
        cls,
        content_text: str,
        content_id: str,
        revision_id: Optional[str] = None,
        active_guidelines: Optional[List[Dict[str, Any]]] = None,
        media_type: str = "text/plain",
        context: Optional[Dict[str, Any]] = None,
        guideline_version: Optional[str] = None,
        guideline_profile: Optional[Dict[str, Any]] = None,
        organization_id: Optional[str] = None,
        db: Optional[Any] = None,
        file_path: Optional[str] = None,
        channel: Optional[str] = None,
        target_audience: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        product: Optional[str] = None,
        llm_adapter: Optional[Any] = None,
    ) -> AuditResult:
        """
        Executes a 12-stage multi-layer governance audit pass on provided text and context,
        evaluating against published brand guidelines, verified facts, and legal requirements.
        """
        start_time = time.perf_counter()
        modules_executed: List[str] = []
        models_used: List[str] = ["deterministic_rules_v1", "claim_benchmark_registry"]
        warnings: List[str] = []
        raw_findings = []

        g_version = guideline_version or "1.0.0"

        # -------------------------------------------------------------
        # Stages 1 & 2: Context Resolution & Audience Profiling
        # -------------------------------------------------------------
        modules_executed.append("context_resolver")
        resolved_text, submission, target_revision, metadata = AuditContextResolver.resolve_target_content(
            db=db,
            submission_id=content_id,
            revision_id=revision_id,
            provided_text=content_text,
            provided_metadata={
                "channel": channel or (context.get("channel") if context else "web"),
                "target_audience": target_audience or (context.get("target_audience") if context else "enterprise"),
                "jurisdiction": jurisdiction or (context.get("jurisdiction") if context else "Global"),
                "product": product or (context.get("product") if context else "Inkloom AI"),
                "content_type": media_type,
            },
        )
        final_text = resolved_text or content_text
        target_channel = metadata.get("channel", "web")
        target_audience_val = metadata.get("target_audience", "enterprise")
        target_jurisdiction = metadata.get("jurisdiction", "Global")

        # -------------------------------------------------------------
        # Stages 3, 4, 5: Evidence & Legal Source Retrieval
        # -------------------------------------------------------------
        modules_executed.append("evidence_retrieval")
        brand_rules = EvidenceRetriever.retrieve_brand_rules(
            db=db,
            organization_id=organization_id,
            content_text=final_text,
            channel=target_channel,
            jurisdiction=target_jurisdiction,
            active_guidelines=active_guidelines,
            guideline_version=g_version,
            guideline_profile=guideline_profile,
        )

        verified_facts = EvidenceRetriever.retrieve_verified_facts(
            db=db,
            organization_id=organization_id,
            query_text=final_text[:200] if final_text else None,
        )

        legal_references = EvidenceRetriever.retrieve_legal_references(
            db=db,
            organization_id=organization_id,
            jurisdiction=target_jurisdiction,
        )

        # -------------------------------------------------------------
        # Stage 6: Deterministic Checks (Brand, Lexicon, Absolute Claims)
        # -------------------------------------------------------------
        modules_executed.append("deterministic_checker")
        det_findings = DeterministicChecker.evaluate(
            text=final_text,
            guideline_version=g_version,
            guideline_profile=guideline_profile,
        )
        raw_findings.extend(det_findings)

        # -------------------------------------------------------------
        # Stage 7: Semantic Analysis (Tone, Nuance, Prompt Injection)
        # -------------------------------------------------------------
        modules_executed.append("semantic_analyzer")
        models_used.append("tone_analyzer_v1")
        sem_findings, sem_warnings = SemanticAnalyzer.evaluate(
            text=final_text,
            rules=brand_rules,
            facts=verified_facts,
            legal_sources=legal_references,
            llm_adapter=llm_adapter,
            channel=target_channel,
            target_audience=target_audience_val,
        )
        raw_findings.extend(sem_findings)
        warnings.extend(sem_warnings)

        # -------------------------------------------------------------
        # Stage 8: Media & Visual Accessibility Checks (WCAG AA, Logo)
        # -------------------------------------------------------------
        modules_executed.append("media_evaluator")
        target_file = file_path or (target_revision.file_path if target_revision else None)
        media_findings = MediaAuditEvaluator.evaluate(
            file_path=target_file,
            media_type=media_type,
            brand_palette=guideline_profile.get("colors", {}).get("primary_palette") if guideline_profile else None,
            extraction_warnings=metadata.get("extraction_warnings"),
        )
        raw_findings.extend(media_findings)

        # -------------------------------------------------------------
        # Stage 9: Marketing Quality & Message Effectiveness
        # -------------------------------------------------------------
        modules_executed.append("marketing_quality_evaluator")
        mkt_findings = MarketingQualityEvaluator.evaluate(
            text=final_text,
            channel=target_channel,
            target_audience=target_audience_val,
        )
        raw_findings.extend(mkt_findings)

        # -------------------------------------------------------------
        # Stage 10: Cross-Rule Conflicts & Precedence Detection
        # -------------------------------------------------------------
        modules_executed.append("cross_rule_conflict_checker")
        conflict_findings = CrossRuleConflictChecker.evaluate(
            text=final_text,
            rules=brand_rules,
            legal_sources=legal_references,
            findings_so_far=raw_findings,
            guideline_profile=guideline_profile,
        )
        raw_findings.extend(conflict_findings)

        # -------------------------------------------------------------
        # Stage 11: Intelligent Correction Generation & Re-validation
        # -------------------------------------------------------------
        modules_executed.append("intelligent_corrector")
        IntelligentCorrector.enhance_and_validate_corrections(
            findings=raw_findings,
            full_text=final_text,
            channel=target_channel,
        )

        # -------------------------------------------------------------
        # Stage 12: Result Validation, Deduplication & Report Persistence
        # -------------------------------------------------------------
        modules_executed.append("result_validator")
        audit_result = AuditResultValidator.process_and_assemble(
            raw_findings=raw_findings,
            content_id=content_id,
            revision_id=revision_id or (target_revision.id if target_revision else None),
            modules_executed=modules_executed,
            models_used=models_used,
            warnings=warnings,
            start_time=start_time,
            guideline_version=g_version,
            engine_version=cls.ENGINE_VERSION,
        )

        return audit_result
