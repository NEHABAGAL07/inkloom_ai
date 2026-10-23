"""Inkloom AI - Content Quality, Readability, and Accessibility Checks Module.

Executes practical text-level readability, clarity, and accessibility checks:
- Sentence length and structural complexity
- Undefined acronyms
- Ambiguous calls to action
- Media accessibility verification (alt-text) when media metadata is present
"""

import re
from typing import List, Optional, Set
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.interface import ContentContext


class ContentQualityChecker:
    """Performs practical text-level readability and accessibility evaluations."""

    def check(
        self,
        text: str,
        context: Optional[ContentContext] = None,
    ) -> List[FindingSchema]:
        """Run content quality and accessibility checks."""
        findings: List[FindingSchema] = []

        # 1. Run-on / excessively long sentences (> 35 words)
        sentences = re.split(r"(?<=[.!?])\s+", text)
        running_offset = 0
        for sent in sentences:
            words = sent.split()
            if len(words) > 35:
                start_idx = text.find(sent, running_offset)
                if start_idx == -1:
                    start_idx = running_offset
                end_idx = start_idx + len(sent)
                findings.append(
                    FindingSchema(
                        id=f"qual-sentence-len-{len(findings)+1}",
                        category=FindingCategoryEnum.ACCESSIBILITY,
                        severity=FindingSeverityEnum.LOW,
                        title="Excessively Long Sentence Impairs Readability",
                        message=(
                            f"Sentence contains {len(words)} words. Long, uninterrupted sentences reduce "
                            f"comprehension across diverse audiences."
                        ),
                        evidence=sent[:80] + "..." if len(sent) > 80 else sent,
                        source_reference="Plain Language Guidelines, Principle 1: Keep Sentences Concise",
                        confidence=0.85,
                        suggested_correction="Break this long sentence into two or more focused statements.",
                        status=FindingStatusEnum.FLAGGED,
                        location=LocationSchema(
                            start_offset=start_idx,
                            end_offset=end_idx,
                            line=text[:start_idx].count("\n") + 1,
                            page=1,
                        ),
                        requires_human_review=False,
                    )
                )
            running_offset += len(sent) + 1

        # 2. Undefined acronyms (3 or more uppercase letters without introduction)
        # Match standalone uppercase words like "SaaS", "ROAS", "GDPR", etc.
        acronym_matches = re.finditer(r"\b([A-Z]{3,6})\b", text)
        defined_acronyms: Set[str] = set()
        # Find acronyms defined via "(ACRONYM)"
        for def_match in re.finditer(r"\(([A-Z]{3,6})\)", text):
            defined_acronyms.add(def_match.group(1))

        # Common universally understood technical / business acronyms to exclude
        universal_acronyms = {"AI", "API", "B2B", "B2C", "CEO", "CTO", "FAQ", "HTML", "PDF", "SLA", "SOC", "URL", "USA", "USD"}

        flagged_acronyms: Set[str] = set()
        for match in acronym_matches:
            acronym = match.group(1)
            if (
                acronym not in defined_acronyms
                and acronym not in universal_acronyms
                and acronym not in flagged_acronyms
            ):
                flagged_acronyms.add(acronym)
                start_idx = match.start()
                end_idx = match.end()
                findings.append(
                    FindingSchema(
                        id=f"qual-acronym-{len(findings)+1}",
                        category=FindingCategoryEnum.ACCESSIBILITY,
                        severity=FindingSeverityEnum.INFO,
                        title=f"Potentially Undefined Acronym: '{acronym}'",
                        message=(
                            f"Acronym '{acronym}' is used without an explicit introductory definition. "
                            f"Undefined jargon impairs accessibility for non-specialist audiences."
                        ),
                        evidence=match.group(0),
                        source_reference="Content Accessibility Standard, Section 2.3: Plain Terminology",
                        confidence=0.75,
                        suggested_correction=f"Define '{acronym}' on first mention, e.g., 'Full Term ({acronym})'.",
                        status=FindingStatusEnum.FLAGGED,
                        location=LocationSchema(
                            start_offset=start_idx,
                            end_offset=end_idx,
                            line=text[:start_idx].count("\n") + 1,
                            page=1,
                        ),
                        requires_human_review=False,
                    )
                )

        # 3. Ambiguous Call-To-Action (e.g. "click here")
        cta_pattern = re.compile(r"\b(click here|tap here|read more|learn more here)\b", re.IGNORECASE)
        for cta_match in cta_pattern.finditer(text):
            start_idx = cta_match.start()
            end_idx = cta_match.end()
            findings.append(
                FindingSchema(
                    id=f"qual-cta-{len(findings)+1}",
                    category=FindingCategoryEnum.ACCESSIBILITY,
                    severity=FindingSeverityEnum.LOW,
                    title="Ambiguous Non-Descriptive Call-To-Action",
                    message=(
                        f"Non-descriptive link text '{cta_match.group(0)}' violates accessibility guidelines. "
                        f"Screen readers require informative link text indicating destination."
                    ),
                    evidence=cta_match.group(0),
                    source_reference="Web Content Accessibility Guidelines (WCAG 2.1), Criterion 2.4.4: Link Purpose",
                    confidence=0.92,
                    suggested_correction="Replace generic phrase with destination-specific text, e.g., 'View compliance report'.",
                    status=FindingStatusEnum.FLAGGED,
                    location=LocationSchema(
                        start_offset=start_idx,
                        end_offset=end_idx,
                        line=text[:start_idx].count("\n") + 1,
                        page=1,
                    ),
                    requires_human_review=False,
                )
            )

        # 4. Media Accessibility checks if media metadata is present
        if context and context.media_metadata:
            meta = context.media_metadata
            if context.content_type in ("image", "document") and not meta.get("alt_text"):
                findings.append(
                    FindingSchema(
                        id=f"qual-media-alt-{len(findings)+1}",
                        category=FindingCategoryEnum.ACCESSIBILITY,
                        severity=FindingSeverityEnum.MEDIUM,
                        title="Missing Alternative Text for Visual Asset",
                        message="Submitted media asset lacks alternative text (alt text) for visually impaired users.",
                        evidence=None,
                        source_reference="WCAG 2.1, Guideline 1.1: Text Alternatives",
                        confidence=1.0,
                        suggested_correction="Add descriptive alt text describing the key information in this visual asset.",
                        status=FindingStatusEnum.FLAGGED,
                        location=LocationSchema(start_offset=0, end_offset=0, line=1, page=1),
                        requires_human_review=False,
                    )
                )

        return findings
