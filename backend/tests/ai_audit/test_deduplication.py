"""Finding Deduplication and Quality Pipeline Tests."""

import pytest
from app.services.ai_audit.output_validation import FindingPipeline
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum


def test_overlapping_span_deduplication_keeps_highest_severity():
    """Verify overlapping findings on the exact same text span keep the highest severity."""
    text = "Try inkloom today for best-in-class workflows."

    # Finding 1: Medium severity terminology check
    f1 = FindingSchema(
        id="fnd-1",
        category=FindingCategoryEnum.TERMINOLOGY,
        severity=FindingSeverityEnum.MEDIUM,
        title="Brand Casing",
        message="Use Inkloom AI",
        evidence="inkloom",
        source_reference="Style Guide",
        confidence=0.9,
        location=LocationSchema(start_offset=4, end_offset=11, line=1, page=1),
        requires_human_review=False,
    )

    # Finding 2: Low severity duplicate check on same span
    f2 = FindingSchema(
        id="fnd-2",
        category=FindingCategoryEnum.TERMINOLOGY,
        severity=FindingSeverityEnum.LOW,
        title="Brand Casing Lower",
        message="Use Inkloom",
        evidence="inkloom",
        source_reference="Style Guide",
        confidence=0.8,
        location=LocationSchema(start_offset=4, end_offset=11, line=1, page=1),
        requires_human_review=False,
    )

    processed = FindingPipeline.process([f2, f1], text)
    # Must retain only 1 finding for this exact span
    assert len(processed) == 1
    # Must retain the higher severity (MEDIUM)
    assert processed[0].severity == FindingSeverityEnum.MEDIUM


def test_independent_findings_in_same_sentence_preserved():
    """Verify separate violations occurring in the same sentence are both preserved."""
    text = "Try inkloom and we are super pumped."
    # f1: 'inkloom' at offsets 4-11
    f1 = FindingSchema(
        id="fnd-1",
        category=FindingCategoryEnum.TERMINOLOGY,
        severity=FindingSeverityEnum.MEDIUM,
        title="Brand Casing",
        message="Use Inkloom AI",
        evidence="inkloom",
        source_reference="Style Guide",
        confidence=0.9,
        location=LocationSchema(start_offset=4, end_offset=11, line=1, page=1),
        requires_human_review=False,
    )
    # f2: 'super pumped' at offsets 23-35
    f2 = FindingSchema(
        id="fnd-2",
        category=FindingCategoryEnum.TONE_AND_VOICE,
        severity=FindingSeverityEnum.LOW,
        title="Informal Tone",
        message="Avoid colloquialism",
        evidence="super pumped",
        source_reference="Tone Guide",
        confidence=0.88,
        location=LocationSchema(start_offset=23, end_offset=35, line=1, page=1),
        requires_human_review=False,
    )

    processed = FindingPipeline.process([f1, f2], text)
    assert len(processed) == 2
    assert {p.category for p in processed} == {FindingCategoryEnum.TERMINOLOGY, FindingCategoryEnum.TONE_AND_VOICE}
