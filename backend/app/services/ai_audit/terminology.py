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

                for match in pattern.finditer(text):
                    start_idx = match.start()
                    end_idx = match.end()
                    matched_str = match.group(0)

                    # Sub-match / False positive protection:
                    # If this match is already covered by a previously flagged span, skip
                    if any(s <= start_idx and e >= end_idx for (s, e) in flagged_spans):
                        continue

                    # If the text at this location is actually the preferred term, skip!
                    # Example: "Inkloom" inside "Inkloom AI" when preferred_term is "Inkloom AI"
                    if preferred_term:
                        pref_len = len(preferred_term)
                        # Check forward
                        candidate_forward = text[start_idx : start_idx + pref_len]
                        if candidate_forward == preferred_term:
                            continue
                        # Check backward (if match started mid-phrase)
                        pref_start = max(0, start_idx - pref_len)
                        candidate_context = text[pref_start : end_idx + pref_len]
                        if preferred_term in candidate_context:
                            # Verify if the match itself was part of that preferred term
                            pref_pos_in_context = candidate_context.find(preferred_term)
                            abs_pref_start = pref_start + pref_pos_in_context
                            abs_pref_end = abs_pref_start + pref_len
                            if abs_pref_start <= start_idx and end_idx <= abs_pref_end:
                                continue

                    # If this match string already exactly equals preferred_term, skip
                    if preferred_term and matched_str == preferred_term:
                        continue

                    # Also check if accepted brand names like "Inkloom" are allowed when preferred is "Inkloom AI"
                    # But if the rule title is "Brand Name Capitalization & Casing", only flag improper casing
                    if "Capitalization" in rule.title or "Casing" in rule.title:
                        if matched_str in ("Inkloom", "Inkloom AI"):
                            continue

                    flagged_spans.add((start_idx, end_idx))
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
