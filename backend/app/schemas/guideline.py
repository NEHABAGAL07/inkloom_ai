from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class GuidelineRuleBase(BaseModel):
    category: str
    rule_name: str
    section: Optional[str] = None
    severity_default: str = "medium"
    rule_definition: Dict[str, Any]
    requires_human_review: bool = False
    source_url: Optional[str] = None


class GuidelineRuleCreate(GuidelineRuleBase):
    pass


class GuidelineRuleResponse(GuidelineRuleBase):
    id: str
    guideline_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandGuidelineBase(BaseModel):
    name: str
    description: Optional[str] = None
    version: str = "1.0.0"
    is_active: bool = True


class BrandGuidelineCreate(BrandGuidelineBase):
    rules: Optional[List[GuidelineRuleCreate]] = None


class BrandGuidelineResponse(BrandGuidelineBase):
    id: str
    organization_id: str
    status: str = "published"
    published_at: Optional[datetime] = None
    published_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    rules: Optional[List[GuidelineRuleResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class BrandGuidelineProfileResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    version: str
    status: str  # draft, published, changes_pending
    is_active: bool
    published_at: Optional[datetime] = None
    published_by: Optional[str] = None
    is_manager: bool = False
    draft_data: Optional[Dict[str, Any]] = None
    published_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandGuidelineDraftUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    draft_data: Dict[str, Any]


class BrandGuidelinePublishRequest(BaseModel):
    version: str
    changelog: Optional[str] = None


class BrandGuidelineVersionResponse(BaseModel):
    id: str
    guideline_id: str
    organization_id: str
    version: str
    changelog: Optional[str] = None
    published_by: str
    published_at: datetime
    snapshot_data: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class EffectiveSettingsResponse(BaseModel):
    media_type: str
    effective_settings: Dict[str, Any]
    inherited_keys: List[str]
    overridden_keys: List[str]
    conflicts: List[Dict[str, Any]] = Field(default_factory=list)
