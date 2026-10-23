"""Unit Tests for LLM Adapter, Provider Error Recovery, and Output Validation."""

import json
import pytest
from app.services.ai_audit.llm_adapter import (
    MockLLMAdapter,
    RuleBasedFallbackAdapter,
    BaseLLMAdapter,
    create_llm_adapter,
)
from app.services.ai_audit.engine import AIAuditEngine
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum


class DummyParserAdapter(BaseLLMAdapter):
    """Adapter exposing parse method for unit testing."""
    def is_configured(self) -> bool:
        return True
    def run_advanced_audit(self, text, rules, context=None):
        return []


def test_rule_based_fallback_when_no_api_key():
    """Verify engine gracefully defaults to deterministic checks when LLM has no credentials."""
    adapter = create_llm_adapter(provider="rule_based_fallback", api_key=None)
    assert not adapter.is_configured()
    assert adapter.run_advanced_audit("Sample text", []) == []


def test_llm_provider_error_does_not_break_audit():
    """Verify provider outages or rate limits do not crash the engine; deterministic checks survive."""
    failing_adapter = MockLLMAdapter(should_fail=True)
    engine = AIAuditEngine(model_adapter=failing_adapter)

    test_text = "Try inkloom today for best-in-class workflows."
    # Even though LLM raises an outage exception, audit_text must succeed cleanly
    result = engine.audit_text(text=test_text, content_id="cnt-outage-01")

    assert result.content_id == "cnt-outage-01"
    # Deterministic terminology finding should still be present
    assert len(result.findings) >= 1
    assert any(f.category == FindingCategoryEnum.TERMINOLOGY for f in result.findings)


def test_llm_malformed_json_resilience():
    """Verify malformed JSON, markdown fences, and bad schemas are handled defensively."""
    parser = DummyParserAdapter(provider="test", api_key="dummy")
    sample_text = "Enterprise compliance for all campaigns."

    # Test 1: Markdown wrapped valid JSON
    markdown_json = """```json
    [
      {
        "id": "ai-001",
        "category": "tone_and_voice",
        "severity": "medium",
        "title": "Nuanced Passive Tone",
        "message": "Prefer active voice.",
        "evidence": "Enterprise compliance",
        "confidence": 0.88,
        "requires_human_review": false
      }
    ]
    ```"""
    parsed = parser._parse_and_validate_json_response(markdown_json, sample_text)
    assert len(parsed) == 1
    assert parsed[0].category == FindingCategoryEnum.TONE_AND_VOICE
    assert parsed[0].location.start_offset == 0

    # Test 2: Complete garbage / non-JSON prose
    garbage = "I am an AI and I think this content looks mostly fine, but watch your tone."
    parsed_garbage = parser._parse_and_validate_json_response(garbage, sample_text)
    assert parsed_garbage == []

    # Test 3: Invalid category / severity coerced to safe defaults
    invalid_enums_json = """[
      {
        "id": "ai-002",
        "category": "non_existent_category",
        "severity": "mega_critical",
        "title": "Coerced Finding",
        "message": "Testing fallback enums",
        "confidence": 1.5
      }
    ]"""
    coerced = parser._parse_and_validate_json_response(invalid_enums_json, sample_text)
    assert len(coerced) == 1
    assert coerced[0].category == FindingCategoryEnum.TONE_AND_VOICE
    assert coerced[0].severity == FindingSeverityEnum.LOW
    assert coerced[0].confidence == 1.0  # Bounded to 1.0
