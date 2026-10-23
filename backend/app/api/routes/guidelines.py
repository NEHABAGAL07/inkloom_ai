from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.models import BrandGuideline, GuidelineRule
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineResponse,
    GuidelineRuleCreate,
)

router = APIRouter(prefix="/guidelines", tags=["Brand Guidelines"])


@router.get("", response_model=List[BrandGuidelineResponse])
def list_guidelines(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieve brand guidelines scoped to the current tenant."""
    guidelines = (
        db.query(BrandGuideline)
        .filter(BrandGuideline.organization_id == auth.organization_id)
        .all()
    )
    return guidelines


@router.post("", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
def create_guideline(
    payload: BrandGuidelineCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Create a new brand guideline (compliance officers and admins only)."""
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Compliance Officers can manage brand guidelines.",
        )

    guideline = BrandGuideline(
        organization_id=auth.organization_id,
        name=payload.name,
        description=payload.description,
        version=payload.version,
        is_active=payload.is_active,
    )
    db.add(guideline)
    db.flush()

    if payload.rules:
        for r in payload.rules:
            rule_record = GuidelineRule(
                guideline_id=guideline.id,
                category=r.category,
                rule_name=r.rule_name,
                section=r.section,
                severity_default=r.severity_default,
                rule_definition=r.rule_definition,
                requires_human_review=r.requires_human_review,
                source_url=r.source_url,
            )
            db.add(rule_record)

    db.commit()
    db.refresh(guideline)
    return guideline


@router.get("/{guideline_id}", response_model=BrandGuidelineResponse)
def get_guideline(
    guideline_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    guideline = (
        db.query(BrandGuideline)
        .filter(
            BrandGuideline.id == guideline_id,
            BrandGuideline.organization_id == auth.organization_id,
        )
        .first()
    )
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found.")
    return guideline
