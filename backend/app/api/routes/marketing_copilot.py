"""
Marketing Copilot API Routes
Endpoints for brand-aware creative generation, draft persistence, version management,
and Phase 2 AI audit integration.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    AuthContext,
    UserRole,
    Permission,
    require_roles,
)
from app.schemas.marketing_copilot import (
    CampaignBriefRequest,
    MarketingGenerationResponse,
    SaveDraftRequest,
    UpdateDraftRevisionRequest,
    DraftDetailResponse,
)
from app.schemas.audit_contract import AuditResult
from app.services.marketing_copilot.service import MarketingCopilotService

router = APIRouter(prefix="/marketing-copilot", tags=["Marketing Copilot"])


@router.post("/generate", response_model=MarketingGenerationResponse, status_code=status.HTTP_200_OK)
def generate_marketing_copy(
    payload: CampaignBriefRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Generates multiple structured, brand-governed creative copy alternatives.
    Grounded in Phase 1 shared intelligence, protected against prompt injection.
    """
    try:
        return MarketingCopilotService.generate_alternatives(
            db=db,
            auth=auth,
            brief=payload,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Marketing copy generation failed: {str(e)}",
        )


@router.post("/drafts", response_model=DraftDetailResponse, status_code=status.HTTP_201_CREATED)
def save_draft(
    payload: SaveDraftRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Persists a generated alternative or customized text as an organizational draft.
    """
    return MarketingCopilotService.save_draft(db=db, auth=auth, payload=payload)


@router.get("/drafts", response_model=List[DraftDetailResponse])
def list_drafts(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Lists authorized drafts for the authenticated tenant.
    """
    return MarketingCopilotService.list_drafts(db=db, auth=auth, limit=limit, offset=offset)


@router.get("/drafts/{draft_id}", response_model=DraftDetailResponse)
def get_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Retrieves draft metadata, current copy, and version history.
    """
    return MarketingCopilotService.get_draft(db=db, auth=auth, draft_id=draft_id)


@router.post("/drafts/{draft_id}/revisions", response_model=DraftDetailResponse, status_code=status.HTTP_201_CREATED)
def update_draft_revision(
    draft_id: str,
    payload: UpdateDraftRevisionRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Creates a new revision for a draft, preserving the historical copy.
    """
    return MarketingCopilotService.update_draft_revision(
        db=db,
        auth=auth,
        draft_id=draft_id,
        payload=payload,
    )


@router.post("/drafts/{draft_id}/audit", response_model=AuditResult, status_code=status.HTTP_201_CREATED)
def audit_draft(
    draft_id: str,
    revision_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Triggers the Phase 2 AI Audit Engine on the exact draft revision.
    Returns real findings, severity, evidence status, and suggested corrections.
    """
    return MarketingCopilotService.audit_draft(
        db=db,
        auth=auth,
        draft_id=draft_id,
        revision_id=revision_id,
    )


@router.post("/drafts/{draft_id}/submit", response_model=DraftDetailResponse)
def submit_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.DESIGNER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Submits a finalized draft for human review and approval.
    """
    return MarketingCopilotService.submit_draft_for_review(
        db=db,
        auth=auth,
        draft_id=draft_id,
    )
