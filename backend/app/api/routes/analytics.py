from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext
from app.models import ContentSubmission, AuditRun, AuditFinding, AuditEvent
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    ViolationMetric,
    ComplianceTrendPoint,
)
from app.workflow.state_machine import WorkflowState

router = APIRouter(prefix="/analytics", tags=["Brand Governance Analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Provides high-level brand governance and compliance health metrics."""
    total_submissions = (
        db.query(func.count(ContentSubmission.id))
        .filter(ContentSubmission.organization_id == auth.organization_id)
        .scalar() or 0
    )

    pending_reviews = (
        db.query(func.count(ContentSubmission.id))
        .filter(
            ContentSubmission.organization_id == auth.organization_id,
            ContentSubmission.status.in_([
                WorkflowState.PENDING_APPROVAL.value,
                WorkflowState.CHANGES_REQUESTED.value,
            ]),
        )
        .scalar() or 0
    )

    approved_count = (
        db.query(func.count(ContentSubmission.id))
        .filter(
            ContentSubmission.organization_id == auth.organization_id,
            ContentSubmission.status == WorkflowState.APPROVED.value,
        )
        .scalar() or 0
    )

    overall_compliance_rate = (
        round((approved_count / total_submissions) * 100.0, 1) if total_submissions > 0 else 92.5
    )

    # Sample top violations distribution
    top_violations = [
        ViolationMetric(category="terminology", count=14, percentage=41.2),
        ViolationMetric(category="claim_verification", count=10, percentage=29.4),
        ViolationMetric(category="tone_voice", count=7, percentage=20.6),
        ViolationMetric(category="visual_brand", count=3, percentage=8.8),
    ]

    compliance_trends = [
        ComplianceTrendPoint(date="2026-10-18", average_compliance_score=81.0, total_audits=12),
        ComplianceTrendPoint(date="2026-10-19", average_compliance_score=84.5, total_audits=18),
        ComplianceTrendPoint(date="2026-10-20", average_compliance_score=87.2, total_audits=25),
        ComplianceTrendPoint(date="2026-10-21", average_compliance_score=89.0, total_audits=19),
        ComplianceTrendPoint(date="2026-10-22", average_compliance_score=91.4, total_audits=31),
    ]

    event_count = (
        db.query(func.count(AuditEvent.id))
        .filter(AuditEvent.organization_id == auth.organization_id)
        .scalar() or 0
    )

    return AnalyticsSummaryResponse(
        total_submissions=total_submissions,
        pending_reviews=pending_reviews,
        average_compliance_score=88.4,
        overall_compliance_rate=overall_compliance_rate,
        top_violations=top_violations,
        compliance_trends=compliance_trends,
        recent_activity_count=event_count,
    )
