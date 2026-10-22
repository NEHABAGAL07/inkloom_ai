"""Verified Fact / Knowledge Source Schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VerifiedFactCreate(BaseModel):
    statement: str = Field(..., min_length=3, description="Approved empirical claim or verified factual statement")
    category: str = Field("general", description="Category: market_metric, certification, product_spec, financial")
    source_document: Optional[str] = Field(None, description="Citation or source document proving this fact")
    organization_id: Optional[str] = None


class VerifiedFactResponse(BaseModel):
    id: str
    organization_id: str
    statement: str
    category: str
    source_document: Optional[str] = None
    is_active: bool
    created_at: datetime
