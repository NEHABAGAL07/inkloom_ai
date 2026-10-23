from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


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
    created_at: datetime
    updated_at: datetime
    rules: Optional[List[GuidelineRuleResponse]] = None

    model_config = ConfigDict(from_attributes=True)
