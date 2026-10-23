"""
Brand Terminology and Lexicon Checker

Validates content against approved terminology, trademark capitalization,
deprecated legacy names, and prohibited buzzwords.
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

DEFAULT_TERMINOLOGY_DICTIONARY = [
    {
        "term": "Inkloom Cloud Suite",
        "replacement": "Inkloom Governance Hub",
        "severity": FindingSeverity.HIGH,
        "title": "Deprecated Product Portfolio Name",
        "message": "Product rebranding Q1 2026 retired 'Inkloom Cloud Suite'. Use 'Inkloom Governance Hub'.",
        "rationale": "Ensures consistency with registered 2026 trademark and market catalog.",
        "rule_name": "Product Naming Architecture",
        "section": "Section 2.1: Brand Portfolio Registry",
    },
    {
        "term": "inkloom",  # all lowercase without proper casing
        "replacement": "Inkloom AI",
        "severity": FindingSeverity.LOW,
        "title": "Improper Brand Capitalization",
        "message": "Brand identity mandates camel-case 'Inkloom' or full trademark 'Inkloom AI'.",
        "rationale": "Adheres to visual identity typography standards.",
        "rule_name": "Trademark Typographic Standards",
        "section": "Section 2.3: Trademark Mechanics",
    },
    {
        "term": "guaranteed zero errors",
        "replacement": "engineered for high precision governance",
        "severity": FindingSeverity.CRITICAL,
        "title": "Prohibited Absolute Liability Term",
        "message": "Legal policy strictly forbids warranty guarantees of 'zero errors' in AI software marketing.",
        "rationale": "Prevents breach of commercial warranty terms and liability exposure.",
        "rule_name": "Commercial Warranty Disclaimers",
        "section": "Legal & Risk Addendum A-2",
    },
]


class TerminologyChecker:
    @staticmethod
    def check(text: str, custom_terms: List[Dict[str, Any]] = None) -> List[Finding]:
        findings: List[Finding] = []
        dictionary = list(DEFAULT_TERMINOLOGY_DICTIONARY)
        if custom_terms:
            dictionary.extend(custom_terms)

        counter = 1
        for item in dictionary:
            target_term = item["term"]
            # Word boundary regex search
            pattern = rf"\b{re.escape(target_term)}\b"
            flags = 0 if target_term == "inkloom" else re.IGNORECASE
            regex = re.compile(pattern, flags)

            for match in regex.finditer(text):
                finding = Finding(
                    id=f"find_term_{counter:03d}",
                    category=FindingCategory.TERMINOLOGY,
                    severity=item["severity"],
                    title=item["title"],
                    message=item["message"],
                    evidence=match.group(0),
                    source_reference=SourceReference(
                        rule_name=item["rule_name"],
                        section=item["section"],
                        verification_status=VerificationStatus.VERIFIED,
                        is_external=False,
                    ),
                    confidence=0.99,
                    suggested_correction=SuggestedCorrection(
                        replacement_text=item["replacement"],
                        rationale=item["rationale"],
                        preserves_intent=True,
                    ),
                    status=FindingStatus.OPEN,
                    location=FindingLocation(
                        start_char=match.start(),
                        end_char=match.end(),
                    ),
                    requires_human_review=item["severity"] == FindingSeverity.CRITICAL,
                )
                findings.append(finding)
                counter += 1

        return findings
