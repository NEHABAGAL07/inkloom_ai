"""
Unified AI Client for Inkloom AI.
Provider-agnostic facade coordinating model resolution, validation, telemetry, and resilient offline fallbacks.
"""
import logging
from typing import Dict, Optional, Type
import httpx

from app.ai.providers.base import BaseAIProvider
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.offline import OfflineProvider
from app.ai.safety import redact_api_keys
from app.ai.schemas import AIRequest, AIResponse
from app.core.config import settings

logger = logging.getLogger("inkloom.ai.client")


class AIClient:
    """
    Core AI client interface for Inkloom AI.
    Picks the provider from settings, validates JSON against schemas, and guarantees
    that any provider failure gracefully degrades to an offline deterministic response
    without raising an exception to callers.
    """

    # Provider dispatch table — adding OpenAI or Anthropic is a one-file addition here
    PROVIDERS: Dict[str, Type[BaseAIProvider]] = {
        "gemini": GeminiProvider,
        "google": GeminiProvider,
        "offline": OfflineProvider,
        "offline_rule_engine": OfflineProvider,
    }

    def __init__(
        self,
        provider: Optional[BaseAIProvider] = None,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._injected_provider = provider
        self._http_client = http_client
        self._offline_provider = OfflineProvider()

    def generate(self, request: AIRequest) -> AIResponse:
        """
        Executes generation using the configured online provider.
        On ANY failure (HTTP 429, 500, timeout, safety block, JSON mismatch),
        gracefully falls back to the deterministic offline path and returns mode='offline'.
        NEVER raises an exception to callers.
        """
        # If an explicit provider instance was injected (e.g. for unit tests)
        if self._injected_provider is not None:
            try:
                return self._injected_provider.generate(request)
            except Exception as exc:
                clean_msg = redact_api_keys(str(exc))
                logger.warning("Injected AI provider failed (%s); falling back to offline: %s", type(exc).__name__, clean_msg)
                return self._offline_provider.generate(request)

        # Resolve provider and model configuration from settings
        provider_name = (settings.LLM_PROVIDER or "").lower().strip()
        api_key = (settings.LLM_API_KEY or "").strip()
        model_name = (settings.LLM_MODEL_NAME or "").strip()

        # If an API key is available, automatically route to gemini unless explicitly testing offline
        if api_key and (not provider_name or provider_name in ("offline", "offline_rule_engine")):
            provider_name = "gemini"

        if not model_name and provider_name in ("gemini", "google"):
            model_name = "gemini-3.5-flash-lite"

        # Offline dispatch if no credentials or explicit offline provider
        if provider_name in ("offline", "offline_rule_engine") or not api_key or not model_name:
            return self._offline_provider.generate(request)

        provider_cls = self.PROVIDERS.get(provider_name)
        if provider_cls is None or provider_cls is OfflineProvider:
            return self._offline_provider.generate(request)

        try:
            # Instantiate provider with configured timeout and optional injected HTTP client
            online_provider = provider_cls(
                api_key=api_key,
                model_name=model_name,
                timeout=float(getattr(settings, "LLM_TIMEOUT_SECONDS", 30.0)),
                client=self._http_client,
            )
            return online_provider.generate(request)

        except Exception as exc:
            clean_msg = redact_api_keys(str(exc), api_key)
            logger.warning("Online AI provider '%s' failed (%s); falling back to offline: %s", provider_name, type(exc).__name__, clean_msg)
            return self._offline_provider.generate(request)


# Global singleton instance
default_ai_client = AIClient()


def get_ai_client() -> AIClient:
    """Returns the application-wide AIClient instance."""
    return default_ai_client

