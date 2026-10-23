"""Inkloom AI - Provider-Neutral LLM Adapter Module.

Supports:
1. RuleBasedFallbackAdapter: 100% offline fallback when no API key is provided.
2. MockLLMAdapter: Test harness for deterministic testing without external API calls.
3. GeminiLLMAdapter: Google Gemini REST integration with structured JSON validation and timeout bounds.
4. OpenAILLMAdapter: OpenAI compatible integration.

All adapters parse model output through Pydantic FindingSchema validation and enforce
strict prompt injection defenses.
"""

import json
import logging
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import httpx
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.services.ai_audit.interface import ContentContext
from app.services.ai_audit.prompts.templates import (
    SYSTEM_AUDIT_PROMPT,
    build_user_audit_prompt,
)

logger = logging.getLogger(__name__)


class BaseLLMAdapter(ABC):
    """Abstract interface for optional generative AI audit model adapters."""

    def __init__(
        self,
        provider: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 8.0,
    ):
        self.provider = provider
        self.api_key = api_key
        self.model_name = model_name or "default-model"
        self.timeout_seconds = timeout_seconds

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if provider has valid credentials and is active."""
        pass

    @abstractmethod
    def run_advanced_audit(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        """Invoke LLM and return validated FindingSchema objects."""
        pass

    def _parse_and_validate_json_response(
        self,
        raw_response: str,
        text: str,
    ) -> List[FindingSchema]:
        """Defensively parse JSON from model output and validate against FindingSchema."""
        cleaned_json = raw_response.strip()
        # Remove markdown code block fences if present
        if cleaned_json.startswith("```json"):
            cleaned_json = cleaned_json[7:]
        elif cleaned_json.startswith("```"):
            cleaned_json = cleaned_json[3:]
        if cleaned_json.endswith("```"):
            cleaned_json = cleaned_json[:-3]
        cleaned_json = cleaned_json.strip()

        try:
            data = json.loads(cleaned_json)
        except json.JSONDecodeError as e:
            logger.warning("LLM returned non-JSON response: %s", str(e))
            return []

        if not isinstance(data, list):
            logger.warning("Expected JSON array of findings, got %s", type(data))
            return []

        validated_findings: List[FindingSchema] = []
        for idx, item in enumerate(data):
            if not isinstance(item, dict):
                continue
            try:
                # Resolve category
                cat_str = str(item.get("category", "tone_and_voice")).lower()
                try:
                    category = FindingCategoryEnum(cat_str)
                except ValueError:
                    category = FindingCategoryEnum.TONE_AND_VOICE

                # Resolve severity
                sev_str = str(item.get("severity", "low")).lower()
                try:
                    severity = FindingSeverityEnum(sev_str)
                except ValueError:
                    severity = FindingSeverityEnum.LOW

                evidence = item.get("evidence")
                start_offset = None
                end_offset = None
                line = 1
                if evidence and isinstance(evidence, str) and evidence in text:
                    start_offset = text.find(evidence)
                    end_offset = start_offset + len(evidence)
                    line = text[:start_offset].count("\n") + 1

                location = LocationSchema(
                    start_offset=start_offset,
                    end_offset=end_offset,
                    line=line,
                    page=1,
                ) if start_offset is not None else None

                finding = FindingSchema(
                    id=str(item.get("id") or f"ai-gen-{idx+1}"),
                    category=category,
                    severity=severity,
                    title=str(item.get("title") or "AI Quality Finding"),
                    message=str(item.get("message") or "Governance concern flagged by AI engine."),
                    evidence=evidence,
                    source_reference=item.get("source_reference"),
                    confidence=float(min(1.0, max(0.0, item.get("confidence", 0.85)))),
                    suggested_correction=item.get("suggested_correction"),
                    status=FindingStatusEnum.FLAGGED,
                    location=location,
                    requires_human_review=bool(item.get("requires_human_review", False)),
                )
                validated_findings.append(finding)
            except Exception as parse_err:
                logger.debug("Skipping malformed LLM finding item: %s", str(parse_err))
                continue

        return validated_findings


class RuleBasedFallbackAdapter(BaseLLMAdapter):
    """Fallback when no external LLM provider is configured."""

    def __init__(self, **kwargs):
        super().__init__(provider="rule_based_fallback", **kwargs)

    def is_configured(self) -> bool:
        return False

    def run_advanced_audit(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        return []


class MockLLMAdapter(BaseLLMAdapter):
    """Configurable mock adapter for fast, deterministic unit and integration tests."""

    def __init__(
        self,
        mock_findings: Optional[List[FindingSchema]] = None,
        should_fail: bool = False,
        **kwargs,
    ):
        super().__init__(provider="mock", api_key="mock-test-key", model_name="mock-audit-v1", **kwargs)
        self.mock_findings = mock_findings or []
        self.should_fail = should_fail
        self.invocation_count = 0
        self.last_prompt = ""

    def is_configured(self) -> bool:
        return True

    def run_advanced_audit(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        self.invocation_count += 1
        self.last_prompt = build_user_audit_prompt(
            text=text,
            rules=rules,
            channel=context.channel if context else None,
            target_audience=context.target_audience if context else None,
        )
        if self.should_fail:
            raise RuntimeError("Simulated provider outage / rate limit in MockLLMAdapter.")
        return list(self.mock_findings)


class GeminiLLMAdapter(BaseLLMAdapter):
    """Google Gemini REST client with bounded timeout and JSON output enforcement."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 8.0,
        **kwargs,
    ):
        super().__init__(
            provider="gemini",
            api_key=api_key,
            model_name=model_name or "gemini-1.5-pro",
            timeout_seconds=timeout_seconds,
        )

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.provider == "gemini")

    def run_advanced_audit(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        if not self.is_configured():
            return []

        user_prompt = build_user_audit_prompt(
            text=text,
            rules=rules,
            channel=context.channel if context else None,
            target_audience=context.target_audience if context else None,
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key or "",
        }
        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_AUDIT_PROMPT}]
            },
            "contents": [
                {"role": "user", "parts": [{"text": user_prompt}]}
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.warning("Gemini API call failed with status %d", response.status_code)
                    return []
                resp_json = response.json()
                raw_text = (
                    resp_json.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "[]")
                )
                return self._parse_and_validate_json_response(raw_text, text)
        except (httpx.TimeoutException, httpx.RequestError) as net_err:
            logger.warning("Gemini network/timeout error: %s", str(net_err))
            return []
        except Exception as e:
            logger.warning("Gemini unexpected error: %s", str(e))
            return []


class OpenAILLMAdapter(BaseLLMAdapter):
    """OpenAI API client adapter with bounded timeout."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 8.0,
        **kwargs,
    ):
        super().__init__(
            provider="openai",
            api_key=api_key,
            model_name=model_name or "gpt-4o-mini",
            timeout_seconds=timeout_seconds,
        )

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.provider == "openai")

    def run_advanced_audit(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        if not self.is_configured():
            return []

        user_prompt = build_user_audit_prompt(
            text=text,
            rules=rules,
            channel=context.channel if context else None,
            target_audience=context.target_audience if context else None,
        )

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_AUDIT_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.warning("OpenAI API call failed with status %d", response.status_code)
                    return []
                resp_json = response.json()
                content = resp_json["choices"][0]["message"]["content"]
                # If wrapped in an object {"findings": [...]}, extract list
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "findings" in parsed:
                    content = json.dumps(parsed["findings"])
                return self._parse_and_validate_json_response(content, text)
        except Exception as e:
            logger.warning("OpenAI error: %s", str(e))
            return []


def create_llm_adapter(
    provider: str,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    timeout_seconds: float = 8.0,
) -> BaseLLMAdapter:
    """Factory creating appropriate LLM adapter."""
    prov = (provider or "rule_based_fallback").lower().strip()
    if prov == "gemini":
        return GeminiLLMAdapter(api_key=api_key, model_name=model_name, timeout_seconds=timeout_seconds)
    elif prov == "openai":
        return OpenAILLMAdapter(api_key=api_key, model_name=model_name, timeout_seconds=timeout_seconds)
    elif prov == "mock":
        return MockLLMAdapter()
    return RuleBasedFallbackAdapter()
