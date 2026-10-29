"""
Pydantic Schemas for Campaign Workflow & Approval Orchestration (Phase 6)
"""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.submission import ContentSubmissionResponse


class CampaignPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CampaignReviewTrackStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"
    FAILED = "failed"
    NEEDS_HUMAN_REVIEW = "needs_human_review"


class ReviewTrackResult(BaseModel):
    track_name: str  # marketing, visual, legal
    status: CampaignReviewTrackStatus = CampaignReviewTrackStatus.NOT_REQUIRED
    score: Optional[float] = None
    findings_count: int = 0
    critical_findings_count: int = 0
    last_run_at: Optional[datetime] = None
    reviewed_version: Optional[int] = None
    reviewed_revision_id: Optional[str] = None
    summary_message: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CampaignPolicyConfig(BaseModel):
    required_reviews: List[str] = Field(
        default_factory=lambda: ["marketing", "visual", "legal"],
        description="Tracks required before publication: marketing, visual, legal",
    )
    min_compliance_score: float = Field(
        default=75.0,
        ge=0.0,
        le=100.0,
        description="Minimum overall compliance index required",
    )
    require_legal_signoff: bool = Field(
        default=True,
        description="Requires formal legal counsel decision for regulated products or high-risk claims",
    )
    require_independent_reviewer: bool = Field(
        default=True,
        description="Enforces segregation of duties preventing content creator self-approval",
    )
    allow_partial_brief: bool = Field(default=True)

    model_config = ConfigDict(extra="allow")


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    product_name: Optional[str] = None
    target_audience: Optional[str] = None
    campaign_objective: Optional[str] = None
    target_channel: str = Field(default="omnichannel")
    target_jurisdiction: str = Field(default="Global")
    regulated_category: str = Field(default="general_commercial")
    priority: CampaignPriority = CampaignPriority.MEDIUM
    deadline: Optional[datetime] = None
    creative_brief: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    policy_config: Optional[CampaignPolicyConfig] = None
    campaign_metadata: Optional[Dict[str, Any]] = None
    submission_ids: Optional[List[str]] = Field(
        default_factory=list,
        description="Existing submissions/drafts/assets to attach immediately",
    )

    model_config = ConfigDict(extra="ignore")


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_name: Optional[str] = None
    target_audience: Optional[str] = None
    campaign_objective: Optional[str] = None
    target_channel: Optional[str] = None
    target_jurisdiction: Optional[str] = None
    regulated_category: Optional[str] = None
    priority: Optional[CampaignPriority] = None
    deadline: Optional[datetime] = None
    creative_brief: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    policy_config: Optional[Dict[str, Any]] = None
    campaign_metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    
    # Optimistic concurrency lock: must match current campaign version
    version: Optional[int] = Field(None, description="Current campaign version for optimistic concurrency control")

    model_config = ConfigDict(extra="ignore")


class CampaignAssociateSubmissionsRequest(BaseModel):
    submission_ids: List[str]
    action: str = Field(default="attach", description="'attach' or 'detach'")


class CampaignDecisionRequest(BaseModel):
    action: str = Field(description="'approve', 'reject', or 'request_changes'")
    comments: Optional[str] = None
    review_metadata: Optional[Dict[str, Any]] = None
    conditions: Optional[List[str]] = None


class CampaignReadinessEvaluation(BaseModel):
    campaign_id: str
    workflow_state: str
    ai_checks_completed: bool
    human_review_completed: bool
    required_approvals_completed: bool
    outstanding_blockers: List[str] = Field(default_factory=list)
    review_tracks: Dict[str, ReviewTrackResult] = Field(default_factory=dict)
    is_ready_for_release: bool
    compliance_disclaimer: str = (
        "READINESS NOTICE: Campaign readiness indicates completion of internal brand, "
        "visual, and legal governance checks. It does NOT guarantee judicial compliance "
        "or eliminate external regulatory dispute risks."
    )

    model_config = ConfigDict(from_attributes=True)


class CampaignResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    product_name: Optional[str] = None
    target_audience: Optional[str] = None
    campaign_objective: Optional[str] = None
    target_channel: str
    target_jurisdiction: str
    regulated_category: str
    priority: str
    deadline: Optional[datetime] = None
    owner_id: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    status: str
    creative_brief: Optional[str] = None
    policy_config: Dict[str, Any]
    campaign_metadata: Dict[str, Any]
    version: int
    created_at: datetime
    updated_at: datetime

    submissions: List[ContentSubmissionResponse] = Field(default_factory=list)
    review_tracks: Dict[str, ReviewTrackResult] = Field(default_factory=dict)
    readiness: Optional[CampaignReadinessEvaluation] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: str
    organization_id: str
    recipient_id: str
    sender_id: Optional[str] = None
    title: str
    message: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    details: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)
