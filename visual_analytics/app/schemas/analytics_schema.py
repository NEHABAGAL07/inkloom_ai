"""Schemas for Visual Analytics and Repeated-Issue Insights."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SeverityBreakdown(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class ViolationCategoryStat(BaseModel):
    category: str
    count: int
    percentage: float
    description: str


class TimeTrendPoint(BaseModel):
    date: str
    count: int
    category: str


class TerminologyIssueStat(BaseModel):
    detected_term: str
    recommended_term: str
    occurrences: int
    severity: str


class ReviewStatusStat(BaseModel):
    status: str
    count: int
    percentage: float


class AnalyticsDashboardResponse(BaseModel):
    total_audits: int
    total_findings: int
    compliance_rate_pct: float
    findings_by_severity: SeverityBreakdown
    most_frequent_violations: List[ViolationCategoryStat]
    accessibility_trends: List[TimeTrendPoint]
    color_inconsistency_trends: List[TimeTrendPoint]
    repeated_terminology_issues: List[TerminologyIssueStat]
    review_status_breakdown: List[ReviewStatusStat]
    date_range: str
    is_demo_data: bool = False


class RepeatedIssueInsight(BaseModel):
    insight_id: str
    category: str
    issue_type: str
    summary: str
    recommendation: str
    frequency_count: int
    affected_creatives_count: int
    severity: str
    guideline_id: Optional[str] = None
    guideline_ambiguity_flag: bool = False


class InsightsResponse(BaseModel):
    has_sufficient_data: bool
    total_audits_analyzed: int
    status_message: str
    insights: List[RepeatedIssueInsight]
