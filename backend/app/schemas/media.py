from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class MediaItemBase(BaseModel):
    original_filename: str
    file_type: str = "image"
    mime_type: str = "image/png"
    file_size: int
    description: Optional[str] = None
    status: str = "active"
    campaign_id: Optional[str] = None
    submission_id: Optional[str] = None


class MediaItemCreate(MediaItemBase):
    stored_filename: str
    file_path: str
    extra_metadata: Optional[Dict[str, Any]] = None


class MediaItemResponse(BaseModel):
    id: str
    organization_id: str
    campaign_id: Optional[str] = None
    submission_id: Optional[str] = None
    original_filename: str
    stored_filename: str
    file_path: str
    file_type: str
    mime_type: str
    file_size: int
    uploaded_by: Optional[str] = None
    description: Optional[str] = None
    status: str
    extra_metadata: Optional[Dict[str, Any]] = None
    media_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MediaItemListResponse(BaseModel):
    items: List[MediaItemResponse]
    total: int
    page: int
    page_size: int
