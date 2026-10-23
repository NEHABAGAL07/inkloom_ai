"""
Media Processing Typed Interfaces and Data Transfer Objects

Standardized communication contract for text, document, image, and video
extraction pipelines.
"""
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MediaProcessingStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    SKIPPED = "skipped"


class ProcessingWarning(BaseModel):
    code: str
    message: str
    severity: str = "warning"  # warning, info, error


class MediaSegment(BaseModel):
    segment_id: str
    text: str
    page_number: Optional[int] = None
    timestamp_seconds: Optional[float] = None
    confidence: Optional[float] = 1.0
    bounding_box: Optional[Dict[str, float]] = None


class ExtractedContent(BaseModel):
    source_filename: str
    media_type: str
    file_size_bytes: int
    processing_status: MediaProcessingStatus
    extracted_text: str
    segments: List[MediaSegment] = Field(default_factory=list)
    media_metadata: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[ProcessingWarning] = Field(default_factory=list)


class VisualBrandAnalysisResult(BaseModel):
    logo_detected: bool = False
    logo_clearspace_compliant: Optional[bool] = None
    dominant_colors_hex: List[str] = Field(default_factory=list)
    contrast_ratio: Optional[float] = None
    wcag_aa_compliant: Optional[bool] = None
    warnings: List[str] = Field(default_factory=list)
