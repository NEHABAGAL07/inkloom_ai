"""
Inkloom AI Layer.
Clean, provider-agnostic package providing resilient generation, multimodal inspection,
prompt safety, usage telemetry, and standardized governance tasks.
"""
from app.ai.client import AIClient, default_ai_client, get_ai_client
from app.ai.compat import (
    BaseLLMAdapter,
    ExternalLLMAdapter,
    FallbackAdapter,
    GeminiAdapter,
    LLMAdapterError,
    LLMUsageTracker,
    OfflineRuleAdapter,
    get_llm_adapter,
    global_usage_tracker,
)
from app.ai.providers.base import BaseAIProvider, ProviderError
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.offline import OfflineProvider
from app.ai.safety import build_safe_prompt, redact_api_keys
from app.ai.schemas import AIImageItem, AIRequest, AIResponse, AIUsageInfo
from app.ai.usage import AIUsageTracker, global_ai_usage_tracker

__all__ = [
    "AIClient",
    "get_ai_client",
    "default_ai_client",
    "AIRequest",
    "AIResponse",
    "AIImageItem",
    "AIUsageInfo",
    "BaseAIProvider",
    "ProviderError",
    "GeminiProvider",
    "OfflineProvider",
    "redact_api_keys",
    "build_safe_prompt",
    "AIUsageTracker",
    "global_ai_usage_tracker",
    # Backward compatibility re-exports
    "BaseLLMAdapter",
    "GeminiAdapter",
    "OfflineRuleAdapter",
    "FallbackAdapter",
    "ExternalLLMAdapter",
    "LLMAdapterError",
    "LLMUsageTracker",
    "global_usage_tracker",
    "get_llm_adapter",
]

