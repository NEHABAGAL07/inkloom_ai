"""Configuration and default parameters for Visual Auditing & Analytics."""

import os
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class BrandColor(BaseModel):
    name: str
    hex: str
    role: str = "primary"  # primary, secondary, accent, neutral, background


class ApprovedTerminologyRule(BaseModel):
    rule_id: str
    forbidden_pattern: str
    suggested_replacement: str
    description: str
    case_sensitive: bool = False


class BrandConfiguration(BaseModel):
    brand_name: str = "Inkloom AI"
    approved_palette: List[BrandColor] = Field(
        default_factory=lambda: [
            BrandColor(name="Inkloom Indigo", hex="#4F46E5", role="primary"),
            BrandColor(name="Deep Slate", hex="#0F172A", role="secondary"),
            BrandColor(name="Electric Cyan", hex="#06B6D4", role="accent"),
            BrandColor(name="Pure White", hex="#FFFFFF", role="background"),
            BrandColor(name="Off White", hex="#F8FAFC", role="background"),
            BrandColor(name="Slate Text", hex="#1E293B", role="neutral"),
            BrandColor(name="Muted Gray", hex="#64748B", role="neutral"),
        ]
    )
    approved_logos: List[Dict[str, Any]] = Field(
        default_factory=lambda: [
            {
                "id": "logo-inkloom-primary",
                "name": "Inkloom Primary Horizontal",
                "aspect_ratio": 3.2,
                "min_width_px": 80,
                "primary_color": "#4F46E5",
            },
            {
                "id": "logo-inkloom-icon",
                "name": "Inkloom Monogram Icon",
                "aspect_ratio": 1.0,
                "min_width_px": 32,
                "primary_color": "#4F46E5",
            },
        ]
    )
    terminology_rules: List[ApprovedTerminologyRule] = Field(
        default_factory=lambda: [
            ApprovedTerminologyRule(
                rule_id="TERM-001",
                forbidden_pattern=r"\binkloom\b",
                suggested_replacement="Inkloom AI",
                description="The brand name 'Inkloom AI' must be properly capitalized.",
                case_sensitive=True,
            ),
            ApprovedTerminologyRule(
                rule_id="TERM-002",
                forbidden_pattern=r"\b100% error-free\b",
                suggested_replacement="high-precision AI governance",
                description="Absolute perfection claims ('100% error-free') are legally prohibited.",
                case_sensitive=False,
            ),
            ApprovedTerminologyRule(
                rule_id="TERM-003",
                forbidden_pattern=r"\bcheap\b",
                suggested_replacement="cost-effective or enterprise-value",
                description="Use premium positioning terminology instead of 'cheap'.",
                case_sensitive=False,
            ),
        ]
    )
    min_contrast_ratio_normal: float = 4.5
    min_contrast_ratio_large: float = 3.0
    color_tolerance_delta_e: float = 16.0
    min_color_coverage_pct: float = 4.0
    logo_verified_threshold: float = 0.85
    logo_possible_threshold: float = 0.65


class Settings:
    MODULE_NAME: str = "Inkloom Visual Brand Auditing & Analytics"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", 15 * 1024 * 1024))  # 15 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/png", "image/jpeg", "image/webp"]
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg", ".webp"]
    MIN_IMAGE_DIMENSION_PX: int = 10
    MAX_IMAGE_DIMENSION_PX: int = 8192
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    DEFAULT_BRAND_CONFIG: BrandConfiguration = BrandConfiguration()


settings = Settings()
