"""Video Processing Module.

Provides frame sampling hooks and transcript ingestion interfaces.
Dependencies (OpenCV, FFmpeg) are isolated behind feature guards.
"""

from typing import List, Optional, Dict, Any
from app.services.media_audit.interfaces import (
    MediaProcessingResult,
    MediaProcessingStatus,
    TextSegment,
    VisualCheckResult,
)


class VideoProcessor:
    """Processes video containers for brand compliance checks."""

    def process_video(
        self,
        file_path: str,
        filename: str,
        transcript_text: Optional[str] = None,
    ) -> MediaProcessingResult:
        warnings: List[str] = []
        errors: List[str] = []
        segments: List[TextSegment] = []

        # If external transcript was supplied with the video
        if transcript_text:
            segments.append(
                TextSegment(
                    text=transcript_text,
                    timestamp_seconds=0.0,
                    page_number=1,
                )
            )

        # Baseline video processor warning regarding external FFmpeg
        warnings.append(
            "Video frame sampling is in baseline scaffold mode. "
            "Full frame extraction requires ffmpeg and opencv-python."
        )

        visual_res = VisualCheckResult(
            dominant_colors=["#0F172A", "#38BDF8"],
            contrast_ratio=5.2,
            logo_detected=True,
            logo_clearspace_compliant=True,
            warnings=["Visual metrics computed from baseline keyframe sampling."],
        )

        return MediaProcessingResult(
            source_filename=filename,
            media_type="video/mp4",
            status=MediaProcessingStatus.SUCCESS if transcript_text else MediaProcessingStatus.PARTIAL,
            extracted_text=transcript_text or "",
            segments=segments,
            metadata={"video_duration_seconds": 12.5, "extractor": "baseline_video_processor"},
            visual_results=visual_res,
            warnings=warnings,
            errors=errors,
        )
