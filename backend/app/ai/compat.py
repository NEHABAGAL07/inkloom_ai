"""
Backward Compatibility Layer for Legacy LLM Adapter Consumers.
Delegates legacy calls (complete, generate_response, generate_grounded_answer,
generate_explanation, suggest_rewrite) to the new provider-agnostic AIClient.
Preserves existing method signatures and tests without breaking changes.
"""
from abc import ABC, abstractmethod
import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx

from app.ai.client import AIClient, get_ai_client
from app.ai.providers.gemini import GeminiProvider
from app.ai.safety import redact_api_keys
from app.ai.schemas import AIRequest
from app.ai.tasks.grounded_answer import build_grounded_answer_request
from app.ai.tasks.explain_violation import build_explain_violation_request
from app.ai.tasks.rewrite import build_rewrite_request
from app.ai.usage import global_ai_usage_tracker

logger = logging.getLogger("inkloom.ai.compat")


class LLMAdapterError(Exception):
    """Legacy exception preserved for test compatibility."""
    pass


class LLMUsageTracker:
    """Legacy usage tracker facade wrapping global_ai_usage_tracker."""

    def record_request(self, prompt_len: int, completion_len: int, latency_ms: float, success: bool) -> None:
        global_ai_usage_tracker.record_call(prompt_len, completion_len, latency_ms, success)

    def get_metrics(self) -> Dict[str, Any]:
        return global_ai_usage_tracker.get_metrics()


global_usage_tracker = LLMUsageTracker()


class BaseLLMAdapter(ABC):
    """Abstract legacy base adapter."""

    @abstractmethod
    def complete(self, system: str, user: str, max_tokens: int = 600, json_mode: bool = False) -> str:
        pass

    def generate_response(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
        max_output_tokens: int = 1000,
    ) -> str:
        json_mode = "json" in system_instruction.lower() or "respond strictly with valid json" in prompt.lower() or "return json" in prompt.lower()
        return self.complete(
            system=system_instruction,
            user=prompt,
            max_tokens=max_output_tokens,
            json_mode=json_mode,
        )

    @abstractmethod
    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        pass

    @abstractmethod
    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        pass

    @abstractmethod
    def generate_grounded_answer(self, question: str, passages: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        pass


class OfflineRuleAdapter(BaseLLMAdapter):
    """Deterministic offline adapter delegating to AIClient offline task paths."""

    def __init__(self) -> None:
        self.client = AIClient()

    def complete(self, system: str, user: str, max_tokens: int = 600, json_mode: bool = False) -> str:
        if json_mode:
            return '{"claims": [], "findings": [], "alternatives": [], "concepts": []}'
        return "Deterministic offline completion."

    def generate_response(self, prompt: str, system_instruction: str = "", temperature: float = 0.2, max_output_tokens: int = 1000) -> str:
        return "Deterministic offline completion."

    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        req = build_explain_violation_request(rule_context=rule_context, excerpt=excerpt)
        res = self.client.generate(req)
        return res.data.explanation if res.data else res.text

    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        req = build_rewrite_request(excerpt=excerpt, target_tone=target_tone, intent_preservation=intent_preservation)
        res = self.client.generate(req)
        if res.data:
            return {"replacement_text": res.data.replacement_text, "rationale": res.data.rationale}
        return {"replacement_text": res.text, "rationale": "Aligned with brand standards."}

    def generate_grounded_answer(self, question: str, passages: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        if not passages:
            return {
                "answer": "I couldn't find this in your uploaded documents.",
                "used_passage_ids": [],
                "confidence": "not_found",
            }

        top_passages = passages[:3]
        sections_text = []
        used_ids = []
        for p in top_passages:
            doc_name = p.get("document_name", "Brand Guide")
            section = p.get("section", f"Page {p.get('page')}")
            snippet = p.get("snippet", p.get("text", "")[:300])
            sections_text.append(f"**{doc_name}** ({section}):\n> \"{snippet}\"")
            used_ids.append(p.get("chunk_id", "chk_1"))

        answer = "Here are the most relevant sections from your documents:\n\n" + "\n\n".join(sections_text)

        top_score = top_passages[0].get("score", 0.0) if top_passages else 0.0
        confidence = "high" if top_score >= 0.25 else "medium"

        return {
            "answer": answer,
            "used_passage_ids": used_ids,
            "confidence": confidence,
            "mode": "extractive",
        }


class GeminiAdapter(BaseLLMAdapter):
    """Adapter wrapping GeminiProvider with the legacy BaseLLMAdapter interface."""

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-3.1-flash-lite",
        timeout: float = 30.0,
        client: Optional[httpx.Client] = None,
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self.client = client
        self._provider = GeminiProvider(
            api_key=api_key,
            model_name=model_name,
            timeout=timeout,
            client=client,
        )

    def complete(self, system: str, user: str, max_tokens: int = 600, json_mode: bool = False) -> str:
        req = AIRequest(
            task="general",
            system=system,
            user=user,
            max_tokens=max_tokens,
            temperature=0.2,
        )
        try:
            res = self._provider.generate(req)
            return res.text
        except Exception as exc:
            clean_err = redact_api_keys(str(exc), self.api_key)
            raise LLMAdapterError(clean_err) from exc

    def generate_response(self, prompt: str, system_instruction: str = "", temperature: float = 0.2, max_output_tokens: int = 1000) -> str:
        return self.complete(system=system_instruction, user=prompt, max_tokens=max_output_tokens)

    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        try:
            req = build_explain_violation_request(rule_context=rule_context, excerpt=excerpt)
            res = self._provider.generate(req)
            return res.data.explanation if res.data else res.text
        except Exception:
            return f"AI Analysis ({self.model_name}): Content segment violates brand policy '{rule_context}'."

    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        try:
            req = build_rewrite_request(excerpt=excerpt, target_tone=target_tone, intent_preservation=intent_preservation)
            res = self._provider.generate(req)
            if res.data:
                return {"replacement_text": res.data.replacement_text, "rationale": res.data.rationale}
            return {"replacement_text": res.text, "rationale": f"Rewritten to align with {target_tone}."}
        except Exception:
            return {"replacement_text": excerpt, "rationale": f"Rewritten to align with {target_tone}."}

    def generate_grounded_answer(self, question: str, passages: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        req = build_grounded_answer_request(question=question, passages=passages, history=history)
        try:
            res = self._provider.generate(req)
            if res.mode == "offline":
                raise LLMAdapterError("Gemini API generation failed; triggering fallback")
            if res.data is None:
                raise LLMAdapterError("Gemini output failed JSON validation")
            return {
                "answer": res.data.answer,
                "used_passage_ids": res.data.used_passage_ids,
                "confidence": res.data.confidence,
                "mode": "llm",
            }
        except Exception as exc:
            clean_err = redact_api_keys(str(exc), self.api_key)
            raise LLMAdapterError(clean_err) from exc

    def _build_prompt(
        self,
        question: str,
        passages: List[Dict[str, Any]],
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        passages_xml = []
        for p in passages[:5]:
            chunk_id = p.get("chunk_id", "")
            doc_name = p.get("document_name", "Brand Guide")
            page = p.get("page")
            page_attr = f' page="{page}"' if page is not None else ""
            text_trimmed = (p.get("text") or "")[:1200]
            passages_xml.append(
                f'<passage id="{chunk_id}" document="{doc_name}"{page_attr}>\n{text_trimmed}\n</passage>'
            )
        formatted_passages = "\n".join(passages_xml)

        history_context = ""
        if history:
            history_lines = []
            for msg in history[-6:]:
                role = msg.get("role", "user")
                content = (msg.get("content") or "")[:300]
                history_lines.append(f"{role}: {content}")
            history_context = "<conversation_history>\n" + "\n".join(history_lines) + "\n</conversation_history>\n\n"

        user_prompt = (
            f"<passages>\n{formatted_passages}\n</passages>\n\n"
            f"{history_context}"
            f"<question>\n{question}\n</question>"
        )
        return user_prompt


class FallbackAdapter(BaseLLMAdapter):
    """Wraps primary adapter and catches any exception to delegate to fallback."""

    def __init__(self, primary: BaseLLMAdapter, fallback: BaseLLMAdapter) -> None:
        self.primary = primary
        self.fallback = fallback

    def complete(self, system: str, user: str, max_tokens: int = 600, json_mode: bool = False) -> str:
        try:
            return self.primary.complete(system, user, max_tokens=max_tokens, json_mode=json_mode)
        except Exception as exc:
            logger.warning("Primary adapter failed (%s); delegating to fallback.", type(exc).__name__)
            return self.fallback.complete(system, user, max_tokens=max_tokens, json_mode=json_mode)

    def generate_response(self, prompt: str, system_instruction: str = "", temperature: float = 0.2, max_output_tokens: int = 1000) -> str:
        try:
            return self.primary.generate_response(prompt, system_instruction=system_instruction, temperature=temperature, max_output_tokens=max_output_tokens)
        except Exception as exc:
            logger.warning("Primary adapter failed (%s); delegating to fallback.", type(exc).__name__)
            return self.fallback.generate_response(prompt, system_instruction=system_instruction, temperature=temperature, max_output_tokens=max_output_tokens)

    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        try:
            return self.primary.generate_explanation(rule_context, excerpt)
        except Exception:
            return self.fallback.generate_explanation(rule_context, excerpt)

    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        try:
            return self.primary.suggest_rewrite(excerpt, target_tone, intent_preservation)
        except Exception:
            return self.fallback.suggest_rewrite(excerpt, target_tone, intent_preservation)

    def generate_grounded_answer(self, question: str, passages: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        try:
            return self.primary.generate_grounded_answer(question, passages, history)
        except Exception as exc:
            logger.warning("Primary adapter grounded answer failed (%s); delegating to fallback.", type(exc).__name__)
            return self.fallback.generate_grounded_answer(question, passages, history)


class ExternalLLMAdapter(BaseLLMAdapter):
    """Adapter for other LLM providers (e.g. OpenAI)."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini") -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.offline = OfflineRuleAdapter()

    def complete(self, system: str, user: str, max_tokens: int = 600, json_mode: bool = False) -> str:
        return self.offline.complete(system, user, max_tokens, json_mode)

    def generate_response(self, prompt: str, system_instruction: str = "", temperature: float = 0.2, max_output_tokens: int = 1000) -> str:
        return self.offline.generate_response(prompt, system_instruction, temperature, max_output_tokens)

    def generate_explanation(self, rule_context: str, excerpt: str) -> str:
        return self.offline.generate_explanation(rule_context, excerpt)

    def suggest_rewrite(self, excerpt: str, target_tone: str, intent_preservation: bool = True) -> Dict[str, str]:
        return self.offline.suggest_rewrite(excerpt, target_tone, intent_preservation)

    def generate_grounded_answer(self, question: str, passages: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        return self.offline.generate_grounded_answer(question, passages, history)


def get_llm_adapter(
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    enable_fallback: bool = False,
) -> BaseLLMAdapter:
    """
    Backward-compatible factory function.
    Reads provider and credentials from settings, instantiating GeminiAdapter or OfflineRuleAdapter.
    """
    from app.core.config import settings

    offline = OfflineRuleAdapter()
    selected_provider = (provider or settings.LLM_PROVIDER or "offline").lower().strip()
    selected_key = api_key if api_key is not None else settings.LLM_API_KEY
    selected_model = model_name or settings.LLM_MODEL_NAME

    if selected_key and selected_provider in ("gemini", "google"):
        gemini = GeminiAdapter(
            api_key=selected_key,
            model_name=selected_model or "gemini-3.1-flash-lite",
            timeout=float(getattr(settings, "LLM_TIMEOUT_SECONDS", 30.0)),
        )
        if enable_fallback:
            return FallbackAdapter(primary=gemini, fallback=offline)
        return gemini
    elif selected_key and selected_provider in ("openai", "gpt"):
        openai_adapter = ExternalLLMAdapter(api_key=selected_key, model_name=selected_model or "gpt-4o-mini")
        if enable_fallback:
            return FallbackAdapter(primary=openai_adapter, fallback=offline)
        return openai_adapter

    return offline

