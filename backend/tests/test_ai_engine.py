"""Unit Tests for AI Brand Audit Engine."""

import pytest
from app.services.ai_audit.engine import AIAuditEngine
from app.schemas.common import AuditStatusEnum, FindingCategoryEnum, FindingSeverityEnum


def test_compliant_content_passes():
    """Verify clean, compliant content returns PASSED with zero findings."""
    engine = AIAuditEngine()
    compliant_text = (
        "Welcome to the Inkloom AI Brand Governance Platform. "
        "We are proud to announce enhanced compliance reporting for enterprise marketing teams. "
        "Our architecture supports multi-tenant isolation and granular role-based access control."
    )
    result = engine.audit_text(text=compliant_text, content_id="cnt-compliant-001")

    assert result.overall_status == AuditStatusEnum.PASSED
    assert len(result.findings) == 0
    assert "conforms to all verified brand guidelines" in result.summary


def test_terminology_casing_violation_flagged():
    """Verify improper capitalization of brand name triggers terminology finding."""
    engine = AIAuditEngine()
    violating_text = "Users love using inkloom for their daily brand audits."
    result = engine.audit_text(text=violating_text, content_id="cnt-term-001")

    term_findings = [f for f in result.findings if f.category == FindingCategoryEnum.TERMINOLOGY]
    assert len(term_findings) == 1
    assert "Brand Name Capitalization & Casing" in term_findings[0].title
    assert term_findings[0].suggested_correction is not None
    assert "Inkloom AI" in term_findings[0].suggested_correction


def test_unsubstantiated_claim_requires_human_review():
    """Verify absolute superlative claims require human review and do not fabricate sources."""
    engine = AIAuditEngine()
    violating_text = "Our software delivers a 100% error-free guarantee for all advertising materials."
    result = engine.audit_text(text=violating_text, content_id="cnt-claim-001")

    claim_findings = [f for f in result.findings if f.category == FindingCategoryEnum.CLAIM_VERIFICATION]
    assert len(claim_findings) >= 1
    finding = claim_findings[0]
    assert finding.severity == FindingSeverityEnum.HIGH
    assert finding.requires_human_review is True
    # Crucial invariant: source_reference MUST be None when no empirical source exists!
    assert finding.source_reference is None


def test_tone_and_voice_colloquialism_flagged():
    """Verify informal slang triggers tone recommendation."""
    engine = AIAuditEngine()
    violating_text = "The entire executive team is super pumped about the upcoming product release."
    result = engine.audit_text(text=violating_text, content_id="cnt-tone-001")

    tone_findings = [f for f in result.findings if f.category == FindingCategoryEnum.TONE_AND_VOICE]
    assert len(tone_findings) >= 1
    assert "super pumped" in tone_findings[0].evidence.lower()
    assert tone_findings[0].suggested_correction is not None
    assert "proud" in tone_findings[0].suggested_correction
