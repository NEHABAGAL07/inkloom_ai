"""OCR-Based Text Extraction, Promotional Claim Detection, and Terminology Checking."""

import re
from typing import List, Dict, Any, Optional
from PIL import Image

from visual_analytics.app.config import BrandConfiguration, settings


class TextElement:
    """Detected word or phrase with geometric location and confidence."""

    def __init__(
        self,
        text: str,
        x: int,
        y: int,
        width: int,
        height: int,
        confidence: float,
    ):
        self.text = text
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "confidence": round(self.confidence, 2),
        }


class OCRResult:
    """Structured extraction output from image OCR."""

    def __init__(
        self,
        status: str,  # 'completed', 'no_text_detected', 'unavailable', 'fallback'
        extracted_text: str,
        confidence: Optional[float] = None,
        elements: Optional[List[TextElement]] = None,
        promotional_claims: Optional[List[Dict[str, Any]]] = None,
        terminology_inconsistencies: Optional[List[Dict[str, Any]]] = None,
        warning_message: Optional[str] = None,
    ):
        self.status = status
        self.extracted_text = extracted_text
        self.confidence = confidence
        self.elements = elements or []
        self.promotional_claims = promotional_claims or []
        self.terminology_inconsistencies = terminology_inconsistencies or []
        self.warning_message = warning_message

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "extracted_text": self.extracted_text,
            "confidence": self.confidence,
            "element_count": len(self.elements),
            "promotional_claims": self.promotional_claims,
            "terminology_inconsistencies": self.terminology_inconsistencies,
            "warning_message": self.warning_message,
        }


class OCRExtractor:
    """Manages OCR extraction with pytesseract and reliable fallback mechanics."""

    # Pre-compiled promotional claim patterns
    PROMOTIONAL_PATTERNS = [
        (
            re.compile(r"\b100%\s*(?:error[-\s]?free|guarantee|satisfaction)\b", re.IGNORECASE),
            "Absolute Guarantee Claim",
            "Absolute performance or error-free guarantees violate advertising compliance and require substantiation.",
            "Replace absolute claims with qualified performance statements (e.g., 'Enterprise-grade accuracy').",
        ),
        (
            re.compile(r"\b(?:best[-\s]?in[-\s]?class|world['’]?s\s*best|#1\s*rated|industry[-\s]?leading)\b", re.IGNORECASE),
            "Superlative Claim",
            "Unsubstantiated superlative claims ('best-in-class', '#1') require legal audit and benchmark citations.",
            "Include third-party benchmark citations or soften to descriptive feature terminology.",
        ),
        (
            re.compile(r"\b(?:\d+%\s*off|save\s*(?:\$|£|€)?\d+|huge\s*sale|special\s*offer|limited\s*time\s*only)\b", re.IGNORECASE),
            "Promotional Discount & Urgency",
            "Promotional pricing or urgency copy must follow brand discount disclosure guidelines.",
            "Ensure promotional expiration terms and conditions are legibly included.",
        ),
        (
            re.compile(r"\b(?:money[-\s]?back\s*guarantee|no\s*risk|free\s*trial)\b", re.IGNORECASE),
            "Risk Reversal Claim",
            "Financial or risk-reversal guarantees require customer support alignment and clear terms.",
            "Reference official refund and service level agreements (SLAs).",
        ),
    ]

    def __init__(self, brand_config: Optional[BrandConfiguration] = None):
        self.brand_config = brand_config or settings.DEFAULT_BRAND_CONFIG

    def check_tesseract_availability(self) -> bool:
        """Verify whether pytesseract and the underlying binary are executable."""
        try:
            import pytesseract
            # Test getting tesseract version
            _ = pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def extract_text(
        self,
        image: Image.Image,
        fallback_text: Optional[str] = None,
    ) -> OCRResult:
        """
        Extract text via Tesseract if available, otherwise apply documented fallback.
        Never fabricates results.
        """
        is_available = self.check_tesseract_availability()

        if not is_available:
            if fallback_text is not None and fallback_text.strip():
                # Documented user-supplied fallback text
                claims = self.detect_promotional_claims(fallback_text)
                terms = self.check_terminology(fallback_text)
                return OCRResult(
                    status="fallback",
                    extracted_text=fallback_text.strip(),
                    confidence=None,
                    elements=[],
                    promotional_claims=claims,
                    terminology_inconsistencies=terms,
                    warning_message=(
                        "Tesseract OCR binary is not installed in the current environment. "
                        "Analyzed using verified user-supplied fallback text."
                    ),
                )
            else:
                return OCRResult(
                    status="unavailable",
                    extracted_text="",
                    confidence=None,
                    elements=[],
                    promotional_claims=[],
                    terminology_inconsistencies=[],
                    warning_message=(
                        "Tesseract OCR engine is not installed or not found in system PATH. "
                        "Visual text extraction skipped. Install 'tesseract-ocr' or provide fallback text."
                    ),
                )

        # Tesseract is available - perform actual OCR extraction
        import pytesseract
        from pytesseract import Output

        try:
            # 1. Full text extraction
            raw_text = pytesseract.image_to_string(image)
            clean_text = raw_text.strip()

            # 2. Extract bounding boxes and confidences per word
            data = pytesseract.image_to_data(image, output_type=Output.DICT)
            elements: List[TextElement] = []
            confidences: List[float] = []

            n_boxes = len(data["text"])
            for i in range(n_boxes):
                word = data["text"][i].strip()
                conf_val = float(data["conf"][i])
                if word and conf_val >= 0:
                    conf_norm = conf_val / 100.0
                    confidences.append(conf_norm)
                    elements.append(
                        TextElement(
                            text=word,
                            x=data["left"][i],
                            y=data["top"][i],
                            width=data["width"][i],
                            height=data["height"][i],
                            confidence=conf_norm,
                        )
                    )

            avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else None

            if not clean_text:
                return OCRResult(
                    status="no_text_detected",
                    extracted_text="",
                    confidence=None,
                    elements=[],
                    promotional_claims=[],
                    terminology_inconsistencies=[],
                    warning_message="OCR engine executed successfully, but no readable text was detected in the creative.",
                )

            # 3. Detect promotional claims
            claims = self.detect_promotional_claims(clean_text)

            # 4. Check brand terminology and spelling rules
            terms = self.check_terminology(clean_text)

            return OCRResult(
                status="completed",
                extracted_text=clean_text,
                confidence=avg_confidence,
                elements=elements,
                promotional_claims=claims,
                terminology_inconsistencies=terms,
                warning_message=None,
            )

        except Exception as e:
            return OCRResult(
                status="error",
                extracted_text="",
                confidence=None,
                elements=[],
                promotional_claims=[],
                terminology_inconsistencies=[],
                warning_message=f"OCR processing failed with unexpected error: {str(e)}",
            )

    def detect_promotional_claims(self, text: str) -> List[Dict[str, Any]]:
        """Identify promotional and unverified claims within text."""
        findings = []
        for pattern, claim_type, explanation, suggestion in self.PROMOTIONAL_PATTERNS:
            matches = pattern.finditer(text)
            for m in matches:
                matched_str = m.group(0)
                findings.append({
                    "claim_type": claim_type,
                    "matched_text": matched_str,
                    "start": m.start(),
                    "end": m.end(),
                    "explanation": explanation,
                    "suggestion": suggestion,
                    "severity": "high" if "Guarantee" in claim_type else "medium",
                })
        return findings

    def check_terminology(self, text: str) -> List[Dict[str, Any]]:
        """Check extracted text against brand terminology and spelling rules."""
        findings = []
        for rule in self.brand_config.terminology_rules:
            flags = 0 if rule.case_sensitive else re.IGNORECASE
            matches = re.finditer(rule.forbidden_pattern, text, flags=flags)
            for m in matches:
                matched_str = m.group(0)
                findings.append({
                    "rule_id": rule.rule_id,
                    "forbidden_term": matched_str,
                    "recommended_replacement": rule.suggested_replacement,
                    "explanation": rule.description,
                    "start": m.start(),
                    "end": m.end(),
                    "severity": "high" if rule.rule_id == "TERM-002" else "medium",
                })
        return findings
