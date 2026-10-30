from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DepartmentFeedbackCreate(BaseModel):
    category: str = Field(default="general", description="visual_design, copy_tone, legal_compliance, claim_verification, brand_rules, general")
    description: str = Field(..., min_length=1, description="Detailed feedback or issue explanation")
    requested_correction: Optional[str] = Field(default=None, description="Suggested replacement or fix")
    evidence: Optional[Dict[str, Any]] = Field(default=None, description="Audit finding or guideline reference")


class DepartmentReviewSubmit(BaseModel):
    department: str = Field(..., description="manager, marketing, or legal")
    outcome: str = Field(..., description="no_changes_required or changes_requested")
    comments: Optional[str] = Field(default=None, description="High-level departmental summary comments")
    feedback_items: List[DepartmentFeedbackCreate] = Field(default=[], description="Detailed feedback items")


class DepartmentFeedbackResponse(BaseModel):
    id: str
    cycle_id: str
    submission_id: str
    revision_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    reviewer_name: str
    reviewer_department: str
    feedback_category: str
    feedback_description: str
    requested_correction: Optional[str] = None
    review_outcome: str
    status: str
    relevant_audit_evidence: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DepartmentReviewResponse(BaseModel):
    id: str
    cycle_id: str
    submission_id: str
    revision_id: Optional[str] = None
    department: str
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_status: str
    outcome: Optional[str] = None
    comments: Optional[str] = None
    submitted_at: Optional[datetime] = None
    feedback_items: List[DepartmentFeedbackResponse] = []

    class Config:
        from_attributes = True


class ReviewCycleResponse(BaseModel):
    id: str
    organization_id: str
    submission_id: str
    revision_id: Optional[str] = None
    cycle_number: int
    status: str
    final_approval_status: str
    final_approved_by: Optional[str] = None
    final_approved_at: Optional[datetime] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    departmental_reviews: List[DepartmentReviewResponse] = []
    feedback_records: List[DepartmentFeedbackResponse] = []

    class Config:
        from_attributes = True


class DesignVersionSummary(BaseModel):
    version_id: str
    version_number: int
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    media_url: Optional[str] = None
    created_at: datetime
    change_summary: Optional[str] = None


class DesignerFeedbackGroup(BaseModel):
    submission_id: str
    title: str
    description: Optional[str] = None
    content_type: str
    current_version: int
    thumbnail_url: Optional[str] = None
    file_name: Optional[str] = None
    created_at: datetime
    workflow_status: str
    active_cycle: Optional[ReviewCycleResponse] = None
    cycles: List[ReviewCycleResponse] = []
    versions: List[DesignVersionSummary] = []
    has_changes_requested: bool = False
    all_reviews_completed: bool = False


class DesignerFeedbackSummaryResponse(BaseModel):
    total_feedback_items: int
    changes_requested_count: int
    reviews_completed_count: int
    designs_awaiting_review_count: int
    design_groups: List[DesignerFeedbackGroup] = []


class FinalApprovalSubmit(BaseModel):
    comments: Optional[str] = None

