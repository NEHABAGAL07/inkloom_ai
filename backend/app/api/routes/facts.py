"""Verified Facts & Knowledge Sources API Routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, get_current_user, require_roles, RoleEnum
from app.database.session import get_db
from app.models.fact import VerifiedFact
from app.schemas.fact import VerifiedFactCreate, VerifiedFactResponse

router = APIRouter(prefix="/facts", tags=["Knowledge Sources"])


@router.get("", response_model=List[VerifiedFactResponse])
async def list_facts(
    category: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List approved verified facts and knowledge sources."""
    query = (
        select(VerifiedFact)
        .where(VerifiedFact.is_active.is_(True))
    )
    if category:
        query = query.where(VerifiedFact.category == category)

    result = await db.execute(query)
    facts = result.scalars().all()

    return [
        VerifiedFactResponse(
            id=f.id,
            organization_id=f.organization_id,
            statement=f.statement,
            category=f.category,
            source_document=f.source_document,
            is_active=f.is_active,
            created_at=f.created_at,
        )
        for f in facts
    ]


@router.post("", response_model=VerifiedFactResponse, status_code=status.HTTP_201_CREATED)
async def create_fact(
    payload: VerifiedFactCreate,
    current_user: CurrentUser = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.REVIEWER)),
    db: AsyncSession = Depends(get_db),
):
    """Register a new certified claim or empirical fact into the knowledge registry."""
    org_id = payload.organization_id or current_user.organization_id
    fact = VerifiedFact(
        organization_id=org_id,
        statement=payload.statement,
        category=payload.category,
        source_document=payload.source_document,
        is_active=True,
    )
    db.add(fact)
    await db.commit()
    await db.refresh(fact)

    return VerifiedFactResponse(
        id=fact.id,
        organization_id=fact.organization_id,
        statement=fact.statement,
        category=fact.category,
        source_document=fact.source_document,
        is_active=fact.is_active,
        created_at=fact.created_at,
    )


@router.get("/{fact_id}", response_model=VerifiedFactResponse)
async def get_fact(
    fact_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details for a specific verified fact."""
    query = select(VerifiedFact).where(VerifiedFact.id == fact_id)
    result = await db.execute(query)
    fact = result.scalars().first()

    if not fact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verified fact '{fact_id}' not found.",
        )

    return VerifiedFactResponse(
        id=fact.id,
        organization_id=fact.organization_id,
        statement=fact.statement,
        category=fact.category,
        source_document=fact.source_document,
        is_active=fact.is_active,
        created_at=fact.created_at,
    )
