from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ReviewAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"


class ReviewDecisionCreate(BaseModel):
    submission_id: str
    revision_id: Optional[str] = None
    action: ReviewAction
    comments: Optional[str] = None
    review_metadata: Optional[Dict[str, Any]] = None


class ReviewDecisionResponse(BaseModel):
    id: str
    submission_id: str
    revision_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    action: str
    comments: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
