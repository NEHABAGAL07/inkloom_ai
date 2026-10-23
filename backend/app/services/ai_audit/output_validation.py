"""Inkloom AI - Output Validation, Normalization, and Finding Deduplication Pipeline."""

from typing import List, Optional, Set, Tuple
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum


class FindingPipeline:
    """Validates, cleans, normalizes, and deduplicates governance findings."""

    @classmethod
    def process(
        cls,
        findings: List[FindingSchema],
        text: str,
    ) -> List[FindingSchema]:
        """Normalize, validate locations, and deduplicate findings."""
        if not findings:
            return []

        cleaned: List[FindingSchema] = []
        text_len = len(text)

        for finding in findings:
            # 1. Location bounds sanity check
            loc = finding.location
            if loc:
                start = loc.start_offset if loc.start_offset is not None else 0
                end = loc.end_offset if loc.end_offset is not None else start
                if start < 0:
                    start = 0
                if end > text_len:
                    end = text_len
                if start > end:
                    end = start
                line = loc.line if (loc.line and loc.line > 0) else (text[:start].count("\n") + 1)
                loc.start_offset = start
                loc.end_offset = end
                loc.line = line

            # 2. Source reference integrity: Empty strings become None
            src_ref = finding.source_reference
            if src_ref and not src_ref.strip():
                src_ref = None

            # 3. Confidence bounding
            confidence = max(0.0, min(1.0, float(finding.confidence)))

            # 4. Mandatory human review rule for claim verifications without source
            requires_review = finding.requires_human_review
            if finding.category == FindingCategoryEnum.CLAIM_VERIFICATION and src_ref is None:
                requires_review = True

            validated = finding.model_copy(
                update={
                    "location": loc,
                    "source_reference": src_ref,
                    "confidence": round(confidence, 2),
                    "requires_human_review": requires_review,
                }
            )
            cleaned.append(validated)

        # 5. Deduplication
        deduplicated = cls._deduplicate(cleaned)

        # 6. Assign stable sequential IDs if generic or empty
        final_findings: List[FindingSchema] = []
        for idx, f in enumerate(deduplicated, start=1):
            category_prefix = f.category.value[:4]
            stable_id = f.id if f.id and not f.id.endswith("-unknown") else f"fnd-{category_prefix}-{idx:03d}"
            final_findings.append(f.model_copy(update={"id": stable_id}))

        return final_findings

    @staticmethod
    def _deduplicate(findings: List[FindingSchema]) -> List[FindingSchema]:
        """
        Deduplicates overlapping or redundant findings.
        If two findings flag the exact same text span:
        - Keep the one with higher severity or more specific message.
        - Merge evidence and preserve independent findings across different spans.
        """
        if len(findings) <= 1:
            return findings

        severity_weights = {
            FindingSeverityEnum.CRITICAL: 5,
            FindingSeverityEnum.HIGH: 4,
            FindingSeverityEnum.MEDIUM: 3,
            FindingSeverityEnum.LOW: 2,
            FindingSeverityEnum.INFO: 1,
        }

        # Sort by span start, then length descending, then severity descending
        def sort_key(f: FindingSchema) -> Tuple[int, int, int]:
            start = f.location.start_offset if (f.location and f.location.start_offset is not None) else 0
            end = f.location.end_offset if (f.location and f.location.end_offset is not None) else start
            span_len = end - start
            sev = severity_weights.get(f.severity, 1)
            return (start, -span_len, -sev)

        sorted_findings = sorted(findings, key=sort_key)
        retained: List[FindingSchema] = []
        seen_spans: Set[Tuple[int, int, str]] = set()

        for f in sorted_findings:
            if not f.location or f.location.start_offset is None or f.location.end_offset is None:
                # Findings without specific location are deduplicated by title and category
                title_cat = (f.title.strip().lower(), f.category.value)
                if not any(
                    (r.title.strip().lower(), r.category.value) == title_cat for r in retained
                ):
                    retained.append(f)
                continue

            start = f.location.start_offset
            end = f.location.end_offset
            span_tuple = (start, end, f.category.value)

            # Check if this exact span in this category was already flagged
            if span_tuple in seen_spans:
                continue

            # Check for near-identical span collision (same category within +/- 2 chars)
            is_redundant = False
            for (seen_start, seen_end, seen_cat) in seen_spans:
                if seen_cat == f.category.value:
                    if abs(seen_start - start) <= 2 and abs(seen_end - end) <= 2:
                        is_redundant = True
                        break
            if is_redundant:
                continue

            seen_spans.add(span_tuple)
            retained.append(f)

        return retained
