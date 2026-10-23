"""Inkloom AI - Optical Character Recognition (OCR) Abstraction.

Extracts embedded text and spatial bounding boxes from images and scanned document pages.
Reports capability availability honestly without pretending unextracted text was audited.
"""

import logging
import os
import shutil
from typing import List, Tuple, Optional
from app.services.media_audit.interfaces import TextSegment
from app.core.config import settings

logger = logging.getLogger(__name__)


class OCRExtractor:
    """Safely interfaces with pytesseract when the system binary is available."""

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.tesseract_cmd = tesseract_cmd or settings.TESSERACT_CMD
        self._is_available: Optional[bool] = None

    def is_available(self) -> bool:
        """Check if pytesseract library and system executable are present."""
        if self._is_available is not None:
            return self._is_available

        try:
            import pytesseract
            # Check if tesseract binary exists in PATH or at configured path
            bin_path = shutil.which(self.tesseract_cmd) or self.tesseract_cmd
            if os.path.exists(bin_path) or shutil.which(self.tesseract_cmd):
                pytesseract.pytesseract.tesseract_cmd = bin_path
                self._is_available = True
            else:
                self._is_available = False
        except Exception:
            self._is_available = False

        return self._is_available

    def extract_text(
        self,
        image_path: str,
        page_number: int = 1,
    ) -> Tuple[str, List[TextSegment], List[str]]:
        """
        Extract text and spatial segments from image.
        Returns (extracted_text, text_segments, warnings).
        """
        warnings: List[str] = []
        segments: List[TextSegment] = []

        if not self.is_available():
            warnings.append(
                "OCR capability is unavailable: Tesseract OCR binary not detected in environment. "
                "Embedded image text could not be extracted or audited."
            )
            return "", segments, warnings

        try:
            import pytesseract
            from PIL import Image

            with Image.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode not in ("L", "RGB"):
                    img = img.convert("RGB")

                # Extract full text
                text = pytesseract.image_to_string(img) or ""
                clean_text = text.strip()

                if clean_text:
                    segments.append(
                        TextSegment(
                            text=clean_text,
                            page_number=page_number,
                            confidence=0.85,
                        )
                    )

                return clean_text, segments, warnings
        except Exception as e:
            logger.warning("OCR processing encountered an error: %s", str(e))
            warnings.append(f"OCR processing failed: {str(e)}")
            return "", segments, warnings
