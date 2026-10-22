"""AI Audit Engine - Tone and Voice Analysis Module."""

import re
from typing import List, Dict, Any, Optional
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule


class ToneAnalyzer:
    """Analyzes text for brand voice adherence, colloquialisms, and stylistic standards."""

    def check(self, text: str, rules: List[RetrievedRule]) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        tone_rules = [r for r in rules if r.category == "tone_and_voice"]

        for rule in tone_rules:
            config = rule.rule_config
            colloquialisms = config.get("colloquialisms", [])
            replacements = config.get("suggested_replacements", {})

            for phrase in colloquialisms:
                pattern = re.compile(rf"\b{re.escape(phrase)}\b", re.IGNORECASE)
                for match in pattern.finditer(text):
                    matched_str = match.group(0)
                    start_idx = match.start()
                    end_idx = match.end()
                    line_num = text[:start_idx].count("\n") + 1

                    context_start = max(0, start_idx - 25)
                    context_end = min(len(text), end_idx + 25)
                    evidence_snippet = text[context_start:context_end].strip()

                    suggested_word = replacements.get(phrase.lower())
                    suggested_text = None
                    if suggested_word:
                        suggested_text = text[:start_idx] + suggested_word + text[end_idx:]

                    finding = FindingSchema(
                        id=f"tone-{rule.rule_id}-{len(findings)+1}",
                        category=FindingCategoryEnum.TONE_AND_VOICE,
                        severity=FindingSeverityEnum(rule.severity.lower()),
                        title=rule.title,
                        message=f"Informal phrase '{matched_str}' deviates from enterprise brand voice. {rule.description}",
                        evidence=evidence_snippet,
                        source_reference=rule.source_reference,
                        confidence=0.89,
                        suggested_correction=suggested_text,
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
