"""Shared Audit Result Schema matching `contracts/audit-result.schema.json`."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.common import (
    AuditStatusEnum,
    FindingCategoryEnum,
    FindingSeverityEnum,
    FindingStatusEnum,
)


class BoundingBoxSchema(BaseModel):
    """Bounding box coordinates for visual findings."""
    model_config = ConfigDict(extra="forbid")

    x: float
    y: float
    width: float
    height: float


class LocationSchema(BaseModel):
    """Pinpoint location for an audit finding within document or media."""
    model_config = ConfigDict(extra="forbid")

    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    line: Optional[int] = None
    page: Optional[int] = None
    timestamp_seconds: Optional[float] = None
    selector: Optional[str] = None
    bounding_box: Optional[BoundingBoxSchema] = None


class FindingSchema(BaseModel):
    """Single brand governance violation or recommendation."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique finding ID")
    category: FindingCategoryEnum
    severity: FindingSeverityEnum
    title: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    evidence: Optional[str] = Field(None, description="Verbatim quote or measured value. Null if unavailable.")
    source_reference: Optional[str] = Field(None, description="Guideline rule or certified asset reference. Null if unavailable.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence 0.0 - 1.0. Kept separate from severity.")
    suggested_correction: Optional[str] = Field(None, description="Proposed replacement preserving user intent.")
    status: FindingStatusEnum = FindingStatusEnum.FLAGGED
    location: Optional[LocationSchema] = None
    requires_human_review: bool = Field(True, description="Human reviewer sign-off requirement")


class EngineMetadataSchema(BaseModel):
    """Audit engine execution telemetry and diagnostics."""
    model_config = ConfigDict(extra="forbid")

    engine_version: str
    execution_time_ms: float = Field(..., ge=0.0)
    rules_checked_count: int = Field(..., ge=0)
    ai_model_used: Optional[str] = None
    extractors_used: List[str] = Field(default_factory=list)


class AuditResultSchema(BaseModel):
    """Canonical versioned audit result payload."""
    model_config = ConfigDict(extra="forbid")

    schema_version: str = Field("1.0.0", pattern=r"^\d+\.\d+\.\d+$")
    audit_id: str
    content_id: str
    overall_status: AuditStatusEnum
    summary: str = Field(..., min_length=1)
    findings: List[FindingSchema]
    created_at: str
    engine_metadata: EngineMetadataSchema


class AuditRunRequest(BaseModel):
    """Payload to trigger an audit execution."""
    content_id: str
    revision_id: Optional[int] = None
    guideline_ids: Optional[List[str]] = None
