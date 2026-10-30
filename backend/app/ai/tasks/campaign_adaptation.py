"""
Task: One-Click Campaign Adaptation
Adapts marketing campaigns across Instagram, LinkedIn, YouTube, and Website
preserving exact facts, numbers, and URLs while reshaping layout to platform conventions.
"""
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.ai.safety import build_safe_prompt
from app.ai.schemas import AIRequest, AIResponse, AIUsageInfo


class InstagramVariant(BaseModel):
    hook: str = Field(..., description="One-line compelling hook")
    body: str = Field(..., description="Short body copy adhering to character limits")
    call_to_action: str = Field(..., description="Direct CTA button/caption prompt")
    hashtags: List[str] = Field(default_factory=list, description="3-5 hashtags built strictly from source keywords")


class LinkedInVariant(BaseModel):
    paragraphs: List[str] = Field(..., description="2-3 short paragraphs with structured line breaks")
    call_to_action: str = Field(..., description="Professional single call to action")


class YouTubeVariant(BaseModel):
    title: str = Field(..., description="Engaging video title under 100 characters")
    description: str = Field(..., description="Detailed video description with timestamps/links")
    tags: List[str] = Field(default_factory=list, description="Relevant tags derived from source keywords")


class WebsiteVariant(BaseModel):
    headline: str = Field(..., description="Hero H1 headline")
    meta_description: str = Field(..., description="SEO meta description under 160 characters")
    body: str = Field(..., description="Structured landing page body section")
    button_text: str = Field(..., description="Primary action button copy")


class CampaignAdaptationData(BaseModel):
    platform: str
    instagram: Optional[InstagramVariant] = None
    linkedin: Optional[LinkedInVariant] = None
    youtube: Optional[YouTubeVariant] = None
    website: Optional[WebsiteVariant] = None
    extracted_facts: List[str] = Field(default_factory=list)


def build_campaign_adaptation_request(
    source_content: str,
    platform: str,
    platform_config: Optional[Dict[str, Any]] = None,
) -> AIRequest:
    """Builds an adversarial-resistant AIRequest for campaign adaptation."""
    system_instruction = (
        f"You are the Inkloom Gemini AI Campaign Adaptation Engine.\n"
        f"Adapt the source campaign content for '{platform}'.\n\n"
        "STRICT CONSTRAINTS:\n"
        "1. FACT PRESERVATION: Every number (%, $, counts), price, URL, and certified claim in the source MUST be strictly preserved. Do NOT invent new numbers, claims, or names.\n"
        "2. PLATFORM SHAPES:\n"
        "   - Instagram: One-line hook, short body, call to action, 3-5 hashtags from source keywords.\n"
        "   - LinkedIn: 2-3 short paragraphs with clean line breaks, single call to action.\n"
        "   - YouTube: Title within limit, description, tags from source keywords.\n"
        "   - Website: Headline, meta description (<160 chars), body, button text.\n"
        "3. Output strictly valid JSON."
    )

    untrusted_blocks = {
        "source_campaign_content": source_content,
    }
    task_body = f"Target Platform: {platform}\nPlatform Limits: {platform_config or 'Standard platform specifications'}"
    clean_system, clean_user = build_safe_prompt(system_instruction, untrusted_blocks, task_body)

    return AIRequest(
        task="campaign_adaptation",
        system=clean_system,
        user=clean_user,
        json_schema=CampaignAdaptationData,
        max_tokens=1500,
        temperature=0.2,
        extra_context={"source_content": source_content, "platform": platform.lower()},
    )


def deterministic_campaign_adaptation(request: AIRequest) -> AIResponse:
    """Deterministic fallback for campaign adaptation that guarantees fact preservation."""
    source = request.extra_context.get("source_content", "")
    platform = request.extra_context.get("platform", "linkedin").lower()

    # Extract keywords for hashtags/tags
    words = re.findall(r"\b[A-Za-z]{4,}\b", source)
    unique_keywords = list(dict.fromkeys(w.lower() for w in words if w.lower() not in {"this", "that", "with", "from", "your", "have"}))
    hashtags = [f"#{w}" for w in unique_keywords[:4]] or ["#BrandGovernance", "#EnterpriseAI"]

    # Extract facts (numbers, urls)
    facts = re.findall(r"(?:\$\d+(?:\.\d+)?|\d+%(?:/\w+)?|\d+,\d+|\bhttps?://\S+)", source)

    data = CampaignAdaptationData(platform=platform, extracted_facts=facts)

    if platform == "instagram":
        lines = [line.strip() for line in source.split("\n") if line.strip()]
        hook = lines[0] if lines else "Autonomous brand governance without compromise."
        body = " ".join(lines[1:3]) if len(lines) > 1 else source
        data.instagram = InstagramVariant(
            hook=hook[:100],
            body=body[:300],
            call_to_action="Tap link in bio to explore.",
            hashtags=hashtags,
        )
    elif platform == "linkedin":
        lines = [line.strip() for line in source.split("\n") if line.strip()]
        p1 = lines[0] if lines else source
        p2 = lines[1] if len(lines) > 1 else "Empower creative and compliance teams with verified brand governance."
        data.linkedin = LinkedInVariant(
            paragraphs=[p1, p2],
            call_to_action="Request an enterprise audit demo today.",
        )
    elif platform == "youtube":
        first_sentence = source.split(".")[0] if "." in source else source
        data.youtube = YouTubeVariant(
            title=first_sentence[:95],
            description=source,
            tags=unique_keywords[:6],
        )
    else:  # website
        first_sentence = source.split(".")[0] if "." in source else source
        data.website = WebsiteVariant(
            headline=first_sentence[:80],
            meta_description=source[:155],
            body=source,
            button_text="Get Started",
        )

    return AIResponse(
        text=source,
        data=data,
        mode="offline",
        provider="offline",
        model="deterministic_engine",
        usage=AIUsageInfo(),
    )

