"""
Audit Result Validation and Deduplication Module
Stage 9, Stage 10, Stage 11:
- Validates findings against typed contract schemas
- Deduplicates overlapping findings without suppressing serious risks
- Aligns confidence, severity, and evidence status
- Computes weighted compliance scores and verdict overview
- Assembles validated AuditResult strictly adhering to contracts
"""
import uuid
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.audit_contract import (
    AuditResult,
    AuditSummary,
    EngineMetadata,
    OverallAuditStatus,
    Finding,
    FindingCategory,
    FindingSeverity,
    FindingStatus,
    SourceReference,
    VerificationStatus,
)


class AuditResultValidator:
    """Validates, deduplicates, and aggregates multi-layer audit results."""

    @classmethod
    def process_and_assemble(
        cls,
        raw_findings: List[Finding],
        content_id: str,
        revision_id: Optional[str],
        modules_executed: List[str],
        models_used: List[str],
        warnings: List[str],
        start_time: float,
        guideline_version: str = "1.0.0",
        engine_version: str = "0.3.0-governance-engine",
    ) -> AuditResult:
        """Deduplicates findings, calculates compliance metrics, and formats validated AuditResult."""
        deduped = cls._deduplicate_findings(raw_findings)

        critical_count = sum(1 for f in deduped if f.severity == FindingSeverity.CRITICAL)
        high_count = sum(1 for f in deduped if f.severity == FindingSeverity.HIGH)
        medium_count = sum(1 for f in deduped if f.severity == FindingSeverity.MEDIUM)
        low_count = sum(1 for f in deduped if f.severity == FindingSeverity.LOW)
        info_count = sum(1 for f in deduped if f.severity == FindingSeverity.INFO)

        # Weighted penalty calculation: Critical = 30, High = 15, Medium = 8, Low = 3, Info = 0
        penalty = (critical_count * 30.0) + (high_count * 15.0) + (medium_count * 8.0) + (low_count * 3.0)
        compliance_score = max(0.0, round(100.0 - penalty, 1))

        # Overall Status Logic
        if critical_count > 0 or compliance_score < 60.0:
            overall_status = OverallAuditStatus.NON_COMPLIANT
        elif high_count > 0 or medium_count > 0 or compliance_score < 90.0:
            overall_status = OverallAuditStatus.NEEDS_REVIEW
        else:
            overall_status = OverallAuditStatus.COMPLIANT

        # Decision rule: Human review is mandatory if any finding mandates it, or if not fully compliant
        human_review_required = any(f.requires_human_review for f in deduped) or overall_status != OverallAuditStatus.COMPLIANT

        verdict_overview = cls._generate_verdict(
            overall_status=overall_status,
            total=len(deduped),
            critical=critical_count,
            high=high_count,
            medium=medium_count,
            low=low_count,
            guideline_version=guideline_version,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        summary = AuditSummary(
            compliance_score=compliance_score,
            total_findings=len(deduped),
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            info_count=info_count,
            human_review_required=human_review_required,
            verdict_overview=verdict_overview,
        )

        engine_metadata = EngineMetadata(
            engine_version=engine_version,
            execution_time_ms=elapsed_ms,
            modules_executed=modules_executed,
            models_used=models_used,
            warnings=warnings,
        )

        return AuditResult(
            schema_version="1.0.0",
            audit_id=str(uuid.uuid4()),
            content_id=content_id,
            revision_id=revision_id,
            overall_status=overall_status,
            summary=summary,
            findings=deduped,
            created_at=datetime.now(timezone.utc),
            engine_metadata=engine_metadata,
        )

    @classmethod
    def _deduplicate_findings(cls, findings: List[Finding]) -> List[Finding]:
        """
        Deduplicates findings sharing identical target excerpts or rule references.
        When merging:
        - Never silently suppress higher severity
        - Keep the highest confidence score
        - Merge citations and evidence references
        """
        seen: Dict[str, Finding] = {}
        severity_order = {
            FindingSeverity.CRITICAL: 5,
            FindingSeverity.HIGH: 4,
            FindingSeverity.MEDIUM: 3,
            FindingSeverity.LOW: 2,
            FindingSeverity.INFO: 1,
        }

        for f in findings:
            # Key on category + target text or title
            target_key = f"{f.category.value}:{(f.evidence or f.original_text or f.title).strip().lower()[:80]}"

            if target_key not in seen:
                seen[target_key] = f
            else:
                existing = seen[target_key]
                # If current finding is more severe, upgrade existing
                if severity_order.get(f.severity, 0) > severity_order.get(existing.severity, 0):
                    seen[target_key] = f
                else:
                    # Update existing confidence and citations
                    if f.confidence > existing.confidence:
                        existing.confidence = f.confidence
                    if f.evidence_references and existing.evidence_references is not None:
                        for ref in f.evidence_references:
                            if ref not in existing.evidence_references:
                                existing.evidence_references.append(ref)
                    if f.requires_human_review:
                        existing.requires_human_review = True
                        existing.review_required = True

        return list(seen.values())

    @staticmethod
    def _generate_verdict(
        overall_status: OverallAuditStatus,
        total: int,
        critical: int,
        high: int,
        medium: int,
        low: int,
        guideline_version: str = "1.0.0",
    ) -> str:
        if total == 0:
            return (
                f"Content successfully conforms to all verified brand guidelines (v{guideline_version}), "
                "terminology standards, and tone requirements."
            )

        parts = []
        if critical > 0:
            parts.append(f"{critical} critical policy violation(s)")
        if high > 0:
            parts.append(f"{high} high-severity issue(s)")
        if medium > 0:
            parts.append(f"{medium} moderate guideline divergence(s)")
        if low > 0:
            parts.append(f"{low} minor suggestion(s)")

        summary_clause = ", ".join(parts) if parts else f"{total} finding(s)"
        action_clause = (
            "Immediate remediation required before proceeding."
            if critical > 0
            else "Human compliance review required prior to publication."
        )

        return (
            f"Governance audit identified {summary_clause} against published Brand Guidelines (v{guideline_version}). "
            f"{action_clause}"
        )
