"""
Task: Brand Copy Rewrite
Rewrites flagged excerpts to align with approved brand tone while strictly preserving factual intent.
"""
from pydantic import BaseModel, Field
from app.ai.safety import build_safe_prompt
from app.ai.schemas import AIRequest, AIResponse, AIUsageInfo


class RewriteData(BaseModel):
    """Structured response for brand rewrite."""
    replacement_text: str = Field(..., description="Rewritten copy aligned with brand guidelines")
    rationale: str = Field(..., description="Clear explanation of how revision aligns with brand standards")


def build_rewrite_request(excerpt: str, target_tone: str, intent_preservation: bool = True) -> AIRequest:
    """Builds AIRequest to rewrite copy according to brand tone."""
    system_instruction = (
        "You are an enterprise brand editor.\n"
        f"Rewrite the excerpt to align with a '{target_tone}' tone while strictly preserving factual intent.\n"
        "Do not invent new claims, metrics, or guarantees. Return valid JSON."
    )
    untrusted_blocks = {
        "original_excerpt": excerpt,
    }
    task_body = f"Target Brand Tone: {target_tone}\nPreserve Intent: {intent_preservation}"
    clean_system, clean_user = build_safe_prompt(system_instruction, untrusted_blocks, task_body)

    return AIRequest(
        task="rewrite",
        system=clean_system,
        user=clean_user,
        json_schema=RewriteData,
        max_tokens=400,
        temperature=0.2,
        extra_context={"excerpt": excerpt, "target_tone": target_tone},
    )


def deterministic_rewrite(request: AIRequest) -> AIResponse:
    """Deterministic fallback for copy rewrite."""
    excerpt = request.extra_context.get("excerpt", "")
    target_tone = request.extra_context.get("target_tone", "professional")

    # Baseline deterministic transformations
    replacements = {
        "cheap": "cost-effective",
        "crush": "outperform",
        "guaranteed zero errors": "designed for high accuracy",
        "100x": "significant",
        "infinite": "scalable",
        "magic bullet": "proven solution",
    }
    rewritten = excerpt
    for k, v in replacements.items():
        rewritten = rewritten.replace(k, v)

    if rewritten == excerpt:
        rewritten = f"Reliable and {target_tone.lower()} alternative: {excerpt}"

    data = RewriteData(
        replacement_text=rewritten,
        rationale=f"Adjusted terminology to conform with {target_tone} brand tone guidelines.",
    )

    return AIResponse(
        text=rewritten,
        data=data,
        mode="offline",
        provider="offline",
        model="deterministic_engine",
        usage=AIUsageInfo(),
    )

