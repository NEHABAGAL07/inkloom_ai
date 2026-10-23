"""Inkloom AI - Terminology and Brand Vocabulary Checker.

Enforces corporate naming standards, trademark casing, preferred vocabulary,
and forbidden phrase lists with precise word boundaries and deduplication.
"""

import re
from typing import List, Dict, Any, Optional, Set, Tuple
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.services.ai_audit.interface import LearnedPreference


class TerminologyChecker:
    """Checks content against prohibited phrases, trademark casing, and preferred terms."""

    def check(
        self,
        text: str,
        rules: List[RetrievedRule],
        learned_preferences: Optional[List[LearnedPreference]] = None,
    ) -> List[FindingSchema]:
        """Execute terminology checks with boundary awareness and false-positive prevention."""
        findings: List[FindingSchema] = []
        term_rules = [r for r in rules if r.category == "terminology"]
        flagged_spans: Set[Tuple[int, int]] = set()

        # Check learned preferences first if any
        if learned_preferences:
            for pref in learned_preferences:
                if pref.preference_type == "custom_forbidden_term":
                    pattern = re.compile(rf"\b{re.escape(pref.pattern)}\b", re.IGNORECASE)
                    for match in pattern.finditer(text):
                        start_idx = match.start()
                        end_idx = match.end()
                        if (start_idx, end_idx) in flagged_spans:
                            continue
                        flagged_spans.add((start_idx, end_idx))
                        line_num = text[:start_idx].count("\n") + 1
                        evidence = text[max(0, start_idx - 25):min(len(text), end_idx + 25)].strip()
                        suggestion = (
                            text[:start_idx] + pref.replacement + text[end_idx:]
                            if pref.replacement
                            else None
                        )
                        findings.append(
                            FindingSchema(
                                id=f"term-learned-{len(findings)+1}",
                                category=FindingCategoryEnum.TERMINOLOGY,
                                severity=FindingSeverityEnum.MEDIUM,
                                title="Custom Prohibited Term Violation",
                                message=f"Term '{match.group(0)}' violates confirmed organization terminology. Reason: {pref.reason}",
                                evidence=evidence,
                                source_reference=f"Learned Preference #{pref.preference_id}",
                                confidence=0.96,
                                suggested_correction=suggestion,
                                status=FindingStatusEnum.FLAGGED,
                                location=LocationSchema(
                                    start_offset=start_idx,
                                    end_offset=end_idx,
                                    line=line_num,
                                    page=1,
                                ),
                                requires_human_review=False,
                            )
                        )

        for rule in term_rules:
            config = rule.rule_config
            forbidden_variants = config.get("forbidden_variants", [])
            preferred_term = config.get("preferred_term")
            case_sensitive = config.get("case_sensitive", False)

            # Sort variants by length descending so longer compound phrases match first
            sorted_variants = sorted(forbidden_variants, key=len, reverse=True)

            for variant in sorted_variants:
                # Compile regex with word boundaries
                flags = 0 if case_sensitive else re.IGNORECASE
                pattern = re.compile(rf"\b{re.escape(variant)}\b", flags)

            is_case_sensitive = config.get("case_sensitive", True)
            flags = 0 if is_case_sensitive else re.IGNORECASE

            # Keep track of matched spans to prevent duplicate findings for the same text location
            matched_spans = set()

            for variant in forbidden_variants:
                pattern = re.compile(rf"\b{re.escape(variant)}\b", flags)
                for match in pattern.finditer(text):
                    start_idx = match.start()
                    end_idx = match.end()
                    matched_str = match.group(0)
                    start_idx = match.start()
                    end_idx = match.end()

                    # Prevent duplicate findings for overlapping/identical spans
                    span = (start_idx, end_idx)
                    if span in matched_spans:
                        continue
                    matched_spans.add(span)

                    # If match equals the preferred term, it's valid, skip
                    if preferred_term and (matched_str == preferred_term or matched_str.lower() != variant.lower()):
                        continue

                    line_num = text[:start_idx].count("\n") + 1

                    context_start = max(0, start_idx - 30)
                    context_end = min(len(text), end_idx + 30)
                    evidence_snippet = text[context_start:context_end].strip()

                    suggested_replacement = None
                    if preferred_term:
                        suggested_replacement = text[:start_idx] + preferred_term + text[end_idx:]

                    severity_val = rule.severity.lower()
                    try:
                        severity_enum = FindingSeverityEnum(severity_val)
                    except ValueError:
                        severity_enum = FindingSeverityEnum.MEDIUM

                    finding = FindingSchema(
                        id=f"term-{rule.rule_id}-{len(findings)+1}",
                        category=FindingCategoryEnum.TERMINOLOGY,
                        severity=severity_enum,
                        title=rule.title,
                        message=f"Term '{matched_str}' violates terminology guidelines. {rule.description}",
                        evidence=evidence_snippet,
                        source_reference=rule.source_reference,
                        confidence=0.98,
                        suggested_correction=suggested_replacement,
                        status=FindingStatusEnum.FLAGGED,
                        location=LocationSchema(
                            start_offset=start_idx,
                            end_offset=end_idx,
                            line=line_num,
                            page=1,
                        ),
                        requires_human_review=False,
                    )
                    findings.append(finding)

        return findings
