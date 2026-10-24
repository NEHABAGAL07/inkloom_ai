"""
Enterprise Brand Guidelines & Compliance Starter Templates
Provides verified statutory, regulatory, and brand governance starter rules.

Important Governance Principles:
- Every legal rule is grounded in real statutory or standard references (e.g. FTC Act, Lanham Act, GDPR, WCAG 2.1).
- Unverified suggestions are explicitly labeled with verification_status='unverified_suggestion' or 'requires_legal_review'.
- This starter catalog is a decision-support baseline and does not constitute formal legal counsel.
"""
from typing import List, Dict, Any

STARTER_TEMPLATE_RULES: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # Category A: Brand Identity & Voice
    # -------------------------------------------------------------
    {
        "category": "terminology",
        "rule_name": "Trademark & Product Name Integrity",
        "rule_type": "brand_standard",
        "priority_level": 3,
        "jurisdiction": "Global",
        "industry": "General",
        "content_channels": ["all"],
        "authoritative_source": "Organization Brand Trademark & Style Standards",
        "source_url": "https://brand.inkloom.internal/standards/trademarks",
        "source_revision_date": "2025-11-01",
        "verification_status": "verified",
        "severity_default": "high",
        "requires_human_review": False,
        "description": "Registered trademarks and certified product terms must appear exactly as formatted in the approved product terminology dictionary.",
        "rule_definition": {
            "forbidden_terms": ["InkloomAI", "inkloom AI", "Ink-loom"],
            "approved_terms": ["Inkloom AI", "Inkloom Platform"],
        },
        "required_disclosure": None,
    },
    {
        "category": "tone_voice",
        "rule_name": "Professional & Consultative Tone Standard",
        "rule_type": "brand_standard",
        "priority_level": 3,
        "jurisdiction": "Global",
        "industry": "General",
        "content_channels": ["all"],
        "authoritative_source": "Enterprise Communications Style Guide",
        "source_url": None,
        "source_revision_date": "2025-06-15",
        "verification_status": "verified",
        "severity_default": "medium",
        "requires_human_review": False,
        "description": "Communications must maintain an authoritative, consultative, and evidence-based tone without sensationalist or hyperbolic language.",
        "rule_definition": {
            "formality_level": "professional",
            "forbidden_hyperboles": ["miracle", "foolproof", "infinite", "unbelievable"],
        },
        "required_disclosure": None,
    },

    # -------------------------------------------------------------
    # Category B: Advertising & Product Claims (Evidence Required)
    # -------------------------------------------------------------
    {
        "category": "claim_verification",
        "rule_name": "Objective Performance Claims Substantiation",
        "rule_type": "legal_mandatory",
        "priority_level": 1,
        "jurisdiction": "US",
        "industry": "General",
        "content_channels": ["web", "social", "advertising", "print"],
        "authoritative_source": "FTC Policy Statement on Deception (103 F.T.C. 110) & Substantiation Doctrine",
        "source_url": "https://www.ftc.gov/legal-library/browse/ftc-policy-statement-deception",
        "source_revision_date": "1983-10-14",
        "verification_status": "verified",
        "severity_default": "critical",
        "requires_human_review": True,
        "description": "Objective quantitative claims (e.g. latency, speed, efficiency, savings) require documented pre-existing scientific, technical, or benchmark substantiation.",
        "rule_definition": {
            "requires_prior_evidence": True,
            "claim_types": ["percentage_gain", "multiplier", "cost_reduction"],
        },
        "evidence_required": True,
        "evidence_description": "Controlled benchmark whitepaper or independent statistical audit report dated within the past 12 months.",
        "required_disclosure": "Results based on internal enterprise benchmark testing; individual operational results may vary.",
    },
    {
        "category": "claim_verification",
        "rule_name": "Comparative & Competitor Superiority Claims",
        "rule_type": "legal_mandatory",
        "priority_level": 1,
        "jurisdiction": "US",
        "industry": "General",
        "content_channels": ["all"],
        "authoritative_source": "Lanham Act § 43(a), 15 U.S.C. § 1125(a) & FTC Statement on Comparative Advertising (16 CFR § 14.15)",
        "source_url": "https://www.ftc.gov/legal-library/browse/rules/comparative-advertising",
        "source_revision_date": "1979-08-13",
        "verification_status": "verified",
        "severity_default": "critical",
        "requires_human_review": True,
        "description": "Named comparisons with competitors must be truthful, non-deceptive, and based on objectively verifiable head-to-head testing under identical parameters.",
        "rule_definition": {
            "require_competitor_head_to_head_study": True,
            "disallow_vague_superlatives": True,
        },
        "evidence_required": True,
        "evidence_description": "Third-party audit or certified comparative methodology report with test conditions and timestamp.",
        "required_disclosure": "Comparative metrics derived from public documentation as of publication date.",
    },

    # -------------------------------------------------------------
    # Category C: Consumer Transparency & Disclosures
    # -------------------------------------------------------------
    {
        "category": "legal_compliance",
        "rule_name": "Clear & Conspicuous Endorsement & Material Connection Disclosure",
        "rule_type": "legal_mandatory",
        "priority_level": 1,
        "jurisdiction": "US",
        "industry": "General",
        "content_channels": ["social", "video", "web", "email"],
        "authoritative_source": "FTC Guides Concerning the Use of Endorsements and Testimonials (16 CFR Part 255)",
        "source_url": "https://www.ftc.gov/legal-library/browse/rules/endorsement-guides",
        "source_revision_date": "2023-07-26",
        "verification_status": "verified",
        "severity_default": "critical",
        "requires_human_review": True,
        "description": "Material connections (financial, employment, sponsored, free product) between the brand and an endorser/influencer must be clearly and conspicuously disclosed.",
        "rule_definition": {
            "required_tags": ["#ad", "#sponsored", "Sponsored Partnership"],
            "disallowed_ambiguous_tags": ["#collab", "#partner", "#sp"],
        },
        "required_disclosure": "Paid partnership or sponsored promotion.",
    },
    {
        "category": "legal_compliance",
        "rule_name": "Promotional Pricing & Time-Limited Offer Limitations",
        "rule_type": "legal_policy",
        "priority_level": 2,
        "jurisdiction": "US",
        "industry": "E-Commerce",
        "content_channels": ["web", "social", "email"],
        "authoritative_source": "FTC Guides Against Deceptive Pricing (16 CFR Part 233)",
        "source_url": "https://www.ftc.gov/legal-library/browse/rules/guides-against-deceptive-pricing",
        "source_revision_date": "1964-01-08",
        "verification_status": "verified",
        "severity_default": "high",
        "requires_human_review": True,
        "description": "Discount percentages must be calculated against a genuine previous regular price at which goods were openly offered for a substantial period. Artificial countdowns or false scarcity are prohibited.",
        "rule_definition": {
            "require_original_price_disclosure": True,
            "prohibit_artificial_urgency": True,
        },
        "required_disclosure": "Offer valid through stated expiration date. Applies to eligible new accounts only.",
    },

    # -------------------------------------------------------------
    # Category D: Jurisdiction & Regulatory Compliance (EU/GDPR)
    # -------------------------------------------------------------
    {
        "category": "legal_compliance",
        "rule_name": "EU Transparent Privacy & Consent Notice",
        "rule_type": "legal_mandatory",
        "priority_level": 1,
        "jurisdiction": "EU",
        "industry": "General",
        "content_channels": ["web", "email"],
        "authoritative_source": "EU General Data Protection Regulation (Regulation (EU) 2016/679), Articles 13 & 14",
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679",
        "source_revision_date": "2016-04-27",
        "verification_status": "verified",
        "severity_default": "critical",
        "requires_human_review": True,
        "description": "Marketing lead forms and digital tracking in the European Economic Area require explicit legal basis declaration and accessible privacy policy links before submission.",
        "rule_definition": {
            "require_explicit_consent_checkbox": True,
            "require_privacy_link": True,
        },
        "required_disclosure": "By submitting, you agree to our Privacy Policy. You can unsubscribe at any time.",
    },

    # -------------------------------------------------------------
    # Category E: Privacy & Intellectual Property
    # -------------------------------------------------------------
    {
        "category": "legal_compliance",
        "rule_name": "Copyright & Licensed Visual Assets Clearance",
        "rule_type": "legal_policy",
        "priority_level": 2,
        "jurisdiction": "Global",
        "industry": "General",
        "content_channels": ["all"],
        "authoritative_source": "Enterprise Intellectual Property Licensing Guidelines",
        "source_url": None,
        "source_revision_date": "2025-01-15",
        "verification_status": "verified",
        "severity_default": "high",
        "requires_human_review": True,
        "description": "All imagery, illustrations, audio tracks, and fonts must possess valid, documented commercial enterprise licenses.",
        "rule_definition": {
            "require_commercial_license_id": True,
            "disallow_unlicensed_editorial_assets": True,
        },
        "evidence_required": True,
        "evidence_description": "Valid license invoice or asset management SKU.",
        "required_disclosure": None,
    },

    # -------------------------------------------------------------
    # Category F: Accessibility & Media Standards
    # -------------------------------------------------------------
    {
        "category": "accessibility",
        "rule_name": "W3C WCAG 2.1 AA Minimum Text Contrast Ratio (4.5:1)",
        "rule_type": "legal_mandatory",
        "priority_level": 1,
        "jurisdiction": "Global",
        "industry": "General",
        "content_channels": ["web", "social", "digital_ads"],
        "authoritative_source": "W3C Web Content Accessibility Guidelines (WCAG) 2.1, Success Criterion 1.4.3 Contrast (Minimum)",
        "source_url": "https://www.w3.org/TR/WCAG21/#contrast-minimum",
        "source_revision_date": "2018-06-05",
        "verification_status": "verified",
        "severity_default": "high",
        "requires_human_review": False,
        "description": "Text and images of text must have a contrast ratio of at least 4.5:1 against their background, except for large-scale text (at least 3:1) and incidental text.",
        "rule_definition": {
            "min_contrast_normal": 4.5,
            "min_contrast_large": 3.0,
        },
        "required_disclosure": None,
    },
    {
        "category": "accessibility",
        "rule_name": "Digital Imagery Informative Alt-Text Requirement",
        "rule_type": "legal_policy",
        "priority_level": 2,
        "jurisdiction": "Global",
        "industry": "General",
        "content_channels": ["web", "social", "email"],
        "authoritative_source": "W3C WCAG 2.1 Success Criterion 1.1.1 Non-text Content",
        "source_url": "https://www.w3.org/TR/WCAG21/#non-text-content",
        "source_revision_date": "2018-06-05",
        "verification_status": "verified",
        "severity_default": "medium",
        "requires_human_review": False,
        "description": "All informative non-text content presented to users must have a descriptive text alternative that serves the equivalent purpose.",
        "rule_definition": {
            "require_alt_text": True,
            "disallow_generic_alt": ["image", "photo", "graphic", "untitled"],
        },
        "required_disclosure": None,
    },
]


class GuidelineTemplateService:
    @classmethod
    def get_starter_templates(
        cls,
        jurisdiction: str = "all",
        industry: str = "all",
    ) -> List[Dict[str, Any]]:
        """Filters starter rules by jurisdiction and industry."""
        results = []
        for rule in STARTER_TEMPLATE_RULES:
            if jurisdiction != "all" and rule["jurisdiction"] not in [jurisdiction, "Global"]:
                continue
            if industry != "all" and rule["industry"] not in [industry, "General"]:
                continue
            results.append(rule)
        return results

    @classmethod
    def get_supported_scopes(cls) -> Dict[str, List[str]]:
        return {
            "jurisdictions": ["Global", "US", "EU", "UK"],
            "industries": ["General", "SaaS", "Fintech", "Healthcare", "E-Commerce"],
            "channels": ["all", "web", "social", "advertising", "email", "print", "video"],
            "categories": [
                "Brand Identity (Voice & Style)",
                "Advertising & Claims Substantiation",
                "Consumer Transparency & Disclosures",
                "Legal & Regulatory Compliance",
                "Privacy & Intellectual Property",
                "Accessibility & Media Standards",
            ],
        }
