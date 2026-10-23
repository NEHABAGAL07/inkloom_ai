"""Media Processing & QA - Interfaces and Data Transfer Objects."""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional


class MediaProcessingStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    UNSUPPORTED = "unsupported"


@dataclass
class TextSegment:
    """Segment of text extracted with spatial or temporal location context."""
    text: str
    page_number: Optional[int] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    timestamp_seconds: Optional[float] = None
    confidence: float = 1.0


@dataclass
class VisualCheckResult:
    """Visual brand adherence metrics for images and video frames."""
    dominant_colors: List[str] = field(default_factory=list)  # Hex colors
    contrast_ratio: Optional[float] = None
    logo_detected: bool = False
    logo_clearspace_compliant: Optional[bool] = None
    resolution_width: Optional[int] = None
    resolution_height: Optional[int] = None
    warnings: List[str] = field(default_factory=list)


@dataclass
class MediaProcessingResult:
    """Typed result of media extraction and analysis."""
    source_filename: str
    media_type: str
    status: MediaProcessingStatus
    extracted_text: str = ""
    segments: List[TextSegment] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    visual_results: Optional[VisualCheckResult] = None
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
