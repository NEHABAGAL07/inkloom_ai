"""AI Audit Engine - Terminology and Brand Vocabulary Checker."""

import re
from typing import List, Dict, Any, Optional
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule


class TerminologyChecker:
    """Checks content against prohibited phrases, trademark casing, and preferred terms."""

    def check(self, text: str, rules: List[RetrievedRule]) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        term_rules = [r for r in rules if r.category == "terminology"]

        for rule in term_rules:
            config = rule.rule_config
            forbidden_variants = config.get("forbidden_variants", [])
            preferred_term = config.get("preferred_term")

            for variant in forbidden_variants:
                # Word boundary match, case-sensitive if needed or case-insensitive
                pattern = re.compile(rf"\b{re.escape(variant)}\b", re.IGNORECASE)
                for match in pattern.finditer(text):
                    matched_str = match.group(0)
                    # If this rule specifically enforces case sensitivity and exact match is identical to preferred, skip
                    if preferred_term and matched_str == preferred_term:
                        continue

                    start_idx = match.start()
                    end_idx = match.end()
                    line_num = text[:start_idx].count("\n") + 1

                    # Extract snippet context for evidence
                    context_start = max(0, start_idx - 30)
                    context_end = min(len(text), end_idx + 30)
                    evidence_snippet = text[context_start:context_end].strip()

                    # Construct suggestion
                    suggested_replacement = None
                    if preferred_term:
                        suggested_replacement = text[:start_idx] + preferred_term + text[end_idx:]

                    finding = FindingSchema(
                        id=f"term-{rule.rule_id}-{len(findings)+1}",
                        category=FindingCategoryEnum.TERMINOLOGY,
                        severity=FindingSeverityEnum(rule.severity.lower()),
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
