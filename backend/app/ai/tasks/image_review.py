"""
Task: Visual Design & Brand Guideline Image Review
Evaluates uploaded creative assets against brand tokens, calculating WCAG contrast,
extracting dominant colors, and providing concrete color and typography improvements.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.ai.safety import build_safe_prompt
from app.ai.schemas import AIImageItem, AIRequest, AIResponse, AIUsageInfo


class ImageReviewData(BaseModel):
    """Structured response for visual design inspection."""
    visual_hierarchy_critique: str = Field(..., description="Evaluation of design balance, focal point, and layout")
    color_recommendations: List[str] = Field(default_factory=list, description="Specific approved brand color adjustments")
    typography_recommendations: List[str] = Field(default_factory=list, description="Font pairing, sizing, and hierarchy improvements")
    actionable_recommendations: List[str] = Field(default_factory=list, description="Prioritized design polish steps")


def build_image_review_request(
    file_name: str,
    metrics: Dict[str, Any],
    brand_guidelines: Dict[str, Any],
    user_query: Optional[str] = None,
    image_base64: Optional[str] = None,
    mime_type: str = "image/png",
) -> AIRequest:
    """Builds AIRequest for multimodal or metric-based design review."""
    system_instruction = (
        "You are an expert Brand Governance Art Director and Visual Design Auditor for Inkloom AI.\n"
        "Analyze the uploaded design asset metrics and text against the organization's official brand guidelines.\n"
        "Provide professional, concrete recommendations for:\n"
        "- visual_hierarchy_critique (string): Clear evaluation of design balance, contrast, and focal point.\n"
        "- color_recommendations (list of strings): 2-4 specific color adjustments using approved brand hex codes.\n"
        "- typography_recommendations (list of strings): 2-4 font pairing, sizing hierarchy, and readability fixes.\n"
        "- actionable_recommendations (list of strings): 3-5 overall prioritized design improvements.\n"
        "Respond strictly with valid JSON."
    )

    untrusted_blocks = {
        "asset_metrics": (
            f"Asset Name: {file_name}\n"
            f"Dimensions: {metrics.get('width', 0)}x{metrics.get('height', 0)}px (Aspect Ratio: {metrics.get('aspect_ratio', 'N/A')})\n"
            f"Dominant Colors: {', '.join(metrics.get('dominant_colors_hex', []))}\n"
            f"Contrast Ratio: {metrics.get('contrast_ratio', 0.0):.1f}:1 ({'WCAG AA Compliant' if metrics.get('wcag_aa_compliant') else 'Fails WCAG 2.1 AA 4.5:1'})\n"
            f"OCR Text: {metrics.get('ocr_text', 'None detected')[:200]}"
        ),
        "official_brand_guidelines": (
            f"Brand Name: {brand_guidelines.get('brand_name', 'Enterprise Brand')}\n"
            f"Approved Colors: {', '.join(brand_guidelines.get('brand_colors', ['#0F172A', '#6366F1', '#00E5FF', '#FFFFFF']))}\n"
            f"Typography: Display: {brand_guidelines.get('display_font', 'Outfit')}, Primary: {brand_guidelines.get('primary_font', 'Inter')}\n"
            f"Rules: {'; '.join(brand_guidelines.get('rules', ['32px logo safe zone', '4.5:1 contrast minimum']))}"
        ),
    }

    task_body = f"Designer Focus / Inquiry:\n{user_query or 'Brand Guidelines Verification & Design Improvement'}"
    clean_system, clean_user = build_safe_prompt(system_instruction, untrusted_blocks, task_body)

    images: List[AIImageItem] = []
    if image_base64:
        images.append(AIImageItem(data_base64=image_base64, mime_type=mime_type))

    return AIRequest(
        task="image_review",
        system=clean_system,
        user=clean_user,
        images=images,
        json_schema=ImageReviewData,
        max_tokens=1500,
        temperature=0.2,
        extra_context={"metrics": metrics, "brand_guidelines": brand_guidelines},
    )


def deterministic_image_review(request: AIRequest) -> AIResponse:
    """Deterministic fallback for image review grounded in metrics."""
    metrics = request.extra_context.get("metrics") or {}
    brand = request.extra_context.get("brand_guidelines") or {}

    contrast = metrics.get("contrast_ratio", 4.5)
    compliant = metrics.get("wcag_aa_compliant", True)
    display_font = brand.get("display_font", "Outfit")
    primary_font = brand.get("primary_font", "Inter")

    if compliant:
        critique = (
            f"Visual hierarchy is supported by adequate foreground-to-background separation (contrast ratio: {contrast:.1f}:1, "
            f"passing WCAG 2.1 AA). Layout elements maintain structured focal balance."
        )
    else:
        critique = (
            f"Accessibility alert: The dominant color relationship produces a contrast ratio of {contrast:.1f}:1, "
            f"which falls below the WCAG 2.1 AA 4.5:1 threshold. Typography against this background risks legibility issues."
        )

    color_recs = [
        "Deepen background to #0F172A (Acme Midnight Slate) to guarantee >= 4.5:1 contrast for light typography.",
        "Use #6366F1 (Electric Indigo) for primary interactive buttons and key brand anchors.",
    ]
    typo_recs = [
        f"Set main display headlines in '{display_font}' at 32-40px with semibold weight for visual impact.",
        f"Format supporting paragraphs and body copy in '{primary_font}' at 14-16px for optimal legibility.",
    ]
    actionable = [
        "Align canvas accent tones with the approved brand palette.",
        "Ensure at least 24px safe padding around logos and edge boundaries.",
        "Verify contrast across all sub-headings meets WCAG 2.1 AA requirements.",
    ]

    data = ImageReviewData(
        visual_hierarchy_critique=critique,
        color_recommendations=color_recs,
        typography_recommendations=typo_recs,
        actionable_recommendations=actionable,
    )

    return AIResponse(
        text=critique,
        data=data,
        mode="offline",
        provider="offline",
        model="deterministic_engine",
        usage=AIUsageInfo(),
    )

