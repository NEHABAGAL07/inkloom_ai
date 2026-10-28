"""
Cross-Rule Conflict Checker Module
Category F:
Detects cases where:
- A marketing suggestion violates an approved brand rule
- A brand rule appears to conflict with an applicable legal requirement (law > internal policy)
- A proposed correction introduces a new unsupported claim
- A correction removes an essential disclosure or changes a product fact
- Different approved sources contain contradictory information

Preserves both conflicting rules and sources and escalates high-risk conflicts to human review.
"""
import uuid
from typing import List, Dict, Any, Optional

from app.schemas.audit_contract import (
    Finding,
    FindingCategory,
    FindingSeverity,
    FindingStatus,
    SourceReference,
    VerificationStatus,
    SuggestedCorrection,
)
from app.schemas.ai_context import (
    BrandRuleContext,
    LegalSourceContext,
    RuleConflictDetail,
)
from app.services.shared_intelligence.conflict_detector import ConflictDetector


class CrossRuleConflictChecker:
    """Detects and escalates multi-source governance conflicts."""

    @classmethod
    def evaluate(
        cls,
        text: str,
        rules: List[BrandRuleContext],
        legal_sources: List[LegalSourceContext],
        findings_so_far: List[Finding],
        guideline_profile: Optional[Dict[str, Any]] = None,
    ) -> List[Finding]:
        conflict_findings: List[Finding] = []

        # 1. Run ConflictDetector across rules and legal sources
        detected_conflicts: List[RuleConflictDetail] = ConflictDetector.detect_conflicts(
            rules=rules,
            legal_sources=legal_sources,
            draft_guideline_data=guideline_profile,
        )

        for dc in detected_conflicts:
            conflict_findings.append(
                Finding(
                    id=f"find_conflict_{dc.conflict_id[:8]}",
                    category=FindingCategory.CROSS_RULE_CONFLICT,
                    severity=FindingSeverity.HIGH,
                    title=f"Rule Conflict: {dc.higher_priority_source} overrides {dc.lower_priority_source}",
                    message=dc.explanation,
                    evidence=f"Lower priority rule: {dc.lower_priority_rule}",
                    confidence=0.96,
                    requires_human_review=True,
                    status=FindingStatus.MANUAL_CHECK_REQUIRED,
                    source_reference=SourceReference(
                        rule_name=dc.higher_priority_source,
                        section=f"Higher Priority (Level {dc.higher_priority_level}) vs (Level {dc.lower_priority_level})",
                        verification_status=VerificationStatus.VERIFIED,
                    ),
                    rule_reference=dc.higher_priority_source,
                    evidence_status="verified",
                    limitations="Statutory and higher-priority legal requirements prevail over internal brand guidelines.",
                )
            )

        # 2. Check if any suggested correction introduces new prohibited terminology or claims
        for f in findings_so_far:
            if f.suggested_correction and f.suggested_correction.replacement_text:
                rep_text = f.suggested_correction.replacement_text.lower()

                # Check if correction introduces unverified multiplier or absolute guarantee
                if any(w in rep_text for w in ["10x", "100%", "zero errors", "guaranteed results", "miracle"]):
                    conflict_findings.append(
                        Finding(
                            id=f"find_conf_corr_{uuid.uuid4().hex[:8]}",
                            category=FindingCategory.CROSS_RULE_CONFLICT,
                            severity=FindingSeverity.HIGH,
                            title="Proposed Correction Introduces Unsubstantiated Claim",
                            message=(
                                f"The suggested correction for finding '{f.title}' contains an unverified claim or "
                                f"absolute promise ('{rep_text[:60]}...'). Suggested revisions must not introduce new violations."
                            ),
                            evidence=f.suggested_correction.replacement_text,
                            confidence=0.98,
                            requires_human_review=True,
                            status=FindingStatus.MANUAL_CHECK_REQUIRED,
                            rule_reference="Correction Validation: No Secondary Violations",
                            evidence_status="contradicted",
                        )
                    )

                # Check if correction strips a mandatory compliance disclaimer
                if f.category == FindingCategory.LEGAL_COMPLIANCE and "disclosure" in f.title.lower():
                    if len(rep_text) < 15:
                        conflict_findings.append(
                            Finding(
                                id=f"find_conf_strip_{uuid.uuid4().hex[:8]}",
                                category=FindingCategory.CROSS_RULE_CONFLICT,
                                severity=FindingSeverity.CRITICAL,
                                title="Proposed Correction Omits Essential Disclosure",
                                message="Correction removes or truncates a required legal disclosure.",
                                confidence=0.99,
                                requires_human_review=True,
                                status=FindingStatus.MANUAL_CHECK_REQUIRED,
                                rule_reference="Mandatory Statutory Disclosures",
                                evidence_status="contradicted",
                            )
                        )

        return conflict_findings
