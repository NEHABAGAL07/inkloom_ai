"""
API Routes for Phase 5: Legal Copilot
Provides endpoints for:
- Authoritative regulatory and statutory source retrieval
- Evidence-grounded marketing compliance review & risk evaluation
- 10-section structured legal report generation
- Explicit conservative wording revision application
- Legal counsel decision & feedback recording
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    require_roles,
    AuthContext,
    UserRole,
)
from app.models import ContentSubmission
from app.schemas.legal_copilot import (
    AuthoritativeLegalSource,
    LegalReviewRequest,
    LegalReviewReport,
    ApplyRevisionRequest,
    RecordLegalFeedbackRequest,
    TargetJurisdiction,
)
from app.services.legal_copilot.service import LegalCopilotService

router = APIRouter(prefix="/legal-copilot", tags=["legal-copilot"])


@router.get(
    "/sources",
    response_model=List[AuthoritativeLegalSource],
    summary="List Authoritative Legal & Regulatory Sources",
)
def list_legal_sources(
    jurisdiction: str = Query("Global", description="Target jurisdiction (US, EU, UK, CA, AU, Global)"),
    regulated_category: Optional[str] = Query(None, description="Regulated sector filter"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(require_roles(
        UserRole.LEGAL,
        UserRole.COMPLIANCE_OFFICER,
        UserRole.ADMIN,
        UserRole.MARKETING,
        UserRole.DESIGNER,
    )),
):
    """
    Retrieves verified statutory codes, regulations, and official regulator guidance.
    Distinguishes binding law, administrative guidance, and internal company policies.
    """
    return LegalCopilotService.retrieve_legal_sources(
        db=db,
        auth=auth,
        jurisdiction=jurisdiction,
        regulated_category=regulated_category,
    )


@router.post(
    "/review",
    response_model=LegalReviewReport,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Evidence-Grounded Legal Compliance Review",
)
def review_compliance_and_claims(
    request: LegalReviewRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(require_roles(
        UserRole.LEGAL,
        UserRole.COMPLIANCE_OFFICER,
        UserRole.ADMIN,
        UserRole.MARKETING,
        UserRole.DESIGNER,
    )),
):
    """
    Executes deep evidence-grounded legal evaluation of commercial content.
    Grounds findings in statutory law, verifies claims against factual benchmarks,
    and generates a formal 10-section compliance evaluation report.
    """
    return LegalCopilotService.review_compliance_and_claims(
        db=db,
        auth=auth,
        request=request,
    )


@router.get(
    "/reviews/{submission_id}",
    response_model=LegalReviewReport,
    summary="Retrieve Legal Review Report for Content Submission",
)
def get_submission_legal_report(
    submission_id: str,
    target_jurisdiction: str = Query("Global", description="Target jurisdiction to evaluate"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(require_roles(
        UserRole.LEGAL,
        UserRole.COMPLIANCE_OFFICER,
        UserRole.ADMIN,
        UserRole.MARKETING,
        UserRole.DESIGNER,
    )),
):
    """
    Retrieves or generates an evidence-grounded legal review report for an existing content submission.
    Strictly isolated by tenant organization ID.
    """
    submission = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content submission '{submission_id}' not found.",
        )

    # Use submission text
    raw_text = submission.raw_text or submission.title
    req = LegalReviewRequest(
        title=submission.title,
        content_text=raw_text,
        submission_id=submission.id,
        revision_id=submission.current_revision_id,
        product_name=submission.title,
        target_jurisdiction=TargetJurisdiction(target_jurisdiction) if target_jurisdiction in [j.value for j in TargetJurisdiction] else TargetJurisdiction.GLOBAL,
        marketing_channel="general",
    )
    return LegalCopilotService.review_compliance_and_claims(db=db, auth=auth, request=req)


@router.post(
    "/reviews/{submission_id}/apply-revision",
    status_code=status.HTTP_201_CREATED,
    summary="Explicitly Apply Conservative Legal Wording Revision",
)
def apply_suggested_revision(
    submission_id: str,
    payload: ApplyRevisionRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(require_roles(
        UserRole.LEGAL,
        UserRole.COMPLIANCE_OFFICER,
        UserRole.ADMIN,
        UserRole.MARKETING,
    )),
):
    """
    Explicitly applies a conservative legal wording revision to create a new content revision.
    Never overwrites content silently without user action.
    """
    rev = LegalCopilotService.apply_suggested_revision(
        db=db,
        auth=auth,
        submission_id=submission_id,
        payload=payload,
    )
    return {
        "submission_id": submission_id,
        "revision_id": rev.id,
        "version_number": rev.version_number,
        "updated_text": rev.raw_text,
        "change_summary": payload.change_summary,
    }


@router.post(
    "/reviews/{submission_id}/decision",
    status_code=status.HTTP_200_OK,
    summary="Record Human Legal Counsel Decision & Sign-off",
)
def record_legal_decision(
    submission_id: str,
    payload: RecordLegalFeedbackRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(require_roles(
        UserRole.LEGAL,
        UserRole.COMPLIANCE_OFFICER,
        UserRole.ADMIN,
    )),
):
    """
    Records formal human legal counsel sign-off, rejection, or change request.
    Crucial governance invariant: AI never auto-approves generated content for publication.
    """
    decision = LegalCopilotService.record_reviewer_decision(
        db=db,
        auth=auth,
        submission_id=submission_id,
        payload=payload,
    )
    return {
        "decision_id": decision.id,
        "submission_id": submission_id,
        "action": decision.action,
        "comments": decision.comments,
        "reviewer_id": decision.reviewer_id,
        "created_at": decision.created_at,
    }
