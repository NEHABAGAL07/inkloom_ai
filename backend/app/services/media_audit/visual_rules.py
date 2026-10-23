"""Inkloom AI - Visual Brand Rules & Color Adherence Module.

Implements deterministic visual compliance checks:
1. Relative luminance & WCAG 2.1 contrast ratio calculations ((L1 + 0.05) / (L2 + 0.05))
2. Dominant color extraction and brand palette adherence
3. Image dimension and aspect ratio constraints
4. Visual finding generation conforming to contracts/audit-result.schema.json
"""

import math
from typing import List, Tuple, Optional, Dict, Any
from app.schemas.audit import FindingSchema, LocationSchema, BoundingBoxSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum


# Standard Inkloom corporate brand color palette
INKLOOM_DEFAULT_PALETTE = [
    "#1A365D",  # Navy / Deep Brand Primary
    "#0284C7",  # Sky / Brand Accent
    "#0F172A",  # Slate Dark
    "#FFFFFF",  # Pure White
    "#F8FAFC",  # Off-White / Background
]


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex string (e.g. '#1A365D' or '1A365D') to RGB tuple."""
    hex_clean = hex_color.lstrip("#")
    if len(hex_clean) == 3:
        hex_clean = "".join(c * 2 for c in hex_clean)
    if len(hex_clean) != 6:
        return (0, 0, 0)
    return (
        int(hex_clean[0:2], 16),
        int(hex_clean[2:4], 16),
        int(hex_clean[4:6], 16),
    )


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB integers to normalized hex color string."""
    return f"#{r:02X}{g:02X}{b:02X}"


def calculate_relative_luminance(r: int, g: int, b: int) -> float:
    """
    Calculate relative luminance according to WCAG 2.1 specification.
    Linearizes sRGB channels and applies photometric coefficients.
    """
    def linearize(val: int) -> float:
        c = val / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r_lin = linearize(r)
    g_lin = linearize(g)
    b_lin = linearize(b)

    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin


def calculate_contrast_ratio(color1_hex: str, color2_hex: str) -> float:
    """
    Compute WCAG luminance contrast ratio between two hex colors.
    Returns ratio from 1.0 to 21.0.
    """
    r1, g1, b1 = hex_to_rgb(color1_hex)
    r2, g2, b2 = hex_to_rgb(color2_hex)

    lum1 = calculate_relative_luminance(r1, g1, b1)
    lum2 = calculate_relative_luminance(r2, g2, b2)

    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)

    ratio = (lighter + 0.05) / (darker + 0.05)
    return round(ratio, 2)


def color_distance_euclidean(hex1: str, hex2: str) -> float:
    """Compute Euclidean color distance in RGB space."""
    r1, g1, b1 = hex_to_rgb(hex1)
    r2, g2, b2 = hex_to_rgb(hex2)
    return math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)


class VisualBrandRulesEngine:
    """Evaluates visual metrics against corporate brand identity standards."""

    MIN_WCAG_AA_CONTRAST = 4.5
    MAX_COLOR_DISTANCE_TOLERANCE = 85.0  # Max distance to consider a color aligned with brand

    def __init__(self, approved_palette: Optional[List[str]] = None):
        self.approved_palette = approved_palette or INKLOOM_DEFAULT_PALETTE

    def evaluate_contrast(
        self,
        foreground_hex: str,
        background_hex: str,
        finding_id_prefix: str = "vis-contrast",
    ) -> Optional[FindingSchema]:
        """Verify foreground/background contrast meets WCAG AA standards (4.5:1)."""
        ratio = calculate_contrast_ratio(foreground_hex, background_hex)
        if ratio < self.MIN_WCAG_AA_CONTRAST:
            return FindingSchema(
                id=f"{finding_id_prefix}-001",
                category=FindingCategoryEnum.ACCESSIBILITY,
                severity=FindingSeverityEnum.MEDIUM,
                title="Insufficient Visual Color Contrast",
                message=(
                    f"Measured contrast ratio of {ratio}:1 between foreground {foreground_hex} "
                    f"and background {background_hex} falls below the WCAG AA minimum threshold of 4.5:1."
                ),
                evidence=f"Foreground: {foreground_hex}, Background: {background_hex}, Ratio: {ratio}:1",
                source_reference="WCAG 2.1 Success Criterion 1.4.3: Contrast (Minimum)",
                confidence=0.98,
                suggested_correction=(
                    f"Darken the foreground or lighten the background to achieve at least 4.5:1 contrast."
                ),
                status=FindingStatusEnum.FLAGGED,
                location=LocationSchema(page=1),
                requires_human_review=False,
            )
        return None

    def evaluate_palette_adherence(
        self,
        dominant_colors: List[str],
        finding_id_prefix: str = "vis-palette",
    ) -> List[FindingSchema]:
        """Detect dominant colors that clash with or deviate from the approved brand palette."""
        findings: List[FindingSchema] = []
        if not dominant_colors:
            return findings

        off_brand_colors: List[str] = []
        for color in dominant_colors[:3]:  # Check top dominant colors
            closest_dist = min(
                color_distance_euclidean(color, approved)
                for approved in self.approved_palette
            )
            if closest_dist > self.MAX_COLOR_DISTANCE_TOLERANCE:
                off_brand_colors.append(color)

        if off_brand_colors:
            palette_str = ", ".join(self.approved_palette[:4])
            off_str = ", ".join(off_brand_colors)
            findings.append(
                FindingSchema(
                    id=f"{finding_id_prefix}-001",
                    category=FindingCategoryEnum.VISUAL_COMPLIANCE,
                    severity=FindingSeverityEnum.LOW,
                    title="Off-Brand Dominant Palette Detected",
                    message=(
                        f"Image dominant colors ({off_str}) deviate from the authorized corporate palette: "
                        f"[{palette_str}]. High color variance dilutes brand recognition."
                    ),
                    evidence=f"Detected off-brand colors: {off_str}",
                    source_reference="Brand Identity Guidelines v2.4, Section 2.1: Color System",
                    confidence=0.88,
                    suggested_correction=f"Align visual assets to the authorized brand palette: {palette_str}.",
                    status=FindingStatusEnum.FLAGGED,
                    location=LocationSchema(page=1),
                    requires_human_review=False,
                )
            )

        return findings

    def evaluate_dimensions(
        self,
        width: int,
        height: int,
        min_width: int = 400,
        min_height: int = 300,
        finding_id_prefix: str = "vis-dim",
    ) -> List[FindingSchema]:
        """Ensure image dimensions meet minimum resolution standards for publication."""
        findings: List[FindingSchema] = []
        if width < min_width or height < min_height:
            findings.append(
                FindingSchema(
                    id=f"{finding_id_prefix}-001",
                    category=FindingCategoryEnum.VISUAL_COMPLIANCE,
                    severity=FindingSeverityEnum.LOW,
                    title="Low Resolution Visual Asset",
                    message=(
                        f"Asset resolution ({width}x{height}px) is below the minimum recommended publishing "
                        f"standard of {min_width}x{min_height}px. Low-res media appears blurry on high-DPI displays."
                    ),
                    evidence=f"Resolution: {width}x{height}px",
                    source_reference="Digital Asset Management Standard, Section 1.2: Minimum Resolutions",
                    confidence=1.0,
                    suggested_correction=f"Provide high-resolution asset of at least {min_width}x{min_height}px.",
                    status=FindingStatusEnum.FLAGGED,
                    location=LocationSchema(page=1),
                    requires_human_review=False,
                )
            )
        return findings

    def evaluate_alt_text(
        self,
        alt_text: Optional[str],
        finding_id_prefix: str = "vis-a11y-alt",
    ) -> List[FindingSchema]:
        """Flag missing or trivial/placeholder alt text for visual assets."""
        findings: List[FindingSchema] = []
        if not alt_text or not alt_text.strip():
            findings.append(
                FindingSchema(
                    id=f"{finding_id_prefix}-001",
                    category=FindingCategoryEnum.ACCESSIBILITY,
                    severity=FindingSeverityEnum.MEDIUM,
                    title="Missing Image Alt Text",
                    message="Visual asset lacks descriptive alternative text required for screen reader accessibility.",
                    evidence="alt_text is empty or null",
                    source_reference="WCAG 2.1 Success Criterion 1.1.1: Non-text Content",
                    confidence=1.0,
                    suggested_correction="Provide concise, accurate descriptive alt text explaining the image purpose.",
                    status=FindingStatusEnum.FLAGGED,
                    location=LocationSchema(page=1),
                    requires_human_review=False,
                )
            )
        elif len(alt_text.strip().split()) < 2 or alt_text.strip().lower() in ("image", "photo", "picture", "logo"):
            findings.append(
                FindingSchema(
                    id=f"{finding_id_prefix}-002",
                    category=FindingCategoryEnum.ACCESSIBILITY,
                    severity=FindingSeverityEnum.LOW,
                    title="Generic or Inadequate Alt Text",
                    message=f"Alternative text '{alt_text}' is too generic or repetitive to provide meaningful accessibility context.",
                    evidence=f"alt_text: '{alt_text}'",
                    source_reference="WCAG 2.1 Success Criterion 1.1.1: Non-text Content",
                    confidence=0.9,
                    suggested_correction="Describe the specific scene, subjects, or data depicted in the image.",
                    status=FindingStatusEnum.FLAGGED,
                    location=LocationSchema(page=1),
                    requires_human_review=False,
                )
            )
        return findings
