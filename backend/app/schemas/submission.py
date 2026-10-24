from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class ContentRevisionBase(BaseModel):
    version_number: int = 1
    raw_text: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    media_metadata: Optional[Dict[str, Any]] = None


class ContentRevisionCreate(ContentRevisionBase):
    pass


class ContentRevisionResponse(ContentRevisionBase):
    id: str
    submission_id: str
    file_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContentSubmissionBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str = "text"  # text, document, image, video


class ContentSubmissionCreate(ContentSubmissionBase):
    initial_text: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    media_url: Optional[str] = None
    media_metadata: Optional[Dict[str, Any]] = None


class ContentSubmissionResponse(ContentSubmissionBase):
    id: str
    organization_id: str
    creator_id: Optional[str] = None
    status: str
    current_revision_id: Optional[str] = None
    raw_text: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    media_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    revisions: Optional[List[ContentRevisionResponse]] = None

    model_config = ConfigDict(from_attributes=True)
