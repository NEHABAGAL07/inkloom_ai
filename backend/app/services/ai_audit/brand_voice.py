"""Inkloom AI - Adaptive Brand Voice and Tone Analysis Module.

Evaluates content against versioned brand personality, tone, and audience standards.
Supports human feedback recording through an explicit, auditable mechanism without
uncontrolled modification of authoritative guidelines.
"""

import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.services.ai_audit.interface import BrandVoiceDimension, LearnedPreference, ContentContext


class BrandVoiceAnalyzer:
    """Analyzes text for enterprise brand voice, tone adherence, and stylistic standards."""

    def __init__(self, feedback_store: Optional[Dict[str, List[LearnedPreference]]] = None):
        # In-memory store for learned human reviewer preferences: org_id -> List[LearnedPreference]
        self._learned_preferences = feedback_store or {}

    def check(
        self,
        text: str,
        rules: List[RetrievedRule],
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        """Execute brand voice checks using configured guidelines and human feedback."""
        findings: List[FindingSchema] = []
        tone_rules = [r for r in rules if r.category == "tone_and_voice"]
        org_id = context.organization_id if context else "org-default"
        channel = context.channel if context else None
        target_audience = context.target_audience if context else None

        # Check against active learned preferences for this organization
        active_prefs = [
            p for p in self._learned_preferences.get(org_id, [])
            if p.is_active and p.preference_type == "tone_exception"
        ]
        ignored_patterns = {p.pattern.lower() for p in active_prefs}

        for rule in tone_rules:
            config = rule.rule_config
            colloquialisms = config.get("colloquialisms", [])
            replacements = config.get("suggested_replacements", {})

            for phrase in colloquialisms:
                # If reviewer approved this phrase as an exception for this org, skip
                if phrase.lower() in ignored_patterns:
                    continue

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

                    # Contextual tone advice based on channel/audience
                    channel_hint = f" for {channel} channel" if channel else ""
                    audience_hint = f" targeting {target_audience}" if target_audience else ""

                    finding = FindingSchema(
                        id=f"tone-{rule.rule_id}-{len(findings)+1}",
                        category=FindingCategoryEnum.TONE_AND_VOICE,
                        severity=FindingSeverityEnum(rule.severity.lower()),
                        title=rule.title,
                        message=(
                            f"Informal phrase '{matched_str}' deviates from enterprise brand voice{channel_hint}{audience_hint}. "
                            f"{rule.description}"
                        ),
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
                        requires_human_review=False,  # Stylistic tone preference
                    )
                    findings.append(finding)

        return findings

    def record_reviewer_feedback(
        self,
        organization_id: str,
        rule_key: str,
        pattern: str,
        approved_by: str,
        reason: str,
        replacement: Optional[str] = None,
    ) -> LearnedPreference:
        """
        Record verified reviewer feedback into learned preferences.
        Requires explicit human reviewer/admin authorization.
        """
        pref_id = f"pref-{int(datetime.now(timezone.utc).timestamp())}"
        pref = LearnedPreference(
            preference_id=pref_id,
            organization_id=organization_id,
            rule_key=rule_key,
            preference_type="tone_exception",
            pattern=pattern,
            replacement=replacement,
            approved_by=approved_by,
            approved_at=datetime.now(timezone.utc),
            is_active=True,
            reason=reason,
        )
        if organization_id not in self._learned_preferences:
            self._learned_preferences[organization_id] = []
        self._learned_preferences[organization_id].append(pref)
        return pref

    def rollback_learned_preference(self, organization_id: str, preference_id: str) -> bool:
        """Rollback or disable a learned tone preference."""
        prefs = self._learned_preferences.get(organization_id, [])
        for p in prefs:
            if p.preference_id == preference_id:
                p.is_active = False
                return True
        return False
