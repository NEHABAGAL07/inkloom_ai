"""Brand Colour Consistency, Dominant Colour Extraction, and CIELAB Delta-E Analysis."""

import math
from typing import List, Tuple, Dict, Any, Optional
from PIL import Image

from visual_analytics.app.config import BrandConfiguration, settings
from visual_analytics.app.schemas.visual_audit_schema import (
    DominantColor,
    ColorAnalysisResult,
    VisualFinding,
    AuditSeverity,
    EvidenceStatus,
)


def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
    """Convert hexadecimal color string to (R, G, B) tuple."""
    hex_clean = hex_code.lstrip("#").strip()
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
    """Convert (R, G, B) tuple to hexadecimal color string."""
    return f"#{int(r):02X}{int(g):02X}{int(b):02X}"


def rgb_to_cielab(r: int, g: int, b: int) -> Tuple[float, float, float]:
    """
    Convert sRGB (0-255) to CIE L*a*b* under D65 standard illuminant.
    Provides perceptually uniform coordinates for human visual color differences.
    """
    # 1. Inverse sRGB gamma companding to linear RGB
    def to_linear(c_val: float) -> float:
        v = c_val / 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

    r_lin = to_linear(r)
    g_lin = to_linear(g)
    b_lin = to_linear(b)

    # 2. Linear RGB to CIE XYZ (D65)
    x = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
    y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
    z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

    # D65 reference white
    xn, yn, zn = 0.95047, 1.00000, 1.08883
    xr = x / xn
    yr = y / yn
    zr = z / zn

    def f_t(t: float) -> float:
        return t ** (1.0 / 3.0) if t > 0.008856 else (7.787 * t) + (16.0 / 116.0)

    fx = f_t(xr)
    fy = f_t(yr)
    fz = f_t(zr)

    l_star = (116.0 * fy) - 16.0
    a_star = 500.0 * (fx - fy)
    b_star = 200.0 * (fy - fz)

    return (l_star, a_star, b_star)


def calculate_delta_e(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    """
    Compute CIE76 Delta-E color distance between two sRGB colors.
    < 2.3: JND (Just Noticeable Difference).
    < 15.0: Close tint or slight shade variation.
    > 25.0: Noticeably different color.
    """
    lab1 = rgb_to_cielab(*rgb1)
    lab2 = rgb_to_cielab(*rgb2)
    return round(
        math.sqrt(
            (lab1[0] - lab2[0]) ** 2
            + (lab1[1] - lab2[1]) ** 2
            + (lab1[2] - lab2[2]) ** 2
        ),
        2,
    )


class ColorAnalyzer:
    """Extracts dominant colors and validates against configured brand palettes."""

    def __init__(self, brand_config: Optional[BrandConfiguration] = None):
        self.brand_config = brand_config or settings.DEFAULT_BRAND_CONFIG

    def extract_dominant_colors(
        self,
        image: Image.Image,
        max_colors: int = 8,
        min_coverage_pct: float = 2.0,
    ) -> List[DominantColor]:
        """
        Extract primary dominant colors using spatial downsampling and Pillow quantization.
        Calculates exact pixel coverage percentages.
        """
        # Downsample image for performance and noise suppression
        sample = image.copy()
        if sample.mode == "RGBA":
            # Composite over white background to avoid transparent alpha artifacts
            bg = Image.new("RGB", sample.size, (255, 255, 255))
            bg.paste(sample, mask=sample.split()[3])
            sample = bg
        elif sample.mode != "RGB":
            sample = sample.convert("RGB")

        sample.thumbnail((200, 200), Image.Resampling.LANCZOS)

        # Quantize image to palette of max_colors
        quantized = sample.quantize(colors=max_colors, method=Image.Quantize.MEDIANCUT)
        palette = quantized.getpalette()[: max_colors * 3]
        color_counts = quantized.getcolors()

        if not color_counts:
            return []

        total_pixels = sum(count for count, _ in color_counts)
        if total_pixels == 0:
            return []

        raw_dominant = []
        for count, idx in color_counts:
            r = palette[idx * 3]
            g = palette[idx * 3 + 1]
            b = palette[idx * 3 + 2]
            coverage = (count / total_pixels) * 100.0
            if coverage >= min_coverage_pct:
                raw_dominant.append({
                    "rgb": (r, g, b),
                    "hex": rgb_to_hex(r, g, b),
                    "coverage": coverage,
                })

        # Merge clusters that are visually indistinguishable (Delta-E < 5.0)
        merged_clusters: List[Dict[str, Any]] = []
        for item in sorted(raw_dominant, key=lambda x: x["coverage"], reverse=True):
            found_existing = False
            for existing in merged_clusters:
                d_e = calculate_delta_e(item["rgb"], existing["rgb"])
                if d_e < 5.0:
                    existing["coverage"] += item["coverage"]
                    found_existing = True
                    break
            if not found_existing:
                merged_clusters.append(item)

        # Build DominantColor result objects and evaluate against approved palette
        results: List[DominantColor] = []
        approved_rgb_list = [
            (c.hex, hex_to_rgb(c.hex)) for c in self.brand_config.approved_palette
        ]

        tolerance = self.brand_config.color_tolerance_delta_e

        for cluster in merged_clusters:
            c_rgb = cluster["rgb"]
            c_hex = cluster["hex"]
            cov = round(cluster["coverage"], 1)

            # Find nearest approved color
            nearest_hex = None
            min_dist = float("inf")

            for app_hex, app_rgb in approved_rgb_list:
                dist = calculate_delta_e(c_rgb, app_rgb)
                if dist < min_dist:
                    min_dist = dist
                    nearest_hex = app_hex

            is_approved = min_dist <= tolerance

            results.append(
                DominantColor(
                    hex=c_hex,
                    rgb=list(c_rgb),
                    coverage_pct=cov,
                    is_approved=is_approved,
                    nearest_approved_hex=nearest_hex,
                    delta_e=min_dist if min_dist != float("inf") else None,
                )
            )

        return results

    def analyze_palette_compliance(
        self,
        image: Image.Image,
    ) -> Tuple[ColorAnalysisResult, List[VisualFinding]]:
        """
        Evaluate image color scheme against brand palette.
        Identifies off-brand colors and produces structured audit findings.
        """
        dominant_colors = self.extract_dominant_colors(image)
        min_flag_coverage = self.brand_config.min_color_coverage_pct

        approved_palette_summary = [
            {"name": c.name, "hex": c.hex, "role": c.role}
            for c in self.brand_config.approved_palette
        ]

        # Incomplete configuration handling
        if not self.brand_config.approved_palette:
            return (
                ColorAnalysisResult(
                    dominant_colors=dominant_colors,
                    approved_palette=[],
                    off_brand_colors_detected=[],
                    palette_adherence_pct=0.0,
                    explanation="No approved brand colors configured in guidelines.",
                ),
                [
                    VisualFinding(
                        id="COL-WARN-001",
                        category="brand_color",
                        severity=AuditSeverity.MEDIUM,
                        title="Brand Palette Not Configured",
                        explanation="No approved brand colors are registered in the brand configuration. Color validation cannot be evaluated.",
                        evidence_status=EvidenceStatus.INCONCLUSIVE,
                        confidence=1.0,
                        suggestion="Configure approved brand hex colors in organization settings.",
                    )
                ],
            )

        off_brand_list = [
            c for c in dominant_colors
            if not c.is_approved and c.coverage_pct >= min_flag_coverage
        ]

        total_analyzed_coverage = sum(c.coverage_pct for c in dominant_colors)
        approved_coverage = sum(c.coverage_pct for c in dominant_colors if c.is_approved)
        adherence_pct = (
            round((approved_coverage / total_analyzed_coverage) * 100.0, 1)
            if total_analyzed_coverage > 0
            else 100.0
        )

        findings: List[VisualFinding] = []
        finding_idx = 1

        for off in off_brand_list:
            # Differentiate severity based on prominence
            severity = AuditSeverity.HIGH if off.coverage_pct >= 15.0 else AuditSeverity.MEDIUM
            findings.append(
                VisualFinding(
                    id=f"COL-F00{finding_idx}",
                    category="brand_color",
                    severity=severity,
                    title=f"Off-Brand Color Detected ({off.hex})",
                    original_text=f"Detected color {off.hex} occupying {off.coverage_pct}% of visual surface",
                    explanation=(
                        f"Detected color {off.hex} deviates from approved palette (Delta-E = {off.delta_e:.1f} "
                        f"from nearest approved color {off.nearest_approved_hex})."
                    ),
                    evidence_status=EvidenceStatus.DETECTED,
                    measured_value=off.hex,
                    required_value=f"Delta-E <= {self.brand_config.color_tolerance_delta_e:.1f} to {off.nearest_approved_hex}",
                    suggestion=(
                        f"Replace {off.hex} with approved brand color '{off.nearest_approved_hex}' or official neutral tint."
                    ),
                    confidence=0.92,
                    source_reference="Brand Visual Identity Guidelines §3.1",
                )
            )
            finding_idx += 1

        explanation = (
            f"Image brand color adherence is {adherence_pct}%. "
            f"Detected {len(dominant_colors)} dominant colors with {len(off_brand_list)} off-brand clusters."
        )

        result = ColorAnalysisResult(
            dominant_colors=dominant_colors,
            approved_palette=approved_palette_summary,
            off_brand_colors_detected=off_brand_list,
            palette_adherence_pct=adherence_pct,
            explanation=explanation,
        )

        return result, findings
