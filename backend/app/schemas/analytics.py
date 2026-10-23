"""Analytics and Governance Reporting Schemas."""

from typing import Dict, List, Any
from pydantic import BaseModel, Field


class FindingSeverityCount(BaseModel):
    severity: str
    count: int


class FindingCategoryCount(BaseModel):
    category: str
    count: int


class ContentStatusCount(BaseModel):
    status: str
    count: int


class AnalyticsOverviewResponse(BaseModel):
    """Aggregated compliance metrics calculated dynamically from database."""
    total_content_items: int = Field(0, description="Total content items submitted")
    total_audits: int = Field(0, description="Total audits executed")
    total_approved: int = Field(0, description="Total versions approved by human reviewers")
    approval_rate_pct: float = Field(0.0, description="Percentage of submitted items approved")
    findings_by_severity: Dict[str, int] = Field(default_factory=dict, description="Counts by severity (low, medium, high, critical)")
    findings_by_category: Dict[str, int] = Field(default_factory=dict, description="Counts by category")
    content_by_status: Dict[str, int] = Field(default_factory=dict, description="Counts by current workflow status")
    average_findings_per_audit: float = Field(0.0, description="Average number of findings per audit run")
