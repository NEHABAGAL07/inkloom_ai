"""
Guideline Retrieval Module

Selects and ranks relevant brand guideline rules applicable to the given
content type, channel, and domain context.
"""
from typing import List, Dict, Any, Optional


class GuidelineRetriever:
    """
    Retrieves active guidelines. Works in-memory or can query persistent storage.
    Filters by content format (e.g. social, press release, technical documentation).
    """

    @staticmethod
    def filter_relevant_rules(
        rules: List[Dict[str, Any]],
        content_text: str,
        media_type: str = "text/plain",
        target_audience: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Filters a list of candidate rules against content traits.
        For baseline evaluation, returns all active rules tagged for the content type.
        """
        relevant: List[Dict[str, Any]] = []
        lower_content = content_text.lower()

        for rule in rules:
            rule_def = rule.get("rule_definition", {})
            applicable_media = rule_def.get("applicable_media", ["*"])

            # Check format matching
            matches_media = "*" in applicable_media or any(m in media_type for m in applicable_media)
            if not matches_media:
                continue

            # Check keyword relevance triggers if specified
            trigger_keywords = rule_def.get("trigger_keywords", [])
            if trigger_keywords:
                if any(kw.lower() in lower_content for kw in trigger_keywords):
                    relevant.append(rule)
            else:
                # Universal rule
                relevant.append(rule)

        return relevant
