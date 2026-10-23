"""Common Enums and Shared Schema Types."""

from enum import Enum
from typing import Optional, Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class AuditStatusEnum(str, Enum):
    """Aggregate audit compliance status."""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    NEEDS_HUMAN_REVIEW = "needs_human_review"


class FindingCategoryEnum(str, Enum):
    """Category of guideline finding."""
    TONE_AND_VOICE = "tone_and_voice"
    TERMINOLOGY = "terminology"
    CLAIM_VERIFICATION = "claim_verification"
    VISUAL_COMPLIANCE = "visual_compliance"
    ACCESSIBILITY = "accessibility"
    PROHIBITED_CONTENT = "prohibited_content"
    LEGAL_COMPLIANCE = "legal_compliance"


class FindingSeverityEnum(str, Enum):
    """Finding business impact severity."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingStatusEnum(str, Enum):
    """Workflow state of a single finding."""
    FLAGGED = "flagged"
    ACCEPTED = "accepted"
    DISMISSED = "dismissed"
    ESCALATED = "escalated"


class WorkflowStateEnum(str, Enum):
    """Workflow states for content publication governance."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    AUDITING = "auditing"
    CHANGES_REQUESTED = "changes_requested"
    RESUBMITTED = "resubmitted"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewActionEnum(str, Enum):
    """Action taken by human brand reviewer."""
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"


class StandardResponse(BaseModel):
    """Generic status response."""
    status: str = "success"
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard pagination envelope."""
    items: List[T]
    total: int
    page: int
    page_size: int
