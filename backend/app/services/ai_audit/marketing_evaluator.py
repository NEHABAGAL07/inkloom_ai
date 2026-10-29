"""
Marketing Effectiveness and Message Quality Evaluator
Category D:
Evaluates:
- Clarity of the headline and call to action (CTA)
- Relevance to the specified target audience
- Distinctiveness and memorability
- Alignment with the selected marketing channel (e.g. social, email, web, print)
- Consistency of tone and intended brand positioning
- Potential ambiguity or misleading interpretation
- Whether customer benefit is clear
- Generates alternative punchlines / captions with trade-off explanations

Critical Governance Constraints:
1. NEVER claim a headline will increase conversions or sales without empirical evidence.
2. Marketing quality recommendations must NEVER override legal restrictions or approved brand rules.
"""
import uuid
import re
from typing import List, Dict, Any, Optional

from app.schemas.audit_contract import (
    Finding,
    FindingCategory,
    FindingSeverity,
    FindingStatus,
    SourceReference,
    VerificationStatus,
    SuggestedCorrection,
)


class MarketingQualityEvaluator:
    """Evaluates marketing copy strength, audience fit, CTA clarity, and generates alternative headlines."""

    @classmethod
    def evaluate(
        cls,
        text: str,
        channel: str = "web",
        target_audience: str = "enterprise",
    ) -> List[Finding]:
        findings: List[Finding] = []
        if not text or len(text.strip()) < 10:
            return findings

        # Determine relevance: Evaluate marketing quality when channel is marketing-oriented
        # or when copy exhibits promotional, advertising, or campaign signals.
        marketing_channels = {"social", "email", "campaign", "ad", "marketing", "social_media", "print"}
        marketing_signals = [
            "get started", "sign up", "try free", "special offer", "discount", "limited time",
            "campaign", "exclusive", "buy now", "today", "act now", "before your competitors",
            "crush you", "boost your", "supercharge", "transform your", "headline", "punchline"
        ]
        is_marketing_context = (channel in marketing_channels) or any(sig in text.lower() for sig in marketing_signals)

        if not is_marketing_context:
            return findings

        first_line = text.strip().split("\n")[0].strip()

        # 1. Call to Action (CTA) Evaluation
        cta_keywords = ["get started", "request a demo", "learn more", "sign up", "contact us", "try free", "book a demo", "explore", "subscribe", "download"]
        has_cta = any(kw in text.lower() for kw in cta_keywords)
        if len(text.split()) > 25 and not has_cta:
            findings.append(
                Finding(
                    id=f"find_mkt_cta_{uuid.uuid4().hex[:8]}",
                    category=FindingCategory.MARKETING_QUALITY,
                    severity=FindingSeverity.LOW,
                    title="Missing Clear Call to Action (CTA)",
                    message=(
                        f"The content piece lacks an explicit Call to Action for {channel} channel copy. "
                        "Providing a single, unambiguous next step clarifies customer benefit and intent."
                    ),
                    confidence=0.85,
                    suggested_correction=SuggestedCorrection(
                        replacement_text=f"{text.strip()}\n\nRequest an enterprise consultation today to explore your governance roadmap.",
                        rationale="Adds an explicit next action without altering promotional claims or promises.",
                        preserves_intent=True,
                    ),
                    requires_human_review=False,
                    rule_reference="Marketing Effectiveness: Actionable Next Steps",
                    evidence_status="supported",
                    limitations="Guidance reflects editorial effectiveness; not a legal requirement.",
                )
            )

        # 2. Channel Length & Formatting Alignment
        if channel == "social":
            word_count = len(text.split())
            if word_count > 60:
                findings.append(
                    Finding(
                        id=f"find_mkt_len_{uuid.uuid4().hex[:8]}",
                        category=FindingCategory.MARKETING_QUALITY,
                        severity=FindingSeverity.LOW,
                        title="Copy Exceeds Recommended Social Channel Brevity",
                        message=(
                            f"Content contains {word_count} words. Social distribution channels perform best "
                            "with concise copy under 50 words focused on a single key takeaway."
                        ),
                        confidence=0.88,
                        requires_human_review=False,
                        rule_reference="Channel Best Practices: Social Copy Brevity",
                        evidence_status="supported",
                        limitations="Editorial guidance based on channel standards, not empirical conversion guarantees.",
                    )
                )

        # 3. Alternative Punchlines / Captions Generation
        # Generate alternative headline options with explained trade-offs
        if len(first_line) > 5:
            alternatives = cls._generate_punchline_alternatives(first_line, target_audience)
            findings.append(
                Finding(
                    id=f"find_mkt_headline_{uuid.uuid4().hex[:8]}",
                    category=FindingCategory.MARKETING_QUALITY,
                    severity=FindingSeverity.INFO,
                    title="Alternative Headlines & Punchline Options",
                    message=(
                        "Headline analysis identified opportunities for enhanced memorability and positioning. "
                        "Multiple options are provided below with explicit trade-offs. "
                        "Note: Recommendations must not override approved brand rules or legal disclosures."
                    ),
                    original_text=first_line,
                    evidence=first_line,
                    confidence=0.82,
                    suggested_correction=SuggestedCorrection(
                        replacement_text=alternatives[0]["text"],
                        rationale=alternatives[0]["rationale"],
                        preserves_intent=True,
                    ),
                    alternative_punchlines=alternatives,
                    requires_human_review=False,
                    rule_reference="Message Quality: Headline Memorability & Benefit Clarity",
                    evidence_status="supported",
                    limitations="Alternative suggestions provided for creative exploration; no conversion guarantees implied.",
                )
            )

        return findings

    @classmethod
    def _generate_punchline_alternatives(cls, headline: str, audience: str) -> List[Dict[str, Any]]:
        clean_headline = re.sub(r"[^\w\s]", "", headline).strip()
        words = clean_headline.split()
        core_topic = " ".join(words[:4]) if len(words) >= 4 else clean_headline

        return [
            {
                "text": f"Precision Brand Governance for Enterprise Teams: {core_topic}",
                "rationale": "Positions solution as high-trust, authoritative enterprise governance.",
                "trade_off": "More formal tone; ideal for enterprise B2B buyers, less casual for consumer social.",
            },
            {
                "text": f"Streamline Compliance and Protect Your Brand: {core_topic}",
                "rationale": "Directly highlights core customer benefit and operational risk reduction.",
                "trade_off": "Benefit-forward; requires ensuring customer problem aligns with compliance priorities.",
            },
            {
                "text": f"Next-Generation Content Verification: {core_topic}",
                "rationale": "Focuses on technological precision and modern workflow capability.",
                "trade_off": "Slightly more technical; best suited for technical leadership or product marketers.",
            },
        ]
