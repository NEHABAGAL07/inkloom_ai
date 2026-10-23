"""Inkloom AI - Image Processor & Visual Brand Rules Unit Tests."""

import os
from PIL import Image
import pytest
from app.services.media_audit.image_processor import ImageProcessor, VisualBrandCheckerAdapter
from app.services.media_audit.visual_rules import (
    VisualBrandRulesEngine,
    calculate_contrast_ratio,
    calculate_relative_luminance,
    color_distance_euclidean,
    hex_to_rgb,
    rgb_to_hex,
)
from app.services.media_audit.interfaces import MediaProcessingStatus
from app.services.media_audit.file_validation import SafeTempFile
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum


def test_wcag_contrast_calculation():
    """Verify luminance and contrast ratios match WCAG 2.1 formula ((L1+0.05)/(L2+0.05))."""
    # Pure black (#000000) on pure white (#FFFFFF) should be 21:1
    assert calculate_contrast_ratio("#000000", "#FFFFFF") == 21.0
    assert calculate_contrast_ratio("#FFFFFF", "#000000") == 21.0

    # Same color contrast should be 1.0:1
    assert calculate_contrast_ratio("#1A365D", "#1A365D") == 1.0

    # Corporate Navy (#1A365D) on White (#FFFFFF)
    navy_on_white = calculate_contrast_ratio("#1A365D", "#FFFFFF")
    assert navy_on_white >= 4.5  # Meets WCAG AA minimum

    # Low contrast pair: light gray on white
    low_contrast = calculate_contrast_ratio("#E2E8F0", "#FFFFFF")
    assert low_contrast < 4.5  # Fails WCAG AA


def test_contrast_finding_generation():
    """Verify low contrast generates an ACCESSIBILITY finding."""
    engine = VisualBrandRulesEngine()
    finding = engine.evaluate_contrast("#CCCCCC", "#FFFFFF")
    assert finding is not None
    assert finding.category == FindingCategoryEnum.ACCESSIBILITY
    assert finding.severity == FindingSeverityEnum.MEDIUM
    assert "falls below the WCAG AA minimum" in finding.message
    assert finding.requires_human_review is False


def test_palette_adherence_off_brand_detection():
    """Verify off-brand colors (e.g. neon magenta, lime green) trigger visual compliance findings."""
    engine = VisualBrandRulesEngine()
    off_brand_palette = ["#FF00FF", "#00FF00", "#FF1493"]  # Neon colors
    findings = engine.evaluate_palette_adherence(off_brand_palette)
    assert len(findings) == 1
    assert findings[0].category == FindingCategoryEnum.VISUAL_COMPLIANCE
    assert findings[0].severity == FindingSeverityEnum.LOW
    assert "deviate from the authorized corporate palette" in findings[0].message


def test_approved_palette_passes():
    """Verify authorized brand palette produces no palette violations."""
    engine = VisualBrandRulesEngine()
    approved = ["#1A365D", "#FFFFFF", "#0284C7"]
    findings = engine.evaluate_palette_adherence(approved)
    assert len(findings) == 0


def test_low_resolution_image_flagged():
    """Verify tiny or low-resolution images trigger minimum resolution guidelines."""
    engine = VisualBrandRulesEngine()
    findings = engine.evaluate_dimensions(width=150, height=100, min_width=400, min_height=300)
    assert len(findings) == 1
    assert findings[0].category == FindingCategoryEnum.VISUAL_COMPLIANCE
    assert "below the minimum recommended publishing standard" in findings[0].message


def test_alt_text_rules_evaluation():
    """Verify missing, trivial, and descriptive alt texts are audited correctly."""
    engine = VisualBrandRulesEngine()

    # Missing alt text -> Medium severity
    missing_findings = engine.evaluate_alt_text(None)
    assert len(missing_findings) == 1
    assert missing_findings[0].category == FindingCategoryEnum.ACCESSIBILITY
    assert missing_findings[0].severity == FindingSeverityEnum.MEDIUM
    assert "lacks descriptive alternative text" in missing_findings[0].message

    # Generic alt text ("photo") -> Low severity
    generic_findings = engine.evaluate_alt_text("photo")
    assert len(generic_findings) == 1
    assert generic_findings[0].category == FindingCategoryEnum.ACCESSIBILITY
    assert generic_findings[0].severity == FindingSeverityEnum.LOW
    assert "too generic" in generic_findings[0].message

    # Descriptive alt text -> Passes cleanly
    good_findings = engine.evaluate_alt_text("Inkloom brand logo on a deep navy background with modern typography")
    assert len(good_findings) == 0


def test_real_image_processing_with_pillow():
    """Verify ImageProcessor extracts metadata and dominant colors from a valid image."""
    processor = ImageProcessor()

    # Create a synthetic 800x600 image with brand navy and sky blue bands
    img = Image.new("RGB", (800, 600), color=(26, 54, 93))  # #1A365D
    # Fill bottom half with white
    for x in range(800):
        for y in range(300, 600):
            img.putpixel((x, y), (255, 255, 255))

    with SafeTempFile(suffix=".png") as tf_path:
        img.save(tf_path, format="PNG")

        res = processor.process_image(tf_path, "brand_hero.png", mime_type="image/png")
        assert res.status == MediaProcessingStatus.SUCCESS
        assert res.metadata["width"] == 800
        assert res.metadata["height"] == 600
        assert res.metadata["aspect_ratio"] == 1.33
        assert res.visual_results is not None
        assert len(res.visual_results.dominant_colors) >= 2


def test_oversized_image_dimensions_rejected():
    """Verify images exceeding 8192px are rejected for resource protection."""
    processor = ImageProcessor()

    # Create image header with dimension > 8192 without allocating huge memory
    img = Image.new("1", (8193, 100))  # 1-bit mode to keep small in memory

    with SafeTempFile(suffix=".png") as tf_path:
        img.save(tf_path, format="PNG")

        res = processor.process_image(tf_path, "giant.png", mime_type="image/png")
        assert res.status == MediaProcessingStatus.FAILED
        assert any("exceed maximum allowed limit" in err for err in res.errors)
