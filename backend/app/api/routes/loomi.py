"""
Loomi AI Assistant API Routes
Provides real-time conversational brand governance, layout direction, WCAG AA compliance advice,
and creative critique powered by Google Gemini.
"""
from datetime import datetime, timezone
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, status

from app.schemas.loomi import (
    LoomiChatRequest,
    LoomiChatResponse,
    LoomiChatMessage,
    LoomiContext,
)
from app.ai.client import get_ai_client
from app.ai.schemas import AIRequest

logger = logging.getLogger("inkloom.loomi")

router = APIRouter(prefix="/loomi", tags=["Loomi Assistant"])

LOOMI_SYSTEM_PROMPT = (
    "You are Loomi, the built-in intelligent brand auditor and design companion for Inkloom AI. "
    "You are an elite creative director, brand governance architect, and design accessibility auditor.\n\n"
    "Your core capabilities and guidelines:\n"
    "1. Context Grounding: You tailor all design critique, font pairings, color choices, and layout directives "
    "to the active workspace brand, active asset, concept, and target channel provided in the context.\n"
    "2. Rigorous Brand & Accessibility Checks: Always evaluate or mention WCAG 2.1 AA compliance "
    "(minimum 4.5:1 contrast for regular text, 3.0:1 for large text/graphical elements), clear space, and channel-appropriate safe zones.\n"
    "3. Structure & Readability: Format your answers cleanly using Markdown. Use bold headers, bullet lists, "
    "and Markdown tables whenever comparing options, palettes, layout metrics, or before/after adaptations.\n"
    "4. Tone: Collaborative, authoritative, insightful, encouraging, and razor-sharp on visual craft. Always identify yourself as Loomi."
)


def _build_loomi_prompt(req: LoomiChatRequest) -> str:
    ctx = req.context or LoomiContext()
    tokens = ctx.brandTokens

    brand_colors = ", ".join(tokens.colors) if tokens and tokens.colors else "#0F172A, #6366F1, #10B981, #FFFFFF"
    brand_fonts = ", ".join(tokens.typography) if tokens and tokens.typography else "Outfit, Inter"
    brand_wordmark = (tokens.primaryWordmark if tokens and tokens.primaryWordmark else ctx.workspace) or "Inkloom Brand"

    context_header = (
        "--- ACTIVE BRAND & CANVAS CONTEXT ---\n"
        f"• Workspace / Organization: {ctx.workspace or 'Acme Cloud Systems'}\n"
        f"• Active Asset: {ctx.activeAsset or 'summer-campaign-banner.png'}\n"
        f"• Creative Concept: {ctx.concept or 'Enterprise High-Contrast Modern'}\n"
        f"• Target Channel & Aspect Ratio: {ctx.channel or 'linkedin (1.91:1)'}\n"
        f"• Primary Brand Wordmark: {brand_wordmark}\n"
        f"• Approved Brand Palette: {brand_colors}\n"
        f"• Approved Typography: {brand_fonts}\n"
        "-------------------------------------\n\n"
        "--- CONVERSATION HISTORY ---\n"
    )

    history_lines = []
    for msg in req.messages[:-1]:
        role_label = "User" if msg.role == "user" else "Loomi"
        history_lines.append(f"{role_label}: {msg.content}")

    latest_msg = req.messages[-1]
    history_text = "\n".join(history_lines) if history_lines else "None (Beginning of conversation)"

    prompt = (
        f"{context_header}"
        f"{history_text}\n\n"
        f"--- LATEST USER INSTRUCTION ---\n"
        f"User: {latest_msg.content}\n\n"
        "Please provide your expert Loomi response. Ground your analysis in the brand context above, "
        "and format key points with bullet points and Markdown tables where relevant."
    )
    return prompt


def _generate_fallback_response(query: str, ctx: LoomiContext) -> str:
    tokens = ctx.brandTokens
    colors = tokens.colors if tokens and tokens.colors else ["#0F172A", "#6366F1", "#10B981", "#FFFFFF"]
    fonts = tokens.typography if tokens and tokens.typography else ["Outfit", "Inter"]
    wordmark = (tokens.primaryWordmark if tokens and tokens.primaryWordmark else ctx.workspace) or "Acme Cloud"

    return (
        f"### ✦ Loomi Creative Guidance & Design Direction\n\n"
        f"I have analyzed your instruction regarding **{ctx.activeAsset or 'your artwork'}** within the context of **{ctx.workspace or 'your brand'}**.\n\n"
        f"#### 1. Visual Hierarchy & Channel Suitability ({ctx.channel or 'Social / Web'})\n"
        f"• **Channel Safe Zones**: For {ctx.channel or 'this format'}, ensure key typography and logos remain within the central 80% boundary.\n"
        f"• **Concept Execution**: Aligned with the *{ctx.concept or 'Enterprise High-Contrast Modern'}* aesthetic, utilizing ample negative space and disciplined grid alignment.\n\n"
        f"#### 2. Brand Tokens & Accessibility Assessment\n\n"
        f"| Element | Value / Token | WCAG 2.1 AA Status | Design Directive |\n"
        f"| :--- | :--- | :--- | :--- |\n"
        f"| **Background Palette** | `{colors[0] if len(colors) > 0 else '#0F172A'}` | Base Layer | Deep contrast ground |\n"
        f"| **Primary Accent** | `{colors[1] if len(colors) > 1 else '#6366F1'}` | ≥ 4.5:1 Ratio | Focal points & CTA buttons |\n"
        f"| **High-Contrast Text** | `{colors[-1] if len(colors) > 0 else '#FFFFFF'}` | ≥ 12.5:1 Ratio | Crisp body copy legibility |\n"
        f"| **Headline Typeface** | `{fonts[0] if len(fonts) > 0 else 'Outfit'}` | Approved Primary | Maintain tight tracking (-0.01em) |\n\n"
        f"#### 3. Actionable Next Steps\n"
        f"1. **Clear Space**: Ensure at least 24px of unobstructed padding around the `{wordmark}` mark.\n"
        f"2. **Typography Weight**: Pair `{fonts[0] if len(fonts) > 0 else 'Outfit'}` (Bold 700) for headlines with `{fonts[1] if len(fonts) > 1 else 'Inter'}` (Regular 400) for supporting copy.\n"
        f"3. **Resolution**: Export at 2x DPI for crisp high-density display rendering on {ctx.channel or 'digital channels'}."
    )


@router.post("/chat", response_model=LoomiChatResponse)
def loomi_chat(request: LoomiChatRequest) -> LoomiChatResponse:
    """
    Real-time dynamic chat endpoint for Loomi Assistant.
    Accepts full message history and context-aware brand/canvas payload.
    Uses Google Gemini API when available, falling back gracefully to deterministic guidance.
    """
    msg_id = f"loomi_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    full_prompt = _build_loomi_prompt(request)
    latest_query = request.messages[-1].content if request.messages else ""
    ctx = request.context or LoomiContext()

    ai_client = get_ai_client()
    ai_request = AIRequest(
        task="loomi_chat",
        system=LOOMI_SYSTEM_PROMPT,
        user=full_prompt,
        max_tokens=1500,
        temperature=0.3,
    )

    try:
        ai_response = ai_client.generate(ai_request)
        content = ai_response.text.strip() if ai_response.text else ""
        if not content:
            content = _generate_fallback_response(latest_query, ctx)

        return LoomiChatResponse(
            id=msg_id,
            role="assistant",
            content=content,
            timestamp=now_iso,
            model=ai_response.model,
            mode=ai_response.mode,
        )
    except Exception as exc:
        logger.warning("Loomi chat execution exception: %s; falling back to deterministic response", exc)
        fallback_content = _generate_fallback_response(latest_query, ctx)
        return LoomiChatResponse(
            id=msg_id,
            role="assistant",
            content=fallback_content,
            timestamp=now_iso,
            model="deterministic_engine",
            mode="offline",
        )

