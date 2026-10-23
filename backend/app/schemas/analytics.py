from typing import List, Dict, Any
from pydantic import BaseModel


class ViolationMetric(BaseModel):
    category: str
    count: int
    percentage: float


class ComplianceTrendPoint(BaseModel):
    date: str
    average_compliance_score: float
    total_audits: int


class AnalyticsSummaryResponse(BaseModel):
    total_submissions: int
    pending_reviews: int
    average_compliance_score: float
    overall_compliance_rate: float
    top_violations: List[ViolationMetric]
    compliance_trends: List[ComplianceTrendPoint]
    recent_activity_count: int
