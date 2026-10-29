"""
Pydantic Schemas for One-Click Campaign Adaptation API.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AdaptCampaignRequest(BaseModel):
    platforms: List[str] = Field(
        ...,
        description="List of target platforms to adapt content for (e.g. ['instagram', 'linkedin', 'youtube', 'website']).",
        min_length=1,
        max_length=4,
    )


class EditAdaptationRequest(BaseModel):
    content: Dict[str, Any] = Field(
        ...,
        description="Updated structured platform content (e.g. {'caption': '...'} or {'post': '...'}).",
    )


class CampaignAdaptationResponse(BaseModel):
    id: str
    organization_id: str
    source_content_id: str
    platform: str
    content: Dict[str, Any]
    status: str
    mode: str
    audit_result: Optional[Dict[str, Any]] = None
    brand_check: str
    brand_check_details: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SubmitForReviewResponse(BaseModel):
    message: str
    submission_id: str
    adaptation_id: str
    status: str
