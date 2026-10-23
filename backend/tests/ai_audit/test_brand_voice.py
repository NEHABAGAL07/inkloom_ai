"""Unit Tests for Brand Voice and Adaptive Human Feedback Mechanism."""

import pytest
from app.services.ai_audit.brand_voice import BrandVoiceAnalyzer
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.services.ai_audit.interface import ContentContext
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum


@pytest.fixture
def tone_rules():
    return [
        RetrievedRule(
            rule_id="r-tone-01",
            guideline_id="g-voice",
            category="tone_and_voice",
            title="Avoid Hyperbole in B2B Copy",
            description="Enterprise copy should be authoritative, not hyperbolic.",
            severity="low",
            source_reference="Editorial Style Guide Sec 2.1",
            rule_config={
                "colloquialisms": ["super pumped", "game changer", "crazy good"],
                "suggested_replacements": {
                    "super pumped": "proud",
                    "game changer": "significant milestone",
                    "crazy good": "exceptional",
                },
            },
        )
    ]


def test_colloquialism_flagged_with_minimal_replacement(tone_rules):
    """Verify informal phrases trigger tone recommendations with local edits."""
    analyzer = BrandVoiceAnalyzer()
    text = "We are super pumped to launch our new product."
    ctx = ContentContext(content_id="cnt-001", channel="press_release")

    findings = analyzer.check(text, tone_rules, context=ctx)
    assert len(findings) == 1
    f = findings[0]
    assert f.category == FindingCategoryEnum.TONE_AND_VOICE
    assert f.severity == FindingSeverityEnum.LOW
    assert f.suggested_correction == "We are proud to launch our new product."
    assert "press_release" in f.message


def test_adaptive_reviewer_feedback_exception_and_rollback(tone_rules):
    """Verify reviewer-approved exceptions are respected and can be rolled back."""
    analyzer = BrandVoiceAnalyzer()
    org_id = "org-test-corp"
    text = "This partnership is a game changer for retail."
    ctx = ContentContext(content_id="cnt-002", organization_id=org_id)

    # Initially, 'game changer' is flagged
    findings_before = analyzer.check(text, tone_rules, context=ctx)
    assert len(findings_before) == 1

    # Human reviewer explicitly approves 'game changer' as acceptable for this org
    pref = analyzer.record_reviewer_feedback(
        organization_id=org_id,
        rule_key="r-tone-01",
        pattern="game changer",
        approved_by="lead_reviewer@example.com",
        reason="Approved for executive marketing quote in retail campaign",
    )
    assert pref.is_active is True

    # With the learned exception active, the phrase is NOT flagged
    findings_after = analyzer.check(text, tone_rules, context=ctx)
    assert len(findings_after) == 0

    # Test rollback capability: disabling the learned preference restores the check
    analyzer.rollback_learned_preference(org_id, pref.preference_id)
    findings_rollback = analyzer.check(text, tone_rules, context=ctx)
    assert len(findings_rollback) == 1
