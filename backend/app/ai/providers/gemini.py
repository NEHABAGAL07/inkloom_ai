"""
Google Gemini Provider via REST API.
Passes API key ONLY via x-goog-api-key HTTP header.
Supports multimodal images, exponential retry on 429/5xx, safety handling, and client injection for tests.
"""
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
import httpx
from pydantic import ValidationError

from app.ai.providers.base import BaseAIProvider, ProviderError
from app.ai.safety import redact_api_keys
from app.ai.schemas import AIRequest, AIResponse, AIUsageInfo
from app.ai.usage import global_ai_usage_tracker

logger = logging.getLogger("inkloom.ai.gemini")


class GeminiProvider(BaseAIProvider):
    """
    Direct client for Google Gemini generateContent endpoint.
    Uses httpx for high-throughput connection pooling.
    """

    def __init__(
        self,
        api_key: str,
        model_name: str,
        timeout: float = 30.0,
        client: Optional[httpx.Client] = None,
        base_url: str = "https://generativelanguage.googleapis.com",
    ) -> None:
        if not api_key:
            raise ProviderError("GeminiProvider requires a valid API key.")
        if not model_name:
            raise ProviderError("GeminiProvider requires a model name.")

        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self.client = client
        self.base_url = base_url.rstrip("/")

    def generate(self, request: AIRequest) -> AIResponse:
        url = f"{self.base_url}/v1beta/models/{self.model_name}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

        # Build payload parts (text + images)
        parts: List[Dict[str, Any]] = []
        if request.user:
            parts.append({"text": request.user})

        for img in request.images:
            if img.data_base64:
                parts.append({
                    "inlineData": {
                        "mimeType": img.mime_type or "image/png",
                        "data": img.data_base64,
                    }
                })

        if not parts:
            parts.append({"text": "Continue task."})

        payload: Dict[str, Any] = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens,
            },
        }

        if request.system:
            payload["systemInstruction"] = {
                "parts": [{"text": request.system}],
            }

        if request.json_schema is not None:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        start_time = time.perf_counter()
        response: Optional[httpx.Response] = None
        max_retries = 2

        # Retry loop for 429 and 5xx errors with exponential backoff
        for attempt in range(max_retries + 1):
            try:
                if self.client is not None:
                    response = self.client.post(url, headers=headers, json=payload, timeout=self.timeout)
                else:
                    with httpx.Client(timeout=self.timeout) as http_client:
                        response = http_client.post(url, headers=headers, json=payload)

                if response.status_code in (429, 500, 502, 503, 504) and attempt < max_retries:
                    time.sleep(0.5 * (2 ** attempt))
                    continue
                break
            except (httpx.TimeoutException, httpx.HTTPError) as exc:
                if attempt < max_retries:
                    time.sleep(0.5 * (2 ** attempt))
                    continue
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                clean_err = redact_api_keys(str(exc), self.api_key)
                global_ai_usage_tracker.record_call(
                    prompt_len=len(request.user) + len(request.system),
                    completion_len=0,
                    latency_ms=elapsed_ms,
                    success=False,
                )
                logger.warning("Gemini transport error (%s): %s", type(exc).__name__, clean_err)
                raise ProviderError(f"Gemini transport error: {type(exc).__name__}") from exc

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        if response is None or response.status_code != 200:
            status = response.status_code if response else "no_response"
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=0,
                latency_ms=elapsed_ms,
                success=False,
            )
            logger.warning("Gemini API non-200 response: HTTP %s", status)
            raise ProviderError(f"Gemini API returned HTTP status {status}")

        try:
            data = response.json()
        except Exception as exc:
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=0,
                latency_ms=elapsed_ms,
                success=False,
            )
            raise ProviderError("Gemini response is not valid JSON") from exc

        # Handle prompt-level content blocking (SAFETY, OTHER)
        prompt_feedback = data.get("promptFeedback") or {}
        if prompt_feedback.get("blockReason"):
            reason = prompt_feedback.get("blockReason")
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=0,
                latency_ms=elapsed_ms,
                success=False,
            )
            logger.warning("Gemini prompt blocked due to: %s", reason)
            raise ProviderError(f"Gemini blocked prompt: {reason}")

        candidates = data.get("candidates") or []
        if not candidates:
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=0,
                latency_ms=elapsed_ms,
                success=False,
            )
            raise ProviderError("Gemini returned zero candidates.")

        candidate = candidates[0]
        finish_reason = candidate.get("finishReason")
        if finish_reason in ("SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "MAX_TOKENS"):
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=0,
                latency_ms=elapsed_ms,
                success=False,
            )
            raise ProviderError(f"Gemini candidate stopped due to finishReason: {finish_reason}")

        # Extract text content parts safely
        content = candidate.get("content") or {}
        parts_list = content.get("parts") or []
        raw_text = "".join(p.get("text", "") for p in parts_list).strip()

        if not raw_text:
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=0,
                latency_ms=elapsed_ms,
                success=False,
            )
            raise ProviderError(f"Gemini returned empty text (finishReason: {finish_reason}).")

        # If finishReason is MAX_TOKENS and JSON was expected, output is truncated/corrupt
        if finish_reason == "MAX_TOKENS" and request.json_schema is not None:
            global_ai_usage_tracker.record_call(
                prompt_len=len(request.user) + len(request.system),
                completion_len=len(raw_text),
                latency_ms=elapsed_ms,
                success=False,
            )
            raise ProviderError("Gemini hit MAX_TOKENS while generating structured JSON.")

        # Parse and validate structured output against request.json_schema if requested
        parsed_data: Optional[Any] = None
        if request.json_schema is not None:
            cleaned = raw_text
            # Strip markdown fences if present
            if "```" in cleaned:
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

            try:
                dict_payload = json.loads(cleaned)
                parsed_data = request.json_schema.model_validate(dict_payload)
            except (json.JSONDecodeError, ValidationError) as schema_err:
                global_ai_usage_tracker.record_call(
                    prompt_len=len(request.user) + len(request.system),
                    completion_len=len(raw_text),
                    latency_ms=elapsed_ms,
                    success=False,
                )
                logger.warning("Gemini JSON output failed validation: %s", schema_err)
                raise ProviderError(f"Gemini structured output validation failed: {schema_err}") from schema_err

        # Record successful usage
        global_ai_usage_tracker.record_call(
            prompt_len=len(request.user) + len(request.system),
            completion_len=len(raw_text),
            latency_ms=elapsed_ms,
            success=True,
        )

        return AIResponse(
            text=raw_text,
            data=parsed_data,
            mode="llm",
            provider="gemini",
            model=self.model_name,
            usage=AIUsageInfo(
                prompt_tokens=max(1, (len(request.user) + len(request.system)) // 4),
                completion_tokens=max(1, len(raw_text) // 4),
                total_tokens=max(2, (len(request.user) + len(request.system) + len(raw_text)) // 4),
                latency_ms=round(elapsed_ms, 2),
            ),
        )

