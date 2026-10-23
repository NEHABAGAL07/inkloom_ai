"""Unit Tests for Content Quality, Readability, and Accessibility Module."""

import pytest
from app.services.ai_audit.content_quality import ContentQualityChecker
from app.services.ai_audit.interface import ContentContext
from app.schemas.common import FindingCategoryEnum


def test_long_run_on_sentence_flagged():
    """Verify sentences exceeding readability limits are flagged."""
    checker = ContentQualityChecker()
    long_sentence = (
        "Our enterprise governance solution coordinates complex multi-stage media extraction, "
        "deterministic rule verification, natural language voice analysis, claim substantiation, "
        "evidence cross-referencing, multi-tenant workspace isolation, and automated workflow state "
        "transitions across disparate distributed systems, enabling brand managers to verify all "
        "advertising collateral with unprecedented fidelity."
    )
    findings = checker.check(long_sentence)
    long_sent_findings = [f for f in findings if "Long Sentence" in f.title]
    assert len(long_sent_findings) == 1
    assert long_sent_findings[0].category == FindingCategoryEnum.ACCESSIBILITY


def test_undefined_acronyms_detected():
    """Verify undefined technical jargon acronyms are flagged, while universal acronyms are allowed."""
    checker = ContentQualityChecker()
    # "ROAS" and "CAC" are undefined; "AI" and "B2B" are common universal exceptions
    text = (
        "Our B2B AI governance software significantly increases your ROAS while drastically cutting CAC."
    )
    findings = checker.check(text)
    acronym_findings = [f for f in findings if "Undefined Acronym" in f.title]
    flagged_terms = [f.evidence for f in acronym_findings]

    assert "ROAS" in flagged_terms
    assert "CAC" in flagged_terms
    # Universal acronyms must not be flagged
    assert "AI" not in flagged_terms
    assert "B2B" not in flagged_terms


def test_ambiguous_call_to_action_detected():
    """Verify non-descriptive link text like 'click here' is flagged for accessibility."""
    checker = ContentQualityChecker()
    text = "For more details about our security program, please click here."
    findings = checker.check(text)

    cta_findings = [f for f in findings if "Call-To-Action" in f.title]
    assert len(cta_findings) == 1
    assert "click here" in cta_findings[0].evidence.lower()


def test_missing_alt_text_flagged_when_media_metadata_present():
    """Verify visual media assets without alt-text trigger accessibility finding."""
    checker = ContentQualityChecker()
    ctx = ContentContext(
        content_id="cnt-image-01",
        content_type="image",
        media_metadata={"alt_text": None, "width": 1200, "height": 630},
    )
    findings = checker.check("Banner advertising image asset", context=ctx)
    alt_findings = [f for f in findings if "Alternative Text" in f.title]
    assert len(alt_findings) == 1
