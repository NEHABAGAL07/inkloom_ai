"""Brand Guidelines API Routes."""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.security import CurrentUser, get_current_user, require_roles, RoleEnum
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineResponse,
    GuidelineRuleResponse,
)
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum

router = APIRouter(prefix="/guidelines", tags=["Guidelines"])


@router.get("", response_model=List[BrandGuidelineResponse])
async def list_guidelines(
    category: Optional[FindingCategoryEnum] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """List active brand guidelines for the tenant."""
    # Deterministic baseline response scoped to tenant
    now = datetime.now(timezone.utc)
    guidelines = [
        BrandGuidelineResponse(
            id="gd-brand-voice",
            organization_id=current_user.organization_id,
            name="Brand Voice & Editorial Standards",
            category=FindingCategoryEnum.TONE_AND_VOICE,
            version="2.4",
            description="Authoritative, accessible corporate voice standards avoiding hyperbole.",
            is_active=True,
            created_at=now,
            rules=[
                GuidelineRuleResponse(
                    id="rule-tone-001",
                    guideline_id="gd-brand-voice",
                    rule_key="avoid_hyperbole",
                    title="Avoid Hyperbolic and Colloquial Language",
                    description="Enterprise communications must maintain an authoritative, professional tone.",
                    severity=FindingSeverityEnum.LOW,
                    rule_config={"colloquialisms": ["super pumped", "game changer"]},
                    is_active=True,
                    created_at=now,
                ),
                GuidelineRuleResponse(
                    id="rule-term-001",
                    guideline_id="gd-brand-voice",
                    rule_key="brand_name_casing",
                    title="Brand Name Capitalization & Casing",
                    description="Spell 'Inkloom AI' or 'Inkloom', never 'inkloom' or 'InkLoom'.",
                    severity=FindingSeverityEnum.MEDIUM,
                    rule_config={"forbidden_variants": ["inkloom", "InkLoom"], "preferred_term": "Inkloom AI"},
                    is_active=True,
                    created_at=now,
                ),
            ],
        ),
        BrandGuidelineResponse(
            id="gd-legal-claims",
            organization_id=current_user.organization_id,
            name="Legal Substantiation & Claim Standards",
            category=FindingCategoryEnum.CLAIM_VERIFICATION,
            version="3.0",
            description="Mandatory empirical proof rules for promotional statements and superlative claims.",
            is_active=True,
            created_at=now,
            rules=[
                GuidelineRuleResponse(
                    id="rule-claim-001",
                    guideline_id="gd-legal-claims",
                    rule_key="superlative_claims",
                    title="Absolute Superlative & Guarantee Claims",
                    description="Claims promising 100% guarantees or zero errors must be substantiated.",
                    severity=FindingSeverityEnum.HIGH,
                    rule_config={"superlative_patterns": [r"\b100%\s+error-free\b"]},
                    is_active=True,
                    created_at=now,
                )
            ],
        ),
    ]

    if category:
        guidelines = [g for g in guidelines if g.category == category]

    return guidelines


@router.post("", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
async def create_guideline(
    payload: BrandGuidelineCreate,
    current_user: CurrentUser = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.REVIEWER)),
):
    """Create a new brand guideline (Admin/Reviewer role required)."""
    now = datetime.now(timezone.utc)
    return BrandGuidelineResponse(
        id=f"gd-custom-{int(now.timestamp())}",
        organization_id=current_user.organization_id,
        name=payload.name,
        category=payload.category,
        version=payload.version,
        description=payload.description,
        is_active=True,
        created_at=now,
        rules=[],
    )
