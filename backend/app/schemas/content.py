"""Content Submission and Revision Schemas."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import WorkflowStateEnum


class ContentSubmissionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    workspace_id: str
    organization_id: str
    content_type: str = Field("text", pattern="^(text|document|image|video)$")
    raw_text: Optional[str] = None


class ContentRevisionResponse(BaseModel):
    id: str
    submission_id: str
    revision_num: int
    raw_text: Optional[str] = None
    file_path: Optional[str] = None
    file_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ContentSubmissionResponse(BaseModel):
    id: str
    organization_id: str
    workspace_id: str
    author_id: str
    title: str
    content_type: str
    current_status: WorkflowStateEnum
    current_revision_num: int
    created_at: datetime
    updated_at: datetime
    revisions: List[ContentRevisionResponse] = Field(default_factory=list)
