"""
Rule Priority & Conflict Resolution Engine
Formalizes the 5-tier organizational governance hierarchy:

Priority Levels:
1. MANDATORY_LEGAL: Applicable statutory/regulatory legal requirements (Highest)
2. ORGANIZATION_LEGAL_POLICY: Board & organization-approved legal policies
3. BRAND_STANDARDS: Official brand identity & guidelines (Voice, Colors, Typography)
4. CAMPAIGN_RULES: Channel-specific or campaign-specific design rules
5. ADVISORY_RECOMMENDATIONS: Advisory AI suggestions & stylistic tips (Lowest)

Core Governance Principle:
- A lower-priority brand preference can NEVER override an applicable mandatory legal requirement.
- When conflicts arise, the engine identifies the conflicting rules, preserves sources,
  explains the priority hierarchy, and escalates to an authorized Legal Officer.
- Outputs are organizational decision-support recommendations, not an automated legal judgment.
"""
from typing import List, Dict, Any


PRIORITY_HIERARCHY = [
    {
        "level": 1,
        "name": "Mandatory Legal Requirements",
        "description": "Statutory legislation, government regulations, and public safety mandates (e.g. FTC Act §5, Lanham Act, GDPR, WCAG 2.1 AA). Cannot be overridden.",
    },
    {
        "level": 2,
        "name": "Organization Legal & Compliance Policies",
        "description": "Internal legal covenants, risk thresholds, approved disclaimers, and certified benchmarks established by legal officers.",
    },
    {
        "level": 3,
        "name": "Official Brand Standards",
        "description": "Approved brand voice, logo usage, color systems, typography standards, and official tone attributes.",
    },
    {
        "level": 4,
        "name": "Channel & Campaign Rules",
        "description": "Media-specific overrides (social media, print, digital display) and short-term promotional campaign guidelines.",
    },
    {
        "level": 5,
        "name": "Advisory Recommendations",
        "description": "AI-generated editorial suggestions, aesthetic readability tips, and discretionary copy improvements.",
    },
]


class ConflictResolver:
    @classmethod
    def evaluate_guideline_conflicts(
        cls,
        draft_data: Dict[str, Any],
        organization_rules: List[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Scans a working guideline draft against mandatory legal rules,
        highlighting any conflicts where brand preferences attempt to supersede higher-priority rules.
        """
        conflicts = []

        # -------------------------------------------------------------
        # 1. Color System vs WCAG AA Mandatory Contrast (4.5:1)
        # -------------------------------------------------------------
        colors = draft_data.get("colors", {})
        palette = colors.get("palette", [])
        contrast_rules = colors.get("contrast_rules", {})
        min_normal = contrast_rules.get("min_ratio_normal", 4.5)

        if min_normal < 4.5:
            conflicts.append({
                "rule_name": f"Configured Normal Contrast ({min_normal}:1)",
                "conflicting_with": "W3C WCAG 2.1 AA Success Criterion 1.4.3 (4.5:1 Minimum)",
                "category": "accessibility",
                "priority_high": "Priority 1 (Mandatory Legal / W3C WCAG 2.1)",
                "priority_low": "Priority 3 (Brand Color System)",
                "explanation": (
                    f"Brand guideline draft specifies a minimum contrast ratio of {min_normal}:1. "
                    "This is below the mandatory WCAG 2.1 AA standard of 4.5:1 for normal text. "
                    "Brand aesthetic preferences cannot override accessibility compliance mandates."
                ),
                "escalate_to_legal": True,
                "remediation_suggestion": "Elevate minimum text contrast standard to at least 4.5:1 for standard body text.",
            })

        # Check media-specific contrast overrides
        media_guidelines = draft_data.get("media_guidelines", {})
        for media_key, media_spec in media_guidelines.items():
            if not isinstance(media_spec, dict) or not media_spec.get("enabled", True):
                continue
            overrides = media_spec.get("overrides", {})
            if "contrast_ratio" in overrides and float(overrides["contrast_ratio"]) < 4.5:
                conflicts.append({
                    "rule_name": f"{media_key.replace('_', ' ').title()} Override Contrast ({overrides['contrast_ratio']}:1)",
                    "conflicting_with": "W3C WCAG 2.1 AA Contrast Mandate (4.5:1)",
                    "category": "accessibility",
                    "priority_high": "Priority 1 (Mandatory Legal)",
                    "priority_low": "Priority 4 (Channel/Media Override)",
                    "explanation": (
                        f"{media_key} override attempts to lower contrast to {overrides['contrast_ratio']}:1. "
                        "Media-specific styling overrides cannot waive legal accessibility requirements."
                    ),
                    "escalate_to_legal": True,
                    "remediation_suggestion": "Ensure contrast ratio in media overrides complies with the 4.5:1 AA standard.",
                })

        # -------------------------------------------------------------
        # 2. Voice/Tone vs FTC Claim Substantiation Doctrine
        # -------------------------------------------------------------
        voice = draft_data.get("voice", {})
        headline_prefs = str(voice.get("headline_preferences", "")).lower()
        cta_style = str(voice.get("cta_style", "")).lower()
        writing_style = str(voice.get("writing_style", "")).lower()

        unsubstantiated_terms = ["guaranteed #1", "world's only", "100% risk free", "unbeatable"]
        for term in unsubstantiated_terms:
            if term in headline_prefs or term in cta_style or term in writing_style:
                conflicts.append({
                    "rule_name": f"Permitted Superlative Tone: '{term}'",
                    "conflicting_with": "FTC Policy Statement on Deception & Substantiation (103 F.T.C. 110)",
                    "category": "claim_verification",
                    "priority_high": "Priority 1 (Mandatory Legal / FTC)",
                    "priority_low": "Priority 3 (Brand Voice Standards)",
                    "explanation": (
                        f"Brand guidelines encourage or permit absolute superlative phrasing ('{term}'). "
                        "Under federal advertising laws, absolute claims require documented, objective pre-existing substantiation. "
                        "Creative voice guidelines cannot authorize unsubstantiated claims."
                    ),
                    "escalate_to_legal": True,
                    "remediation_suggestion": f"Exclude '{term}' from approved brand copy patterns and qualify all comparative statements.",
                })

        # -------------------------------------------------------------
        # 3. Media Alt-Text vs WCAG 2.1 SC 1.1.1
        # -------------------------------------------------------------
        social = media_guidelines.get("social_media", {})
        if isinstance(social, dict):
            rules = social.get("mandatory_rules", [])
            prohibited = social.get("prohibited_elements", [])
            # If alt-text is omitted or marked optional in social rules
            has_alt_text_mandate = any("alt" in str(r).lower() for r in rules)
            if not has_alt_text_mandate:
                conflicts.append({
                    "rule_name": "Social Media Image Specifications",
                    "conflicting_with": "WCAG 2.1 AA Success Criterion 1.1.1 (Non-text Content)",
                    "category": "accessibility",
                    "priority_high": "Priority 1 (Mandatory Legal)",
                    "priority_low": "Priority 4 (Media Specification)",
                    "explanation": (
                        "Social media specification does not explicitly mandate descriptive alternative text (alt-text) "
                        "for published images. Digital non-text content requires descriptive alternatives."
                    ),
                    "escalate_to_legal": False,
                    "remediation_suggestion": "Add explicit alt-text requirement to Social Media mandatory rules list.",
                })

        # -------------------------------------------------------------
        # 4. Compliance Disclaimers Omission Check
        # -------------------------------------------------------------
        compliance_rules = draft_data.get("compliance", [])
        has_mandatory_disclaimer = any(
            c.get("requirement_level") == "mandatory" for c in compliance_rules
        )
        if not has_mandatory_disclaimer:
            conflicts.append({
                "rule_name": "Corporate Compliance Section",
                "conflicting_with": "Consumer Transparency & Clear Disclosures (FTC 16 CFR Part 255)",
                "category": "legal_compliance",
                "priority_high": "Priority 2 (Organization Legal Policy)",
                "priority_low": "Priority 3 (Brand Guidelines)",
                "explanation": (
                    "No mandatory disclaimers or legal disclosure statements are registered in this guideline draft. "
                    "Enterprise governance requires baseline disclaimers for promotional, comparative, or technical claims."
                ),
                "escalate_to_legal": True,
                "remediation_suggestion": "Incorporate statutory disclaimers covering material terms and benchmark testing conditions.",
            })

        return conflicts
