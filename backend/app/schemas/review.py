"""Review Decision and Workflow Transition Schemas."""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import ReviewActionEnum, WorkflowStateEnum


class ReviewDecisionCreate(BaseModel):
    content_id: str
    revision_id: str
    action: ReviewActionEnum
    comments: str = Field(..., min_length=2, description="Mandatory rationale for review decision")
    decision_metadata: Dict[str, Any] = Field(default_factory=dict)


class ReviewDecisionResponse(BaseModel):
    id: str
    content_id: str
    revision_id: str
    reviewer_id: str
    action: ReviewActionEnum
    comments: str
    created_at: datetime
    new_workflow_status: WorkflowStateEnum


class WorkflowTransitionRequest(BaseModel):
    target_state: WorkflowStateEnum
    reason: Optional[str] = None
