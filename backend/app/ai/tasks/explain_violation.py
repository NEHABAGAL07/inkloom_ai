"""
Task: Explain Brand Guideline Violation
Provides concise, objective explanations for why a flagged excerpt violates a brand rule.
"""
from pydantic import BaseModel, Field
from app.ai.safety import build_safe_prompt
from app.ai.schemas import AIRequest, AIResponse, AIUsageInfo


class ExplainViolationData(BaseModel):
    """Structured response explaining a guideline violation."""
    explanation: str = Field(..., description="Concise explanation of rule violation")


def build_explain_violation_request(rule_context: str, excerpt: str) -> AIRequest:
    """Builds AIRequest to explain a brand rule violation."""
    system_instruction = (
        "You are an enterprise brand compliance auditor.\n"
        "Explain concisely (1-2 sentences) why the provided content excerpt violates the specified brand policy."
    )
    untrusted_blocks = {
        "flagged_excerpt": excerpt,
    }
    task_body = f"Applicable Brand Rule:\n{rule_context.strip()}\n\nEvaluate the flagged excerpt."
    clean_system, clean_user = build_safe_prompt(system_instruction, untrusted_blocks, task_body)

    return AIRequest(
        task="explain_violation",
        system=clean_system,
        user=clean_user,
        json_schema=ExplainViolationData,
        max_tokens=300,
        temperature=0.1,
        extra_context={"rule_context": rule_context, "excerpt": excerpt},
    )


def deterministic_explain_violation(request: AIRequest) -> AIResponse:
    """Deterministic fallback for violation explanation."""
    rule_context = request.extra_context.get("rule_context", "Brand Standard")
    excerpt = request.extra_context.get("excerpt", "The excerpt")
    text = f"The content segment '{excerpt[:40]}...' conflicts with the established policy '{rule_context}'."
    data = ExplainViolationData(explanation=text)

    return AIResponse(
        text=text,
        data=data,
        mode="offline",
        provider="offline",
        model="deterministic_engine",
        usage=AIUsageInfo(),
    )

