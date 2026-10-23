"""
AI Brand Governance Audit Engine

Callable entrypoint that coordinates guideline retrieval, tone analysis,
terminology compliance, and claim verification.
Produces validated AuditResult objects strictly adhering to the shared contract.
"""
import time
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.audit_contract import (
    AuditResult,
    AuditSummary,
    EngineMetadata,
    OverallAuditStatus,
    Finding,
    FindingSeverity,
)
from app.services.ai_audit.guideline_retrieval import GuidelineRetriever
from app.services.ai_audit.tone_analysis import ToneAnalyzer
from app.services.ai_audit.terminology import TerminologyChecker
from app.services.ai_audit.claim_checking import ClaimVerifier


class AIAuditEngine:
    ENGINE_VERSION = "0.1.0-alpha"

    @classmethod
    def run_audit(
        cls,
        content_text: str,
        content_id: str,
        revision_id: Optional[str] = None,
        active_guidelines: Optional[List[Dict[str, Any]]] = None,
        media_type: str = "text/plain",
        context: Optional[Dict[str, Any]] = None,
    ) -> AuditResult:
        """
        Executes complete brand governance audit pass on provided text and context.
        """
        start_time = time.perf_counter()
        modules_executed: List[str] = []
        all_findings: List[Finding] = []

        # 1. Guideline Retrieval
        modules_executed.append("guideline_retrieval")
        relevant_rules = []
        if active_guidelines:
            relevant_rules = GuidelineRetriever.filter_relevant_rules(
                rules=active_guidelines,
                content_text=content_text,
                media_type=media_type,
            )

        # 2. Terminology Checks
        modules_executed.append("terminology_checker")
        term_findings = TerminologyChecker.check(text=content_text)
        all_findings.extend(term_findings)

        # 3. Tone and Voice Analysis
        modules_executed.append("tone_analyzer")
        tone_findings = ToneAnalyzer.analyze(text=content_text)
        all_findings.extend(tone_findings)

        # 4. Fact and Claim Verification
        modules_executed.append("claim_verifier")
        claim_findings = ClaimVerifier.verify(text=content_text)
        all_findings.extend(claim_findings)

        # 5. Aggregate Findings & Calculate Scores
        critical_count = sum(1 for f in all_findings if f.severity == FindingSeverity.CRITICAL)
        high_count = sum(1 for f in all_findings if f.severity == FindingSeverity.HIGH)
        medium_count = sum(1 for f in all_findings if f.severity == FindingSeverity.MEDIUM)
        low_count = sum(1 for f in all_findings if f.severity == FindingSeverity.LOW)
        info_count = sum(1 for f in all_findings if f.severity == FindingSeverity.INFO)

        # Weighted penalty deduction from 100
        penalty = (critical_count * 30.0) + (high_count * 15.0) + (medium_count * 8.0) + (low_count * 3.0)
        compliance_score = max(0.0, round(100.0 - penalty, 1))

        # Overall Status Determination
        if critical_count > 0 or compliance_score < 60.0:
            overall_status = OverallAuditStatus.NON_COMPLIANT
        elif high_count > 0 or medium_count > 0 or compliance_score < 90.0:
            overall_status = OverallAuditStatus.NEEDS_REVIEW
        else:
            overall_status = OverallAuditStatus.COMPLIANT

        human_review_required = any(f.requires_human_review for f in all_findings) or overall_status != OverallAuditStatus.COMPLIANT

        # Verdict Overview synthesis
        verdict_overview = cls._generate_verdict_overview(
            overall_status=overall_status,
            total=len(all_findings),
            critical=critical_count,
            high=high_count,
            medium=medium_count,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        summary = AuditSummary(
            compliance_score=compliance_score,
            total_findings=len(all_findings),
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            info_count=info_count,
            human_review_required=human_review_required,
            verdict_overview=verdict_overview,
        )

        engine_metadata = EngineMetadata(
            engine_version=cls.ENGINE_VERSION,
            execution_time_ms=elapsed_ms,
            modules_executed=modules_executed,
            models_used=["rule_engine_v1", "deterministic_tone_parser"],
            warnings=[],
        )

        return AuditResult(
            schema_version="1.0.0",
            audit_id=str(uuid.uuid4()),
            content_id=content_id,
            revision_id=revision_id,
            overall_status=overall_status,
            summary=summary,
            findings=all_findings,
            created_at=datetime.now(timezone.utc),
            engine_metadata=engine_metadata,
        )

    @staticmethod
    def _generate_verdict_overview(
        overall_status: OverallAuditStatus,
        total: int,
        critical: int,
        high: int,
        medium: int
    ) -> str:
        if total == 0:
            return "Content successfully conforms to all verified brand guidelines, terminology standards, and tone requirements."
        parts = []
        if critical > 0:
            parts.append(f"{critical} critical policy violation(s)")
        if high > 0:
            parts.append(f"{high} high-severity issue(s)")
        if medium > 0:
            parts.append(f"{medium} moderate guideline divergence(s)")

        summary_clause = ", ".join(parts) if parts else f"{total} finding(s)"
        return f"Audit identified {summary_clause}. Human reviewer validation recommended prior to external dissemination."
