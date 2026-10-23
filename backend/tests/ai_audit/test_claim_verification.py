"""Unit Tests for Claim Verification and Empirical Evidence Checking."""

import pytest
from app.services.ai_audit.claim_checking import ClaimChecker
from app.services.ai_audit.interface import VerifiedFact
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum


@pytest.fixture
def test_facts():
    return [
        VerifiedFact(
            fact_id="fact-soc2",
            organization_id="org-acme",
            claim_category="certification",
            statement="Enterprise SOC2 Type II Certified",
            approved_value="SOC2 Type II",
            source_reference="Security Standard 2026, Cert #SC-9921",
            evidence_url="https://compliance.example.com/soc2.pdf",
        ),
        VerifiedFact(
            fact_id="fact-sla",
            organization_id="org-acme",
            claim_category="metric",
            statement="Guaranteed 99.9% uptime SLA",
            approved_value="99.9%",
            source_reference="Customer Service Level Agreement 2026, Section 4.1",
        ),
        VerifiedFact(
            fact_id="fact-pricing",
            organization_id="org-acme",
            claim_category="pricing",
            statement="Pricing starts at $99 per user per month",
            approved_value="$99",
            source_reference="Product Pricing Master Sheet v4.0",
        ),
    ]


@pytest.fixture
def claim_rules():
    return [
        RetrievedRule(
            rule_id="r-claim-01",
            guideline_id="g-claims",
            category="claim_verification",
            title="Unsubstantiated Performance Claims",
            description="Absolute guarantees and superlatives must be substantiated by empirical proof.",
            severity="high",
            source_reference="Corporate Claims Policy v2.0",
            rule_config={
                "superlative_patterns": [
                    r"\b100%\s+error-free\b",
                    r"\bzero\s+(?:risk|errors)\b",
                    r"\bundisputed\s+leader\b",
                    r"\b#1\s+platform\b",
                ]
            },
        )
    ]


def test_supported_claim_does_not_trigger_contradiction(test_facts, claim_rules):
    """Verify content asserting verified empirical facts passes without contradiction."""
    checker = ClaimChecker(verified_facts=test_facts)
    supported_text = (
        "Our platform is Enterprise SOC2 Type II Certified and ensures full data isolation."
    )
    findings = checker.check(supported_text, claim_rules, verified_facts=test_facts)
    contradictions = [f for f in findings if "Contradicted" in f.title]
    assert len(contradictions) == 0


def test_contradicted_claim_is_flagged_with_factual_source(test_facts, claim_rules):
    """Verify claims contradicting certified facts are flagged and cite the authoritative reference."""
    checker = ClaimChecker(verified_facts=test_facts)
    # Claims 99.999% uptime, but SLA is 99.9%
    contradicted_text = "We provide a 99.999% uptime availability for all enterprise workloads."
    findings = checker.check(contradicted_text, claim_rules, verified_facts=test_facts)

    contradictions = [f for f in findings if "Contradicted" in f.title]
    assert len(contradictions) == 1
    finding = contradictions[0]
    assert finding.category == FindingCategoryEnum.CLAIM_VERIFICATION
    assert finding.severity == FindingSeverityEnum.HIGH
    assert finding.source_reference == "Customer Service Level Agreement 2026, Section 4.1"
    assert "99.9%" in finding.message
    assert finding.requires_human_review is True


def test_unverified_claim_never_fabricates_source_reference(test_facts, claim_rules):
    """CRITICAL INVARIANT: Unverified claims must have source_reference=None and mandate human review."""
    checker = ClaimChecker(verified_facts=test_facts)
    unverified_text = "Experience zero risk with our marketing automation platform."
    findings = checker.check(unverified_text, claim_rules, verified_facts=test_facts)

    unverified = [f for f in findings if "Unsubstantiated" in f.title]
    assert len(unverified) >= 1
    finding = unverified[0]
    # Source reference MUST be None when no empirical source exists in the registry
    assert finding.source_reference is None
    assert finding.requires_human_review is True
    assert "zero risk" in finding.evidence.lower()
