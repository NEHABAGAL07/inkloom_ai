"""AI Audit Engine - Guideline Retrieval Module.

Matches and prioritizes relevant brand guidelines and rules against content characteristics.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class RetrievedRule:
    """Represents a rule retrieved for evaluation."""
    rule_id: str
    guideline_id: str
    category: str
    title: str
    description: str
    severity: str
    rule_config: Dict[str, Any] = field(default_factory=dict)
    source_reference: Optional[str] = None


class GuidelineRetriever:
    """Retrieves relevant brand guidelines based on category or content scope."""

    def __init__(self, default_guidelines: Optional[List[Dict[str, Any]]] = None):
        self._guidelines = default_guidelines or self._get_default_brand_rules()

    def get_rules_for_content(
        self,
        content_type: str = "text",
        requested_categories: Optional[List[str]] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
    ) -> List[RetrievedRule]:
        """Fetch active rules matching content type and requested categories."""
        rules_pool = list(self._guidelines)
        if custom_rules:
            rules_pool.extend(custom_rules)

        retrieved: List[RetrievedRule] = []
        for r in rules_pool:
            category = r.get("category", "")
            if requested_categories and category not in requested_categories:
                continue

            retrieved.append(
                RetrievedRule(
                    rule_id=r.get("rule_id", "rule-unknown"),
                    guideline_id=r.get("guideline_id", "gd-default"),
                    category=category,
                    title=r.get("title", "Untitled Rule"),
                    description=r.get("description", ""),
                    severity=r.get("severity", "medium"),
                    rule_config=r.get("rule_config", {}),
                    source_reference=r.get("source_reference"),
                )
            )
        return retrieved

    @staticmethod
    def _get_default_brand_rules() -> List[Dict[str, Any]]:
        """Built-in baseline guidelines for Inkloom brand governance."""
        return [
            # Terminology Rules
            {
                "rule_id": "rule-term-001",
                "guideline_id": "gd-brand-voice",
                "category": "terminology",
                "title": "Brand Name Capitalization & Casing",
                "description": "The brand name must always be spelled 'Inkloom AI' or 'Inkloom', never 'inkloom' or 'InkLoom'.",
                "severity": "medium",
                "source_reference": "Brand Identity Guidelines v2.4, Section 3.1: Naming & Trademarks",
                "rule_config": {
                    "forbidden_variants": ["inkloom", "InkLoom", "Ink-loom", "inkloom ai"],
                    "preferred_term": "Inkloom AI",
                },
            },
            {
                "rule_id": "rule-term-002",
                "guideline_id": "gd-brand-voice",
                "category": "terminology",
                "title": "Proprietary Terminology Enforcement",
                "description": "Use 'Brand Governance Platform' instead of 'brand checking tool'.",
                "severity": "low",
                "source_reference": "Brand Identity Guidelines v2.4, Section 3.2: Vocabulary",
                "rule_config": {
                    "forbidden_variants": ["brand checking tool", "brand checker script", "copy checker"],
                    "preferred_term": "Brand Governance Platform",
                },
            },
            # Tone & Voice Rules
            {
                "rule_id": "rule-tone-001",
                "guideline_id": "gd-brand-voice",
                "category": "tone_and_voice",
                "title": "Avoid Hyperbolic and Colloquial Language",
                "description": "Enterprise communications must maintain an authoritative, professional, and confident tone. Avoid hyperbole.",
                "severity": "low",
                "source_reference": "Editorial Voice & Tone Standard v1.2, Principle 2: Authoritative yet Accessible",
                "rule_config": {
                    "colloquialisms": ["super pumped", "game changer", "revolutionary", "literally insane", "crazy good"],
                    "suggested_replacements": {
                        "super pumped": "proud",
                        "game changer": "significant advancement",
                        "revolutionary": "innovative",
                        "literally insane": "remarkable",
                        "crazy good": "exceptional",
                    },
                },
            },
            # Claim Verification Rules
            {
                "rule_id": "rule-claim-001",
                "guideline_id": "gd-legal-claims",
                "category": "claim_verification",
                "title": "Absolute Superlative & Guarantee Claims",
                "description": "Claims promising 100% guarantees, zero errors, or undisputed market leadership must be substantiated by empirical entries in the claim registry.",
                "severity": "high",
                "source_reference": "Legal & Regulatory Compliance Manual v3.0, Section 4: Substantiation Standards",
                "rule_config": {
                    "superlative_patterns": [
                        r"\b100%\s+error-free\b",
                        r"\bzero\s+errors\b",
                        r"\bundisputed\s+leader\b",
                        r"\bguaranteed\s+protection\b",
                        r"\b#1\s+platform\b",
                    ],
                },
            },
        ]
