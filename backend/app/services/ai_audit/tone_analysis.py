"""
Tone and Voice Analysis Module

Evaluates content text against designated brand voice pillars:
- Empowering vs. Fear-Inducing (FUD)
- Authoritative & Precise vs. Excessive Hype / Miracle claims
- Professional & Empathetic vs. Passive-Aggressive or Dismissive
"""
import re
from typing import List, Dict, Any
from app.schemas.audit_contract import (
    Finding,
    FindingCategory,
    FindingSeverity,
    FindingStatus,
    SourceReference,
    VerificationStatus,
    SuggestedCorrection,
    FindingLocation,
)

# Standard deterministic patterns for anti-brand tone
TONE_PATTERNS = [
    {
        "id": "tone_fud_01",
        "pattern": r"\b(before your competitors crush you|or face utter ruin|act now or perish|before it'?s too late)\b",
        "severity": FindingSeverity.MEDIUM,
        "title": "Fear-Inducing (FUD) Tone Detected",
        "message": "Brand guidelines emphasize empowering and forward-looking messaging rather than fear or coercion.",
        "replacement": "to stay ahead as industry standards evolve",
        "rationale": "Focuses on positive empowerment instead of fear-based motivation.",
        "rule_name": "Anti-FUD Brand Pillar",
        "section": "Section 1.2: Brand Voice & Persona",
        "confidence": 0.90,
    },
    {
        "id": "tone_hyperbole_02",
        "pattern": r"\b(miracle solution|100% infallible|magic bullet|revolutionary breakthrough that destroys competitors)\b",
        "severity": FindingSeverity.HIGH,
        "title": "Unsubstantiated Hyperbolic Language",
        "message": "Claims asserting 'miracle' or 'infallible' capability undermine enterprise credibility and violate tone rules.",
        "replacement": "rigorously tested governance solution",
        "rationale": "Substitutes exaggerated superlatives with professional, evidence-oriented phrasing.",
        "rule_name": "Credibility & Precision Standard",
        "section": "Section 1.4: Professional Claims",
        "confidence": 0.95,
    },
    {
        "id": "tone_condescending_03",
        "pattern": r"\b(obviously you wouldn'?t understand|as anyone with basic intelligence knows|it is simple enough even for you)\b",
        "severity": FindingSeverity.CRITICAL,
        "title": "Condescending or Dismissive Tone",
        "message": "Language speaks down to the customer, breaching our empathy and inclusivity pillars.",
        "replacement": "Here is a straightforward overview of how this works",
        "rationale": "Maintains respect and clear educational guidance.",
        "rule_name": "Respectful & Inclusive Communication",
        "section": "Section 1.1: Customer Empathy",
        "confidence": 0.98,
    },
]


class ToneAnalyzer:
    @staticmethod
    def analyze(text: str, custom_rules: List[Dict[str, Any]] = None) -> List[Finding]:
        findings: List[Finding] = []
        counter = 1

        for item in TONE_PATTERNS:
            regex = re.compile(item["pattern"], re.IGNORECASE)
            for match in regex.finditer(text):
                excerpt = match.group(0)
                start_char = match.start()
                end_char = match.end()

                finding = Finding(
                    id=f"find_tone_{counter:03d}",
                    category=FindingCategory.TONE_VOICE,
                    severity=item["severity"],
                    title=item["title"],
                    message=item["message"],
                    evidence=excerpt,
                    source_reference=SourceReference(
                        rule_name=item["rule_name"],
                        section=item["section"],
                        verification_status=VerificationStatus.VERIFIED,
                        is_external=False,
                    ),
                    confidence=item["confidence"],
                    suggested_correction=SuggestedCorrection(
                        replacement_text=item["replacement"],
                        rationale=item["rationale"],
                        preserves_intent=True,
                    ),
                    status=FindingStatus.OPEN,
                    location=FindingLocation(
                        start_char=start_char,
                        end_char=end_char,
                    ),
                    requires_human_review=item["severity"] == FindingSeverity.CRITICAL,
                )
                findings.append(finding)
                counter += 1

        return findings
