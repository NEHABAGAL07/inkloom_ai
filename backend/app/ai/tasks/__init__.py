"""
Standard AI tasks for Inkloom AI.
Each task encapsulates its prompt builder, pydantic output schema, and deterministic fallback.
"""
from app.ai.tasks.grounded_answer import (
    GroundedAnswerData,
    build_grounded_answer_request,
    deterministic_grounded_answer,
)
from app.ai.tasks.explain_violation import (
    ExplainViolationData,
    build_explain_violation_request,
    deterministic_explain_violation,
)
from app.ai.tasks.rewrite import (
    RewriteData,
    build_rewrite_request,
    deterministic_rewrite,
)
from app.ai.tasks.campaign_adaptation import (
    CampaignAdaptationData,
    InstagramVariant,
    LinkedInVariant,
    YouTubeVariant,
    WebsiteVariant,
    build_campaign_adaptation_request,
    deterministic_campaign_adaptation,
)
from app.ai.tasks.image_review import (
    ImageReviewData,
    build_image_review_request,
    deterministic_image_review,
)

__all__ = [
    "GroundedAnswerData",
    "build_grounded_answer_request",
    "deterministic_grounded_answer",
    "ExplainViolationData",
    "build_explain_violation_request",
    "deterministic_explain_violation",
    "RewriteData",
    "build_rewrite_request",
    "deterministic_rewrite",
    "CampaignAdaptationData",
    "InstagramVariant",
    "LinkedInVariant",
    "YouTubeVariant",
    "WebsiteVariant",
    "build_campaign_adaptation_request",
    "deterministic_campaign_adaptation",
    "ImageReviewData",
    "build_image_review_request",
    "deterministic_image_review",
]

