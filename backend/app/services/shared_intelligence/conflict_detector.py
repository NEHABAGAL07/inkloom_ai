"""
Conflict Detection & Rule Applicability Engine
Evaluates statutory, regulatory, and brand guideline conflicts across the 5-tier hierarchy:

Priority Levels:
1. LEGAL_MANDATORY: Statutory legislation & agency regulations (Highest - cannot be overridden)
2. LEGAL_POLICY: Board-approved internal legal policies & certified covenants
3. BRAND_STANDARD: Official brand identity, typography, voice, and color standards
4. CAMPAIGN_RULE: Media or channel-specific overrides
5. ADVISORY: Non-binding stylistic recommendations & editorial tips (Lowest)

Core Rule: Lower priority rules can NEVER silently override higher priority legal mandates.
All detected conflicts are returned for authorized human reviewer escalation.
"""
import uuid
from typing import List, Dict, Any, Optional
from app.schemas.ai_context import (
    BrandRuleContext,
    LegalSourceContext,
    RuleConflictDetail,
    ProvenanceRecord,
)
from app.schemas.knowledge import (
    RuleApplicability,
    RulePriorityType,
    KnowledgeSourceType,
    VerificationStatus,
)


class ConflictDetector:
    """
    Evaluates rule applicability and detects contradictory constraints
    between brand preferences and legal requirements.
    """

    @classmethod
    def evaluate_rule_applicability(
        cls,
        rule_def: Dict[str, Any],
        content_channels: List[str],
        target_channel: Optional[str] = None,
        target_jurisdiction: Optional[str] = "Global",
        rule_jurisdiction: Optional[str] = "Global",
    ) -> tuple[RuleApplicability, str]:
        """
        Determines if a rule applies to the specified channel and jurisdiction.
        Returns (Applicability, Reason).
        """
        # 1. Jurisdiction check
        jurisdiction_match = (
            rule_jurisdiction == "Global"
            or target_jurisdiction == "Global"
            or (rule_jurisdiction and target_jurisdiction and rule_jurisdiction.lower() == target_jurisdiction.lower())
        )
        if not jurisdiction_match:
            return (
                RuleApplicability.NOT_APPLICABLE,
                f"Rule jurisdiction '{rule_jurisdiction}' does not apply to target jurisdiction '{target_jurisdiction}'.",
            )

        # 2. Channel check
        if target_channel and content_channels:
            if "*" not in content_channels and "all" not in content_channels:
                if target_channel.lower() not in [c.lower() for c in content_channels]:
                    return (
                        RuleApplicability.NOT_APPLICABLE,
                        f"Rule channels {content_channels} do not include target channel '{target_channel}'.",
                    )

        # 3. Completeness check
        if not rule_def:
            return (
                RuleApplicability.UNCERTAIN,
                "Rule definition contains insufficient parameters to determine conclusive applicability.",
            )

        return (RuleApplicability.APPLICABLE, "Rule applies to specified jurisdiction and content format.")

    @classmethod
    def detect_conflicts(
        cls,
        rules: List[BrandRuleContext],
        legal_sources: List[LegalSourceContext],
        draft_guideline_data: Optional[Dict[str, Any]] = None,
    ) -> List[RuleConflictDetail]:
        """
        Detects conflicts between rules and legal requirements.
        Preserves both sources and formats escalation for human review.
        """
        conflicts: List[RuleConflictDetail] = []

        # -------------------------------------------------------------
        # 1. Accessibility Contrast: Brand Color Palette vs WCAG 2.1 AA
        # -------------------------------------------------------------
        if draft_guideline_data:
            colors = draft_guideline_data.get("colors", {})
            contrast_rules = colors.get("contrast_rules", {})
            min_normal = contrast_rules.get("min_ratio_normal", 4.5)

            if min_normal < 4.5:
                conflicts.append(
                    RuleConflictDetail(
                        conflict_id=f"conf_wcag_{uuid.uuid4().hex[:8]}",
                        higher_priority_rule="W3C WCAG 2.1 AA Success Criterion 1.4.3 (4.5:1 Normal Text)",
                        higher_priority_level=1,
                        higher_priority_source="W3C Web Accessibility Initiative / Statutory Disability Standards",
                        lower_priority_rule=f"Brand Guideline Palette Minimum Contrast ({min_normal}:1)",
                        lower_priority_level=3,
                        lower_priority_source="Brand Color Specifications",
                        category="accessibility",
                        explanation=(
                            f"Brand guideline draft specifies {min_normal}:1 contrast ratio. "
                            "This violates the statutory WCAG 2.1 AA standard of 4.5:1. "
                            "Brand visual aesthetic preferences cannot override accessibility mandates."
                        ),
                        escalate_to_human=True,
                        remediation_suggestion="Increase minimum text contrast standard to at least 4.5:1.",
                    )
                )

        # -------------------------------------------------------------
        # 2. Inter-Rule Priority Conflicts (Level 1/2 vs Level 3/4/5)
        # -------------------------------------------------------------
        # Check for rules with opposing directives in the same category
        for i, rule_a in enumerate(rules):
            for rule_b in rules[i + 1 :]:
                if rule_a.category != rule_b.category:
                    continue

                # Check if one is legal mandatory and the other is lower priority brand rule
                if rule_a.priority_level != rule_b.priority_level:
                    higher, lower = (rule_a, rule_b) if rule_a.priority_level < rule_b.priority_level else (rule_b, rule_a)
                    
                    # Inspect forbidden vs allowed terminology or claim rules
                    def_h = higher.rule_definition or {}
                    def_l = lower.rule_definition or {}

                    h_forbidden = set(def_h.get("forbidden_terms", []))
                    l_preferred = set(def_l.get("preferred_terms", []) or def_l.get("words_to_use", []))

                    overlap = h_forbidden.intersection(l_preferred)
                    if overlap:
                        conflicts.append(
                            RuleConflictDetail(
                                conflict_id=f"conf_term_{uuid.uuid4().hex[:8]}",
                                higher_priority_rule=higher.rule_name,
                                higher_priority_level=higher.priority_level,
                                higher_priority_source=higher.provenance.title,
                                lower_priority_rule=lower.rule_name,
                                lower_priority_level=lower.priority_level,
                                lower_priority_source=lower.provenance.title,
                                category=higher.category,
                                explanation=(
                                    f"Higher priority rule '{higher.rule_name}' (Priority {higher.priority_level}) "
                                    f"prohibits terms {list(overlap)}, but lower priority rule '{lower.rule_name}' "
                                    f"(Priority {lower.priority_level}) marks them as preferred. "
                                    "Higher priority requirement must be upheld."
                                ),
                                escalate_to_human=True,
                                remediation_suggestion=f"Remove {list(overlap)} from preferred terms in {lower.rule_name}.",
                            )
                        )

        return conflicts
