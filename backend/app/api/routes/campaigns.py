"""
Campaign API Routes (Phase 6 Unified Workflow & Approval Orchestration)
Endpoints for campaign creation, metadata updates, multi-track AI review triggers,
human approval decisions, readiness evaluation, and audit activity history.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    AuthContext,
    UserRole,
    require_roles,
)
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignAssociateSubmissionsRequest,
    CampaignDecisionRequest,
    CampaignResponse,
    CampaignReadinessEvaluation,
)
from app.models.campaign import Campaign
from app.models.audit_event import AuditEvent
from app.services.workflow.campaign_orchestrator import CampaignOrchestrator
from app.services.workflow.campaign_policy import CampaignPolicyService

router = APIRouter(prefix="/campaigns", tags=["Campaigns & Unified Workflow"])


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.DESIGNER,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.LEGAL,
            UserRole.REVIEWER,
        )
    ),
):
    """Creates a new campaign within the authenticated organization."""
    campaign = CampaignOrchestrator.create_campaign(db=db, auth=auth, payload=payload)
    readiness = CampaignPolicyService.evaluate_readiness(campaign, db)
    return CampaignOrchestrator.build_response(campaign, readiness)


@router.get("", response_model=List[CampaignResponse])
def list_campaigns(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    priority_filter: Optional[str] = Query(default=None, alias="priority"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Lists tenant-isolated campaigns with optional status and priority filtering."""
    campaigns = CampaignOrchestrator.list_campaigns(
        db=db,
        auth=auth,
        status_filter=status_filter,
        priority_filter=priority_filter,
        limit=limit,
        offset=offset,
    )
    results: List[CampaignResponse] = []
    for c in campaigns:
        readiness = CampaignPolicyService.evaluate_readiness(c, db)
        results.append(CampaignOrchestrator.build_response(c, readiness))
    return results


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieves full campaign details, review tracks, and release readiness."""
    campaign = CampaignOrchestrator.get_campaign(db=db, auth=auth, campaign_id=campaign_id)
    readiness = CampaignPolicyService.evaluate_readiness(campaign, db)
    return CampaignOrchestrator.build_response(campaign, readiness)


@router.patch("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.DESIGNER,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.LEGAL,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Updates campaign metadata.
    Enforces optimistic locking: fails with HTTP 409 Conflict if payload.version != current version.
    """
    campaign = CampaignOrchestrator.update_campaign(
        db=db,
        auth=auth,
        campaign_id=campaign_id,
        payload=payload,
    )
    readiness = CampaignPolicyService.evaluate_readiness(campaign, db)
    return CampaignOrchestrator.build_response(campaign, readiness)


@router.post("/{campaign_id}/associate", response_model=CampaignResponse)
def associate_submissions(
    campaign_id: str,
    payload: CampaignAssociateSubmissionsRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Attaches or detaches existing marketing drafts or design assets to this campaign."""
    campaign = CampaignOrchestrator.associate_submissions(
        db=db,
        auth=auth,
        campaign_id=campaign_id,
        submission_ids=payload.submission_ids,
        action=payload.action,
    )
    readiness = CampaignPolicyService.evaluate_readiness(campaign, db)
    return CampaignOrchestrator.build_response(campaign, readiness)


@router.post("/{campaign_id}/reviews/run", response_model=CampaignResponse)
def run_campaign_reviews(
    campaign_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.DESIGNER,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.LEGAL,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Triggers end-to-end multi-track AI reviews (Marketing, Visual, Legal)
    for all current revisions attached to the campaign.
    """
    return CampaignOrchestrator.run_campaign_reviews(
        db=db,
        auth=auth,
        campaign_id=campaign_id,
    )


@router.post("/{campaign_id}/decide", response_model=CampaignResponse)
def record_campaign_decision(
    campaign_id: str,
    payload: CampaignDecisionRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.LEGAL,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Records human compliance decision (approve, reject, request_changes).
    Enforces separation of duties and valid workflow state transitions.
    """
    return CampaignOrchestrator.record_decision(
        db=db,
        auth=auth,
        campaign_id=campaign_id,
        payload=payload,
    )


@router.get("/{campaign_id}/readiness", response_model=CampaignReadinessEvaluation)
def get_campaign_readiness(
    campaign_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Calculates granular release readiness and checks for outstanding blockers."""
    campaign = CampaignOrchestrator.get_campaign(db=db, auth=auth, campaign_id=campaign_id)
    return CampaignPolicyService.evaluate_readiness(campaign, db)


@router.get("/{campaign_id}/activity")
def get_campaign_activity_timeline(
    campaign_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieves immutable audit event history for the campaign."""
    campaign = CampaignOrchestrator.get_campaign(db=db, auth=auth, campaign_id=campaign_id)
    events = (
        db.query(AuditEvent)
        .filter(
            AuditEvent.organization_id == auth.organization_id,
            AuditEvent.entity_id == campaign.id,
        )
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "actor_id": e.actor_id,
            "details": e.details,
            "created_at": e.created_at,
        }
        for e in events
    ]
