"""Brand Guideline Schemas."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import FindingSeverityEnum, FindingCategoryEnum


class GuidelineRuleCreate(BaseModel):
    rule_key: str
    title: str
    description: str
    severity: FindingSeverityEnum = FindingSeverityEnum.MEDIUM
    rule_config: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class GuidelineRuleResponse(GuidelineRuleCreate):
    id: str
    guideline_id: str
    created_at: datetime


class BrandGuidelineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    organization_id: Optional[str] = None
    category: FindingCategoryEnum
    version: str = "1.0"
    description: Optional[str] = None
    rules: List[GuidelineRuleCreate] = Field(default_factory=list)


class BrandGuidelineResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    category: FindingCategoryEnum
    version: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    rules: List[GuidelineRuleResponse] = Field(default_factory=list)
