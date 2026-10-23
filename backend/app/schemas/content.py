"""Content Submission and Revision Schemas."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import WorkflowStateEnum


class ContentSubmissionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    workspace_id: Optional[str] = Field("ws-main-001", description="Target workspace ID")
    organization_id: Optional[str] = Field(None, description="Optional tenant organization ID")
    content_type: str = Field("text", pattern="^(text|document|image|video)$")
    raw_text: Optional[str] = None


class ContentRevisionCreate(BaseModel):
    """Schema for submitting a revision / new version of existing content."""
    raw_text: Optional[str] = None
    file_metadata: Dict[str, Any] = Field(default_factory=dict)


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


class ContentHistoryResponse(BaseModel):
    """Full version history and audit log for a content item."""
    content_id: str
    title: str
    current_version: int
    current_status: WorkflowStateEnum
    versions: List[ContentRevisionResponse]
    audit_history: List[Dict[str, Any]] = Field(default_factory=list)
