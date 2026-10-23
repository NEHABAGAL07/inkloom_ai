from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ApprovedAssetBase(BaseModel):
    name: str
    asset_type: str  # logo, color_palette, typography, verified_claim, boilerplate
    file_url: Optional[str] = None
    specifications: Dict[str, Any] = {}
    is_active: bool = True


class ApprovedAssetCreate(ApprovedAssetBase):
    pass


class ApprovedAssetResponse(ApprovedAssetBase):
    id: str
    organization_id: str
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
