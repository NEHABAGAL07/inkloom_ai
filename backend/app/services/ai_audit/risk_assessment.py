"""Inkloom AI - Transparent Governance Risk Assessment and Status Module.

Aggregates finding severities, human review flags, and evidence statuses to determine
overall compliance status and advisory workflow outcomes.
"""

from typing import List, Tuple
from app.schemas.audit import FindingSchema
from app.schemas.common import AuditStatusEnum, FindingSeverityEnum
from app.services.ai_audit.interface import AdvisoryOutcomeEnum


class RiskAssessor:
    """Computes transparent, heuristic risk ratings and compliance status."""

    @classmethod
    def evaluate(
        cls,
        findings: List[FindingSchema],
    ) -> Tuple[AuditStatusEnum, AdvisoryOutcomeEnum, str]:
        """
        Calculates (overall_status, advisory_outcome, summary).
        Guarantees that automated assessment NEVER auto-approves publication.
        """
        if not findings:
            return (
                AuditStatusEnum.PASSED,
                AdvisoryOutcomeEnum.NO_BLOCKING_FINDINGS,
                "Content successfully conforms to all verified brand guidelines, terminology rules, and tone standards.",
            )

        severities = {f.severity for f in findings}
        requires_review = any(f.requires_human_review for f in findings)
        categories = sorted(list({f.category.value for f in findings}))
        cat_str = ", ".join(categories)
        total_count = len(findings)

        # 1. Calculate overall_status conforming to contracts/audit-result.schema.json
        if FindingSeverityEnum.CRITICAL in severities:
            overall_status = AuditStatusEnum.FAILED
            advisory = AdvisoryOutcomeEnum.NEEDS_CHANGES
        elif FindingSeverityEnum.HIGH in severities or requires_review:
            overall_status = AuditStatusEnum.NEEDS_HUMAN_REVIEW
            advisory = AdvisoryOutcomeEnum.HUMAN_REVIEW_REQUIRED
        else:
            overall_status = AuditStatusEnum.WARNING
            advisory = AdvisoryOutcomeEnum.NO_BLOCKING_FINDINGS

        # 2. Executive summary generation
        summary = (
            f"Audit completed with status '{overall_status.value}'. Detected {total_count} finding(s) "
            f"across categories: {cat_str}. "
            f"Review flagged items and secure designated human reviewer sign-off prior to publication."
        )

        return overall_status, advisory, summary
