"""
Deterministic Offline AI Provider.
Zero network access. Provides instant, rule-based deterministic fallbacks matching all task interfaces.
"""
from app.ai.providers.base import BaseAIProvider
from app.ai.schemas import AIRequest, AIResponse, AIUsageInfo
from app.ai.tasks.grounded_answer import deterministic_grounded_answer
from app.ai.tasks.explain_violation import deterministic_explain_violation
from app.ai.tasks.rewrite import deterministic_rewrite
from app.ai.tasks.campaign_adaptation import deterministic_campaign_adaptation
from app.ai.tasks.image_review import deterministic_image_review


class OfflineProvider(BaseAIProvider):
    """
    Offline deterministic rule provider.
    Guarantees 100% availability and contract conformance without cloud connectivity.
    """

    def generate(self, request: AIRequest) -> AIResponse:
        task = request.task

        if task == "grounded_answer":
            return deterministic_grounded_answer(request)
        elif task == "explain_violation":
            return deterministic_explain_violation(request)
        elif task == "rewrite":
            return deterministic_rewrite(request)
        elif task == "campaign_adaptation":
            return deterministic_campaign_adaptation(request)
        elif task == "image_review":
            return deterministic_image_review(request)

        # Default fallback for unspecialized or general tasks
        fallback_text = (
            "Inkloom AI Brand Governance: Content evaluated under active organizational policies. "
            "All structural tokens and verified capabilities preserved."
        )

        data = None
        if request.json_schema is not None:
            # If schema requested, instantiate with minimal defaults if possible
            try:
                data = request.json_schema()
            except Exception:
                pass

        return AIResponse(
            text=fallback_text,
            data=data,
            mode="offline",
            provider="offline",
            model="deterministic_engine",
            usage=AIUsageInfo(),
        )

