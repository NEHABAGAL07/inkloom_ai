"""Brand Guidelines and Rules API Routes with Database Persistence."""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, get_current_user, require_roles, RoleEnum
from app.database.session import get_db
from app.models.guideline import BrandGuideline, GuidelineRule
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineResponse,
    GuidelineRuleCreate,
    GuidelineRuleResponse,
)
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum

router = APIRouter(prefix="/guidelines", tags=["Guidelines"])


async def _seed_default_guidelines_if_empty(db: AsyncSession, organization_id: str) -> None:
    """Ensure baseline brand guidelines exist for the tenant."""
    result = await db.execute(select(BrandGuideline).limit(1))
    if result.scalars().first() is not None:
        return

    # Seed baseline guidelines
    voice_gd = BrandGuideline(
        id="gd-brand-voice",
        organization_id=organization_id,
        name="Brand Voice & Editorial Standards",
        category=FindingCategoryEnum.TONE_AND_VOICE.value,
        version="2.4",
        description="Authoritative, accessible corporate voice standards avoiding hyperbole.",
        is_active=True,
    )
    db.add(voice_gd)

    rule1 = GuidelineRule(
        id="rule-tone-001",
        guideline_id="gd-brand-voice",
        rule_key="avoid_hyperbole",
        title="Avoid Hyperbolic and Colloquial Language",
        description="Enterprise communications must maintain an authoritative, professional tone.",
        severity="low",
        rule_config={"colloquialisms": ["super pumped", "game changer"]},
        is_active=True,
    )
    rule2 = GuidelineRule(
        id="rule-term-001",
        guideline_id="gd-brand-voice",
        rule_key="brand_name_casing",
        title="Brand Name Capitalization & Casing",
        description="Spell 'Inkloom AI' or 'Inkloom', never 'inkloom' or 'InkLoom'.",
        severity="medium",
        rule_config={"forbidden_variants": ["inkloom", "InkLoom"], "preferred_term": "Inkloom AI"},
        is_active=True,
    )
    db.add_all([rule1, rule2])

    legal_gd = BrandGuideline(
        id="gd-legal-claims",
        organization_id=organization_id,
        name="Legal Substantiation & Claim Standards",
        category=FindingCategoryEnum.CLAIM_VERIFICATION.value,
        version="3.0",
        description="Mandatory empirical proof rules for promotional statements and superlative claims.",
        is_active=True,
    )
    db.add(legal_gd)

    rule3 = GuidelineRule(
        id="rule-claim-001",
        guideline_id="gd-legal-claims",
        rule_key="superlative_claims",
        title="Absolute Superlative & Guarantee Claims",
        description="Claims promising 100% guarantees or zero errors must be substantiated.",
        severity="high",
        rule_config={"superlative_patterns": [r"\b100%\s+error-free\b"]},
        is_active=True,
    )
    db.add(rule3)
    await db.commit()


@router.get("", response_model=List[BrandGuidelineResponse])
async def list_guidelines(
    category: Optional[FindingCategoryEnum] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List active brand guidelines for the tenant."""
    await _seed_default_guidelines_if_empty(db, current_user.organization_id)

    query = (
        select(BrandGuideline)
        .options(selectinload(BrandGuideline.rules))
        .where(BrandGuideline.is_active.is_(True))
    )

    if category:
        query = query.where(BrandGuideline.category == category.value)

    result = await db.execute(query)
    guidelines = result.scalars().all()

    response_items = []
    for g in guidelines:
        rules_data = [
            GuidelineRuleResponse(
                id=r.id,
                guideline_id=r.guideline_id,
                rule_key=r.rule_key,
                title=r.title,
                description=r.description,
                severity=FindingSeverityEnum(r.severity.lower()),
                rule_config=r.rule_config or {},
                is_active=r.is_active,
                created_at=r.created_at,
            )
            for r in (g.rules or [])
        ]
        response_items.append(
            BrandGuidelineResponse(
                id=g.id,
                organization_id=g.organization_id,
                name=g.name,
                category=FindingCategoryEnum(g.category),
                version=g.version,
                description=g.description,
                is_active=g.is_active,
                created_at=g.created_at,
                rules=rules_data,
            )
        )

    return response_items


@router.post("", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
async def create_guideline(
    payload: BrandGuidelineCreate,
    current_user: CurrentUser = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.REVIEWER)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new brand guideline with optional initial rules."""
    org_id = payload.organization_id or current_user.organization_id
    new_guideline = BrandGuideline(
        organization_id=org_id,
        name=payload.name,
        category=payload.category.value,
        version=payload.version,
        description=payload.description,
        is_active=True,
    )
    db.add(new_guideline)
    await db.flush()

    rules_responses = []
    for rule_in in payload.rules:
        new_rule = GuidelineRule(
            guideline_id=new_guideline.id,
            rule_key=rule_in.rule_key,
            title=rule_in.title,
            description=rule_in.description,
            severity=rule_in.severity.value,
            rule_config=rule_in.rule_config,
            is_active=rule_in.is_active,
        )
        db.add(new_rule)
        await db.flush()
        rules_responses.append(
            GuidelineRuleResponse(
                id=new_rule.id,
                guideline_id=new_rule.guideline_id,
                rule_key=new_rule.rule_key,
                title=new_rule.title,
                description=new_rule.description,
                severity=FindingSeverityEnum(new_rule.severity),
                rule_config=new_rule.rule_config or {},
                is_active=new_rule.is_active,
                created_at=new_rule.created_at or datetime.now(timezone.utc),
            )
        )

    await db.commit()
    await db.refresh(new_guideline)

    return BrandGuidelineResponse(
        id=new_guideline.id,
        organization_id=new_guideline.organization_id,
        name=new_guideline.name,
        category=FindingCategoryEnum(new_guideline.category),
        version=new_guideline.version,
        description=new_guideline.description,
        is_active=new_guideline.is_active,
        created_at=new_guideline.created_at,
        rules=rules_responses,
    )


@router.get("/{guideline_id}", response_model=BrandGuidelineResponse)
async def get_guideline(
    guideline_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve specific guideline and all associated active rules."""
    query = (
        select(BrandGuideline)
        .options(selectinload(BrandGuideline.rules))
        .where(BrandGuideline.id == guideline_id)
    )
    result = await db.execute(query)
    guideline = result.scalars().first()

    if not guideline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand guideline '{guideline_id}' not found.",
        )

    rules_data = [
        GuidelineRuleResponse(
            id=r.id,
            guideline_id=r.guideline_id,
            rule_key=r.rule_key,
            title=r.title,
            description=r.description,
            severity=FindingSeverityEnum(r.severity.lower()),
            rule_config=r.rule_config or {},
            is_active=r.is_active,
            created_at=r.created_at,
        )
        for r in (guideline.rules or [])
    ]

    return BrandGuidelineResponse(
        id=guideline.id,
        organization_id=guideline.organization_id,
        name=guideline.name,
        category=FindingCategoryEnum(guideline.category),
        version=guideline.version,
        description=guideline.description,
        is_active=guideline.is_active,
        created_at=guideline.created_at,
        rules=rules_data,
    )


@router.post("/{guideline_id}/rules", response_model=GuidelineRuleResponse, status_code=status.HTTP_201_CREATED)
async def add_guideline_rule(
    guideline_id: str,
    payload: GuidelineRuleCreate,
    current_user: CurrentUser = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.REVIEWER)),
    db: AsyncSession = Depends(get_db),
):
    """Add a new rule to an existing brand guideline."""
    query = select(BrandGuideline).where(BrandGuideline.id == guideline_id)
    result = await db.execute(query)
    guideline = result.scalars().first()

    if not guideline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot add rule: Brand guideline '{guideline_id}' not found.",
        )

    new_rule = GuidelineRule(
        guideline_id=guideline_id,
        rule_key=payload.rule_key,
        title=payload.title,
        description=payload.description,
        severity=payload.severity.value,
        rule_config=payload.rule_config,
        is_active=payload.is_active,
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)

    return GuidelineRuleResponse(
        id=new_rule.id,
        guideline_id=new_rule.guideline_id,
        rule_key=new_rule.rule_key,
        title=new_rule.title,
        description=new_rule.description,
        severity=FindingSeverityEnum(new_rule.severity),
        rule_config=new_rule.rule_config or {},
        is_active=new_rule.is_active,
        created_at=new_rule.created_at,
    )
