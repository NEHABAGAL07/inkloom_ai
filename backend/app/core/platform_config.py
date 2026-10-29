"""
Platform Configuration for One-Click Campaign Adaptation.
Centralized, easily editable specifications for each target platform:
limits, tone, structural guidelines, and expected JSON format.
"""
from typing import Dict, Any, List

PLATFORM_CONFIGS: Dict[str, Dict[str, Any]] = {
    "instagram": {
        "name": "Instagram",
        "key": "instagram",
        "max_characters": 2200,
        "recommended_length": 300,
        "tone": "Engaging, visual-first, inspiring, community-driven",
        "format_notes": (
            "Hook in the first 125 characters before the fold. Use short paragraphs with line breaks. "
            "Include a clear call-to-action. End with 3-8 relevant hashtags."
        ),
        "fields": ["caption", "hashtags"],
        "schema_example": {
            "caption": "Compelling caption with hook and clear call to action.",
            "hashtags": ["#Brand", "#Innovation", "#Quality"]
        }
    },
    "linkedin": {
        "name": "LinkedIn",
        "key": "linkedin",
        "max_characters": 3000,
        "recommended_length": 800,
        "tone": "Professional, authoritative, insight-driven, peer-to-peer",
        "format_notes": (
            "Strong opening statement or question. 1-2 sentence paragraphs with whitespace. "
            "Deliver 2-3 key takeaways or actionable insights. End with an open question to spur discussion."
        ),
        "fields": ["post"],
        "schema_example": {
            "post": "Thought leadership narrative with structured takeaways and discussion prompt."
        }
    },
    "youtube": {
        "name": "YouTube",
        "key": "youtube",
        "limits": {
            "title_max": 100,
            "description_max": 5000,
            "tags_max": 500
        },
        "tone": "Search-optimized, informative, welcoming, retention-focused",
        "format_notes": (
            "Title under 70 chars for mobile display with keywords upfront. Description includes brief overview, "
            "key links, and relevant tags. Comma-separated search tags."
        ),
        "fields": ["title", "description", "tags"],
        "schema_example": {
            "title": "High-Impact Video Title Under 70 Characters",
            "description": "Comprehensive video description summarizing the topic, links, and value.",
            "tags": ["governance", "ai", "brand", "enterprise"]
        }
    },
    "website": {
        "name": "Website",
        "key": "website",
        "limits": {
            "headline_max": 100,
            "meta_description_max": 160,
            "body_max": 2000
        },
        "tone": "Clear, concise, customer-centric, benefits-first, SEO-aligned",
        "format_notes": (
            "H1 headline clearly communicating value. Compelling meta description (120-160 chars) with keywords. "
            "Scannable body content with short paragraphs and bullet points."
        ),
        "fields": ["headline", "meta_description", "body"],
        "schema_example": {
            "headline": "Clear, Benefit-Driven Headline Communicating Value",
            "meta_description": "Precise summary for search engines under 160 characters highlighting key value.",
            "body": "Scannable, engaging web copy detailing features, benefits, and next steps."
        }
    }
}

ALLOWED_PLATFORMS: List[str] = list(PLATFORM_CONFIGS.keys())
MAX_SOURCE_LENGTH: int = 20000
MAX_PLATFORMS_PER_REQUEST: int = 4

