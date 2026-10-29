"""
Campaign Adaptation API Routes.
Provides endpoints for one-click cross-platform content adaptation,
editing, regeneration, and human review submission.
"""
import time
from collections import defaultdict
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.core.config import settings
from app.schemas.campaign_adaptation import (
    AdaptCampaignRequest,
    EditAdaptationRequest,
    CampaignAdaptationResponse,
    SubmitForReviewResponse,
)
from app.services.campaign_adaptation.service import CampaignAdaptationService

router = APIRouter(tags=["Campaign Adaptation"])

# Allowed roles for campaign adaptation
ADAPTATION_ALLOWED_ROLES = {
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.CREATOR,
    UserRole.DESIGNER,  # Designer is also a creator in this system
}

# Per-user in-memory rate limiter (Rate limit window: 60s, max 10 requests/min default)
_USER_RATE_LIMITS: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60.0


def _check_adaptation_rate_limit(user_id: str):
    max_requests = getattr(settings, "ADAPTATION_RATE_LIMIT_PER_MINUTE", 10)
    now = time.time()
    timestamps = _USER_RATE_LIMITS[user_id]
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    _USER_RATE_LIMITS[user_id] = valid_timestamps
    if len(valid_timestamps) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded ({max_requests} requests/min). Please try again shortly.",
        )
    _USER_RATE_LIMITS[user_id].append(now)


def _check_adaptation_role(auth: AuthContext):
    """Enforces that viewer roles cannot create or manage adaptations."""
    user_roles = set(auth.roles)
    if not (user_roles & ADAPTATION_ALLOWED_ROLES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Your role does not have permission to adapt campaigns or submit reviews.",
        )


@router.post(
    "/adaptations",
    response_model=List[CampaignAdaptationResponse],
    summary="Adapt approved content across target platforms",
)
def adapt_campaign(
    payload: AdaptCampaignRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    _check_adaptation_role(auth)
    _check_adaptation_rate_limit(auth.user_id)

    return CampaignAdaptationService.adapt_campaign(
        content_id=payload.content_id,
        platforms=payload.platforms,
        db=db,
        user_id=auth.user_id,
        organization_id=auth.organization_id,
    )


@router.get(
    "/adaptations",
    response_model=List[CampaignAdaptationResponse],
    summary="Get all campaign adaptations for a source content item",
)
def get_campaign_adaptations(
    content_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    return CampaignAdaptationService.get_adaptations(
        content_id=content_id,
        db=db,
        organization_id=auth.organization_id,
    )


@router.patch(
    "/adaptations/{id}",
    response_model=CampaignAdaptationResponse,
    summary="Edit an adaptation's text and re-run brand audit",
)
def edit_adaptation(
    id: str,
    payload: EditAdaptationRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    _check_adaptation_role(auth)
    return CampaignAdaptationService.edit_adaptation(
        adaptation_id=id,
        new_content=payload.content,
        db=db,
        organization_id=auth.organization_id,
    )


@router.post(
    "/adaptations/{id}/regenerate",
    response_model=CampaignAdaptationResponse,
    summary="Regenerate an adaptation variant",
)
def regenerate_adaptation(
    id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    _check_adaptation_role(auth)
    _check_adaptation_rate_limit(auth.user_id)

    return CampaignAdaptationService.regenerate_adaptation(
        adaptation_id=id,
        db=db,
        user_id=auth.user_id,
        organization_id=auth.organization_id,
    )


@router.post(
    "/adaptations/{id}/submit-for-review",
    response_model=SubmitForReviewResponse,
    summary="Submit an adaptation variant for formal human review",
)
def submit_adaptation_for_review(
    id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    _check_adaptation_role(auth)

    new_sub = CampaignAdaptationService.submit_for_review(
        adaptation_id=id,
        db=db,
        user_id=auth.user_id,
        organization_id=auth.organization_id,
    )
    return SubmitForReviewResponse(
        message="Campaign variant submitted for human review as a new draft submission.",
        submission_id=new_sub.id,
        adaptation_id=id,
        status="submitted",
    )

