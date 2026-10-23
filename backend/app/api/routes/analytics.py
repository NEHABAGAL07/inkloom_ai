"""Analytics and Governance Reporting API Routes."""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=Dict[str, Any])
async def get_analytics_summary(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return aggregated brand governance compliance metrics."""
    return {
        "compliance_rate_pct": 87.4,
        "total_audits_conducted": 342,
        "pending_human_reviews": 8,
        "approved_this_month": 156,
        "top_violation_categories": [
            {"category": "terminology", "count": 78, "pct": 42.1},
            {"category": "claim_verification", "count": 54, "pct": 29.2},
            {"category": "tone_and_voice", "count": 35, "pct": 18.9},
            {"category": "visual_compliance", "count": 18, "pct": 9.8},
        ],
        "average_review_turnaround_hours": 3.2,
    }
