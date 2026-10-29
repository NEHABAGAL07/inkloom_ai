"""
Deterministic Audit Stage Module
Stage 6:
Executes fast, non-hallucinatory evaluation across:
- Deprecated brand product names & trademark typography
- Prohibited terminology and words to avoid from published brand profile
- Explicit absolute warranty liability phrases (e.g. 'guaranteed zero errors')
- Contradicted physical/architectural limits
- Unverified promotional multipliers and superlatives
- Mandatory compliance disclosures
"""
import re
import uuid
from typing import List, Dict, Any, Optional

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
from app.services.ai_audit.terminology import TerminologyChecker
from app.services.ai_audit.claim_checking import ClaimVerifier


class DeterministicChecker:
    """Executes rule-bound, deterministic pattern matching for explicit governance rules."""

    @classmethod
    def evaluate(
        cls,
        text: str,
        guideline_version: str = "1.0.0",
        guideline_profile: Optional[Dict[str, Any]] = None,
        custom_terms: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Finding]:
        findings: List[Finding] = []

        # 1. Terminology and Trademark checks
        term_findings = TerminologyChecker.check(text=text, custom_terms=custom_terms)
        for tf in term_findings:
            tf.rule_reference = tf.source_reference.rule_name if tf.source_reference else "Terminology Rules"
            tf.evidence_status = "contradicted" if tf.severity == FindingSeverity.CRITICAL else "unverified"
            findings.append(tf)

        # 2. Fact and Claim checks (distinguishing unverified from contradicted)
        claim_findings = ClaimVerifier.verify(text=text)
        for cf in claim_findings:
            cf.rule_reference = cf.source_reference.rule_name if cf.source_reference else "Claim Verification"
            cf.evidence_status = (
                "contradicted" if cf.source_reference and cf.source_reference.verification_status == VerificationStatus.CONTRADICTED
                else "unverified"
            )
            findings.append(cf)

        # 3. Dynamic Evaluation against Published Brand Profile Guidelines
        if guideline_profile:
            voice_data = guideline_profile.get("voice", {})

            # A. Words to Avoid
            words_to_avoid = voice_data.get("words_to_avoid", [])
            for word in words_to_avoid:
                if not word or not str(word).strip():
                    continue
                w_str = str(word).strip()
                pattern = rf"\b{re.escape(w_str)}\b"
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    findings.append(
                        Finding(
                            id=f"find_term_avoid_{uuid.uuid4().hex[:8]}",
                            category=FindingCategory.TERMINOLOGY,
                            severity=FindingSeverity.HIGH,
                            title=f"Forbidden Brand Vocabulary: '{match.group(0)}'",
                            message=(
                                f"The term '{match.group(0)}' violates published brand voice rules. "
                                f"Published Brand Guidelines (v{guideline_version}) explicitly prohibit this phrasing."
                            ),
                            evidence=match.group(0),
                            original_text=match.group(0),
                            source_reference=SourceReference(
                                guideline_id=f"guideline_v{guideline_version}",
                                section="Brand Voice: Words to Avoid",
                                rule_name="Forbidden Brand Vocabulary",
                                verification_status=VerificationStatus.CONTRADICTED,
                            ),
                            confidence=0.98,
                            suggested_correction=SuggestedCorrection(
                                replacement_text="Replace with approved brand vocabulary",
                                rationale="Adheres to published brand communication guidelines.",
                                preserves_intent=True,
                            ),
                            status=FindingStatus.OPEN,
                            requires_human_review=False,
                            location=FindingLocation(start_char=match.start(), end_char=match.end()),
                            rule_reference="Forbidden Brand Vocabulary",
                            evidence_status="contradicted",
                        )
                    )

            # B. Prohibited Copy Examples
            prohibited_copy = voice_data.get("prohibited_copy_examples", [])
            for ex in prohibited_copy:
                snippet = ex.get("text", "")
                if snippet and snippet.lower() in text.lower():
                    start_pos = text.lower().find(snippet.lower())
                    end_pos = start_pos + len(snippet)
                    findings.append(
                        Finding(
                            id=f"find_copy_prohib_{uuid.uuid4().hex[:8]}",
                            category=FindingCategory.TONE_VOICE,
                            severity=FindingSeverity.HIGH,
                            title="Prohibited Messaging Phrasing Detected",
                            message=f"Disallowed copy pattern detected: '{snippet}'. Reason: {ex.get('reason', 'Contradicts brand positioning.')}",
                            evidence=snippet,
                            original_text=snippet,
                            source_reference=SourceReference(
                                guideline_id=f"guideline_v{guideline_version}",
                                section="Voice & Communication: Prohibited Examples",
                                rule_name="Prohibited Messaging Patterns",
                                verification_status=VerificationStatus.CONTRADICTED,
                            ),
                            confidence=0.95,
                            suggested_correction=SuggestedCorrection(
                                replacement_text="Refer to approved copy examples in Brand Guidelines",
                                rationale="Aligns messaging with corporate tone guidelines.",
                                preserves_intent=True,
                            ),
                            status=FindingStatus.OPEN,
                            requires_human_review=True,
                            location=FindingLocation(start_char=start_pos, end_char=end_pos),
                            rule_reference="Prohibited Messaging Patterns",
                            evidence_status="contradicted",
                        )
                    )

            # C. Brand Policy & Common Mistakes
            dos_donts = guideline_profile.get("dos_and_donts", [])
            for rule in dos_donts:
                if rule.get("type") in ["prohibited", "common_mistake"]:
                    title_keywords = [w.lower() for w in rule.get("title", "").split() if len(w) > 4]
                    if any(kw in text.lower() for kw in title_keywords):
                        severity_str = rule.get("priority", "medium").lower()
                        sev = FindingSeverity.MEDIUM
                        if severity_str == "critical":
                            sev = FindingSeverity.CRITICAL
                        elif severity_str == "high":
                            sev = FindingSeverity.HIGH

                        findings.append(
                            Finding(
                                id=f"find_dodont_{rule.get('id', uuid.uuid4().hex[:8])}",
                                category=FindingCategory.EDITORIAL_STANDARDS,
                                severity=sev,
                                title=f"Brand Policy Check: {rule.get('title')}",
                                message=rule.get("description", "Violates published brand policy rules."),
                                evidence=rule.get("title"),
                                original_text=rule.get("title"),
                                source_reference=SourceReference(
                                    guideline_id=f"guideline_v{guideline_version}",
                                    section="General Brand Do's and Don'ts",
                                    rule_name=rule.get("title", "Governance Rule"),
                                    verification_status=VerificationStatus.VERIFIED,
                                ),
                                confidence=0.90,
                                status=FindingStatus.OPEN,
                                requires_human_review=sev in [FindingSeverity.CRITICAL, FindingSeverity.HIGH],
                                rule_reference=rule.get("title", "Governance Rule"),
                                evidence_status="verified",
                            )
                        )

            # D. Mandatory Compliance Disclosures
            compliance_rules = guideline_profile.get("compliance", [])
            for comp in compliance_rules:
                if comp.get("requirement_level") == "mandatory":
                    rule_text = comp.get("rule_text", "")
                    # If content makes promotional guarantees but omits mandatory disclaimer
                    if len(text) > 80 and any(w in text.lower() for w in ["guarantee", "warranty", "liability", "100%", "promise"]):
                        if rule_text.lower() not in text.lower():
                            findings.append(
                                Finding(
                                    id=f"find_comp_req_{comp.get('id', uuid.uuid4().hex[:8])}",
                                    category=FindingCategory.LEGAL_COMPLIANCE,
                                    severity=FindingSeverity.HIGH,
                                    title=f"Missing Mandatory Disclosure: {comp.get('title')}",
                                    message=f"Promotional statements require mandatory disclosure statement: '{rule_text}'.",
                                    evidence="Mandatory disclosure omitted from submitted text",
                                    original_text=None,
                                    source_reference=SourceReference(
                                        guideline_id=f"guideline_v{guideline_version}",
                                        section="Mandatory Compliance & Disclosures",
                                        rule_name=comp.get("title", "Mandatory Disclaimer"),
                                        verification_status=VerificationStatus.UNVERIFIED,
                                    ),
                                    confidence=0.94,
                                    suggested_correction=SuggestedCorrection(
                                        replacement_text=rule_text,
                                        rationale="Adds required statutory disclosure mandated by enterprise compliance policy.",
                                        preserves_intent=True,
                                    ),
                                    status=FindingStatus.OPEN,
                                    requires_human_review=True,
                                    rule_reference=comp.get("title", "Mandatory Disclaimer"),
                                    evidence_status="unverified",
                                )
                            )

        return findings
