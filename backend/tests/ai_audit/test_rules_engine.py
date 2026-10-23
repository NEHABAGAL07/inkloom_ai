"""Unit Tests for Deterministic Rules Engine and Terminology."""

import pytest
from app.services.ai_audit.rules_engine import DeterministicRuleEngine
from app.services.ai_audit.terminology import TerminologyChecker
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum


def test_forbidden_terms_word_boundary_safety():
    """Verify terms only match on word boundaries and do not trigger inside unrelated words."""
    checker = TerminologyChecker()
    rules = [
        RetrievedRule(
            rule_id="r-term-01",
            guideline_id="g-01",
            category="terminology",
            title="Forbidden Term Checker",
            description="Do not use 'cheap'.",
            severity="medium",
            rule_config={
                "forbidden_variants": ["cheap"],
                "preferred_term": "cost-effective",
            },
        )
    ]

    # "cheap" inside "cheaper" or "cheaply" or "acheaper" should match word boundaries or not subwords
    text_inside_word = "We offer the cheapest solutions with great achievers."
    res_subword = checker.check(text_inside_word, rules)
    assert len(res_subword) == 0, "Should not flag 'cheap' inside 'cheapest'"

    # Standalone "cheap"
    text_standalone = "This is a cheap tool."
    res_standalone = checker.check(text_standalone, rules)
    assert len(res_standalone) == 1
    assert res_standalone[0].suggested_correction == "This is a cost-effective tool."


def test_required_mandatory_disclosures():
    """Verify missing required disclosures trigger appropriate findings."""
    engine = DeterministicRuleEngine()
    rules = [
        RetrievedRule(
            rule_id="r-disc-01",
            guideline_id="g-legal",
            category="legal_compliance",
            title="Promotional Financing Disclosure",
            description="Promotional campaigns must state terms apply.",
            severity="high",
            rule_config={
                "required_phrases": ["Terms and conditions apply."],
            },
        )
    ]

    # Without disclosure
    res_missing = engine.check("Get 50% discount when you sign up today!", rules)
    assert len(res_missing) == 1
    assert res_missing[0].category == FindingCategoryEnum.LEGAL_COMPLIANCE
    assert "Missing Mandatory Disclosure" in res_missing[0].title

    # With disclosure
    res_present = engine.check("Get 50% discount today! Terms and conditions apply.", rules)
    assert len(res_present) == 0


def test_safe_regex_and_redos_prevention():
    """Verify pathological regex patterns or giant inputs do not hang or crash the engine."""
    engine = DeterministicRuleEngine()
    # Pathological nested quantifier pattern intended for ReDoS
    malicious_rule = RetrievedRule(
        rule_id="r-redos-01",
        guideline_id="g-sec",
        category="prohibited_content",
        title="Pathological Pattern",
        description="Dangerous regex",
        severity="low",
        rule_config={
            "regex_patterns": ["(a+)+b"],  # classic catastrophic backtracking
        },
    )

    # Giant string
    long_text = "a" * 1000 + "!"
    # Must evaluate quickly without hanging
    res = engine.check(long_text, [malicious_rule])
    # The engine should safely skip or safely bound execution
    assert isinstance(res, list)


def test_unicode_and_punctuation_handling():
    """Verify unicode characters, accents, and diverse punctuation are handled cleanly."""
    checker = TerminologyChecker()
    rules = [
        RetrievedRule(
            rule_id="r-unicode",
            guideline_id="g-01",
            category="terminology",
            title="Accented Term Check",
            description="Use 'café' instead of 'cafe'.",
            severity="low",
            rule_config={
                "forbidden_variants": ["cafe"],
                "preferred_term": "café",
            },
        )
    ]

    text = "Join us at the local cafe—bring your colleagues! (Special offer: €100 / ¥10,000)."
    res = checker.check(text, rules)
    assert len(res) == 1
    assert res[0].location.start_offset is not None
    assert "café" in res[0].suggested_correction


def test_empty_and_whitespace_content():
    """Verify empty or whitespace-only inputs produce zero findings without errors."""
    checker = TerminologyChecker()
    engine = DeterministicRuleEngine()
    assert checker.check("", []) == []
    assert checker.check("   \n\t   ", []) == []
    assert engine.check("", []) == []


def test_invalid_rule_config_graceful_handling():
    """Verify malformed or corrupt rule configurations are safely ignored without crashing."""
    engine = DeterministicRuleEngine()
    corrupt_rules = [
        RetrievedRule(
            rule_id="r-corrupt-1",
            guideline_id="g-01",
            category="invalid_category_test",
            title="Corrupt Rule",
            description="No config",
            severity="unknown_severity",
            rule_config={"regex_patterns": ["[invalid(regex"]},  # Unclosed bracket
        )
    ]
    # Should not raise regex error or enum crash
    res = engine.check("Sample marketing text", corrupt_rules)
    assert isinstance(res, list)
