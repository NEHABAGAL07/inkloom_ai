from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    comment_text: str
    category: Optional[str] = "visual_design"


class CommentResolveToggle(BaseModel):
    is_resolved: bool
    resolution_note: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    submission_id: str
    organization_id: str
    author_id: Optional[str] = None
    author_name: str
    author_role: str
    comment_text: str
    category: str
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommentsListResponse(BaseModel):
    comments: List[CommentResponse]
    total_count: int
    open_count: int
    resolved_count: int
