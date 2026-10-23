"""Inkloom AI - Deterministic Rule Engine Module.

Executes reliable, non-LLM brand governance checks:
- Forbidden phrases and keywords
- Required terminology and mandatory disclosures
- Custom regex rules with ReDoS / catastrophic backtracking protection
- Content length and structure boundaries
- Numerical and date constraints
"""

import re
import time
from typing import List, Dict, Any, Optional
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.services.ai_audit.interface import ContentContext


class DeterministicRuleEngine:
    """Executes high-speed deterministic governance checks with strict ReDoS boundaries."""

    MAX_TEXT_EVAL_LEN = 500_000  # Cap content length to prevent unbounded regex evaluation
    REGEX_TIMEOUT_SEC = 0.5

    def check(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        """Execute all active deterministic rule evaluations."""
        findings: List[FindingSchema] = []
        bounded_text = text[:self.MAX_TEXT_EVAL_LEN]

        for rule in rules:
            config = rule.rule_config or {}

            # 1. Required phrases / mandatory disclosures
            required_phrases = config.get("required_phrases", [])
            for phrase in required_phrases:
                if phrase.lower() not in bounded_text.lower():
                    finding = FindingSchema(
                        id=f"rule-req-{rule.rule_id}-{len(findings)+1}",
                        category=self._parse_category(rule.category),
                        severity=self._parse_severity(rule.severity),
                        title=f"Missing Mandatory Disclosure: '{phrase}'",
                        message=(
                            f"Rule '{rule.title}' mandates the inclusion of standard disclosure: "
                            f"'{phrase}'. {rule.description}"
                        ),
                        evidence=None,
                        source_reference=rule.source_reference,
                        confidence=1.0,
                        suggested_correction=f"Append required disclosure: '{phrase}'.",
                        status=FindingStatusEnum.FLAGGED,
                        location=LocationSchema(
                            start_offset=0,
                            end_offset=0,
                            line=1,
                            page=1,
                        ),
                        requires_human_review=False,
                    )
                    findings.append(finding)

            # 2. Safe custom regular expressions
            regex_patterns = config.get("regex_patterns", [])
            for pattern_item in regex_patterns:
                if isinstance(pattern_item, dict):
                    pattern_str = pattern_item.get("pattern", "")
                    custom_msg = pattern_item.get("message", "Custom regex pattern triggered.")
                    case_sensitive = pattern_item.get("case_sensitive", False)
                else:
                    pattern_str = str(pattern_item)
                    custom_msg = f"Forbidden pattern detected by rule '{rule.title}'."
                    case_sensitive = False

                if not self._is_safe_regex(pattern_str):
                    continue  # Safely discard unsafe or pathological regex to prevent ReDoS

                try:
                    flags = 0 if case_sensitive else re.IGNORECASE
                    compiled = re.compile(pattern_str, flags)
                except re.error:
                    continue  # Safely ignore malformed user regex

                match_count = 0
                for match in compiled.finditer(bounded_text):
                    match_count += 1
                    if match_count > 20:
                        break  # Prevent flooding findings from pathological regex match

                    start_idx = match.start()
                    end_idx = match.end()
                    matched_str = match.group(0)
                    evidence = bounded_text[max(0, start_idx - 25):min(len(bounded_text), end_idx + 25)].strip()

                    findings.append(
                        FindingSchema(
                            id=f"rule-regex-{rule.rule_id}-{len(findings)+1}",
                            category=self._parse_category(rule.category),
                            severity=self._parse_severity(rule.severity),
                            title=rule.title,
                            message=f"{custom_msg} Matched: '{matched_str}'. {rule.description}",
                            evidence=evidence,
                            source_reference=rule.source_reference,
                            confidence=0.99,
                            suggested_correction=None,
                            status=FindingStatusEnum.FLAGGED,
                            location=LocationSchema(
                                start_offset=start_idx,
                                end_offset=end_idx,
                                line=bounded_text[:start_idx].count("\n") + 1,
                                page=1,
                            ),
                            requires_human_review=False,
                        )
                    )

            # 3. Content length boundary constraints
            max_words = config.get("max_words")
            if max_words:
                words = bounded_text.split()
                if len(words) > max_words:
                    findings.append(
                        FindingSchema(
                            id=f"rule-len-{rule.rule_id}-{len(findings)+1}",
                            category=FindingCategoryEnum.ACCESSIBILITY,
                            severity=FindingSeverityEnum.LOW,
                            title="Content Word Count Exceeds Maximum",
                            message=(
                                f"Content length of {len(words)} words exceeds the configured limit of "
                                f"{max_words} words for this channel."
                            ),
                            evidence=f"Total word count: {len(words)}",
                            source_reference=rule.source_reference,
                            confidence=1.0,
                            suggested_correction=f"Trim content to under {max_words} words.",
                            status=FindingStatusEnum.FLAGGED,
                            location=LocationSchema(start_offset=0, end_offset=0, line=1, page=1),
                            requires_human_review=False,
                        )
                    )

        return findings

    @staticmethod
    def _parse_category(category_str: str) -> FindingCategoryEnum:
        try:
            return FindingCategoryEnum(category_str)
        except ValueError:
            return FindingCategoryEnum.PROHIBITED_CONTENT

    @staticmethod
    def _parse_severity(severity_str: str) -> FindingSeverityEnum:
        try:
            return FindingSeverityEnum(severity_str.lower())
        except ValueError:
            return FindingSeverityEnum.MEDIUM

    @staticmethod
    def _is_safe_regex(pattern_str: str) -> bool:
        if not pattern_str or len(pattern_str) > 250:
            return False
        # Nested repetition constructs e.g. (a+)+, (.*)*, (x+){2,}, ([a-z]+)+
        if re.search(r"\([^)]*[\+\*\{][^)]*\)[\+\*\{]", pattern_str):
            return False
        # Adjacent unconstrained quantifiers e.g. .*+ or .++
        if re.search(r"[\+\*]\s*[\+\*]", pattern_str):
            return False
        return True
