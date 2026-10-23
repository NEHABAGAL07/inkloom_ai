"""
Model Adapter Interface for Optional External AI Providers

Enables switching between offline deterministic rules, local open weights,
or cloud LLMs (OpenAI, Anthropic, Gemini) via environment configuration.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLMAdapter(ABC):
    @abstractmethod
    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        """Generates contextual explanation of guideline violation."""
        pass

    @abstractmethod
    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        """Suggests intent-preserving rewrite matching brand guidelines."""
        pass


class OfflineRuleAdapter(BaseLLMAdapter):
    """
    Default offline adapter that does not require network access or paid API keys.
    Returns deterministic, safe explanations and corrections.
    """
    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        return f"Violation detected: Excerpt '{excerpt}' conflicts with established rule: {rule_context}."

    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        return {
            "replacement_text": f"[Revised for {target_tone}] {excerpt}",
            "rationale": f"Generated deterministic rewrite aligning with {target_tone} brand tone.",
        }


class ExternalLLMAdapter(BaseLLMAdapter):
    """
    Adapter stub for external cloud LLM providers (e.g. OpenAI / Anthropic / Gemini).
    Enabled when LLM_API_KEY is configured in .env.
    """
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name

    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        # Placeholder for external API call
        return f"AI Analysis ({self.model_name}): Content segment violates brand policy '{rule_context}'."

    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        # Placeholder for external API call
        return {
            "replacement_text": excerpt,
            "rationale": f"Rewritten to align with {target_tone} via {self.model_name}.",
        }


def get_llm_adapter(provider: str = "offline_rule_engine", api_key: Optional[str] = None) -> BaseLLMAdapter:
    if provider != "offline_rule_engine" and api_key:
        return ExternalLLMAdapter(api_key=api_key)
    return OfflineRuleAdapter()
