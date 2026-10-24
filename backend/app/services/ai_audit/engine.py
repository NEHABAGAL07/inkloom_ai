"""
AI Brand Governance Audit Engine

Callable entrypoint that coordinates guideline retrieval, tone analysis,
terminology compliance, claim verification, and published brand profile standards.
Produces validated AuditResult objects strictly adhering to the shared contract.
"""
import time
import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.audit_contract import (
    AuditResult,
    AuditSummary,
    EngineMetadata,
    OverallAuditStatus,
    Finding,
    FindingCategory,
    FindingSeverity,
    FindingStatus,
    SourceReference,
    SuggestedCorrection,
    VerificationStatus,
)
from app.services.ai_audit.guideline_retrieval import GuidelineRetriever
from app.services.ai_audit.tone_analysis import ToneAnalyzer
from app.services.ai_audit.terminology import TerminologyChecker
from app.services.ai_audit.claim_checking import ClaimVerifier


class AIAuditEngine:
    ENGINE_VERSION = "0.2.0-brand-governance"

    @classmethod
    def run_audit(
        cls,
        content_text: str,
        content_id: str,
        revision_id: Optional[str] = None,
        active_guidelines: Optional[List[Dict[str, Any]]] = None,
        media_type: str = "text/plain",
        context: Optional[Dict[str, Any]] = None,
        guideline_version: Optional[str] = None,
        guideline_profile: Optional[Dict[str, Any]] = None,
    ) -> AuditResult:
        """
        Executes complete brand governance audit pass on provided text and context,
        evaluating against the published brand guideline version and rules.
        """
        start_time = time.perf_counter()
        modules_executed: List[str] = []
        all_findings: List[Finding] = []

        g_version = guideline_version or "1.0.0"

        # 1. Guideline Retrieval
        modules_executed.append("guideline_retrieval")
        relevant_rules = []
        if active_guidelines:
            relevant_rules = GuidelineRetriever.filter_relevant_rules(
                rules=active_guidelines,
                content_text=content_text,
                media_type=media_type,
            )

        # 2. Terminology Checks (Base dictionary)
        modules_executed.append("terminology_checker")
        term_findings = TerminologyChecker.check(text=content_text)
        all_findings.extend(term_findings)

        # 3. Tone and Voice Analysis (Base analyzer)
        modules_executed.append("tone_analyzer")
        tone_findings = ToneAnalyzer.analyze(text=content_text)
        all_findings.extend(tone_findings)

        # 4. Fact and Claim Verification
        modules_executed.append("claim_verifier")
        claim_findings = ClaimVerifier.verify(text=content_text)
        all_findings.extend(claim_findings)

        # 5. Dynamic Evaluation against Published Brand Profile Guidelines
        if guideline_profile:
            modules_executed.append("published_brand_rules_evaluator")

            # A. Evaluate Forbidden Words from Brand Voice
            voice_data = guideline_profile.get("voice", {})
            words_to_avoid = voice_data.get("words_to_avoid", [])
            for word in words_to_avoid:
                if not word or not str(word).strip():
                    continue
                pattern = rf"\b{re.escape(str(word).strip())}\b"
                match = re.search(pattern, content_text, re.IGNORECASE)
                if match:
                    all_findings.append(
                        Finding(
                            id=f"find_term_avoid_{uuid.uuid4().hex[:8]}",
                            category=FindingCategory.TERMINOLOGY,
                            severity=FindingSeverity.HIGH,
                            title=f"Forbidden Brand Vocabulary: '{match.group(0)}'",
                            message=(
                                f"The term '{match.group(0)}' violates published brand voice rules. "
                                f"Published Brand Guidelines (v{g_version}) explicitly prohibit this phrasing."
                            ),
                            evidence=match.group(0),
                            source_reference=SourceReference(
                                guideline_id=f"guideline_v{g_version}",
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
                        )
                    )

            # B. Evaluate Prohibited Copy Examples
            prohibited_copy = voice_data.get("prohibited_copy_examples", [])
            for ex in prohibited_copy:
                snippet = ex.get("text", "")
                if snippet and snippet.lower() in content_text.lower():
                    all_findings.append(
                        Finding(
                            id=f"find_copy_prohib_{uuid.uuid4().hex[:8]}",
                            category=FindingCategory.TONE_VOICE,
                            severity=FindingSeverity.HIGH,
                            title="Prohibited Messaging Phrasing Detected",
                            message=f"Disallowed copy pattern detected: '{snippet}'. Reason: {ex.get('reason', 'Contradicts brand positioning.')}",
                            evidence=snippet,
                            source_reference=SourceReference(
                                guideline_id=f"guideline_v{g_version}",
                                section="Voice & Communication: Prohibited Examples",
                                rule_name="Prohibited Messaging Patterns",
                                verification_status=VerificationStatus.CONTRADICTED,
                            ),
                            confidence=0.95,
                            suggested_correction=SuggestedCorrection(
                                replacement_text="Refer to approved copy examples in Brand Guidelines",
                                rationale="Aligns messaging with corporate tone guidelines.",
                            ),
                            status=FindingStatus.OPEN,
                            requires_human_review=True,
                        )
                    )

            # C. Evaluate Do's and Don'ts rules
            dos_donts = guideline_profile.get("dos_and_donts", [])
            for rule in dos_donts:
                if rule.get("type") in ["prohibited", "common_mistake"]:
                    title_keywords = [w.lower() for w in rule.get("title", "").split() if len(w) > 4]
                    if any(kw in content_text.lower() for kw in title_keywords):
                        severity_str = rule.get("priority", "medium").lower()
                        sev = FindingSeverity.MEDIUM
                        if severity_str == "critical":
                            sev = FindingSeverity.CRITICAL
                        elif severity_str == "high":
                            sev = FindingSeverity.HIGH

                        all_findings.append(
                            Finding(
                                id=f"find_dodont_{rule.get('id', uuid.uuid4().hex[:8])}",
                                category=FindingCategory.POLICY,
                                severity=sev,
                                title=f"Brand Policy Check: {rule.get('title')}",
                                message=rule.get("description", "Violates published brand policy rules."),
                                evidence=rule.get("title"),
                                source_reference=SourceReference(
                                    guideline_id=f"guideline_v{g_version}",
                                    section="General Brand Do's and Don'ts",
                                    rule_name=rule.get("title", "Governance Rule"),
                                    verification_status=VerificationStatus.VERIFIED,
                                ),
                                confidence=0.90,
                                status=FindingStatus.OPEN,
                                requires_human_review=sev in [FindingSeverity.CRITICAL, FindingSeverity.HIGH],
                            )
                        )

            # D. Evaluate Mandatory Compliance Requirements
            compliance_rules = guideline_profile.get("compliance", [])
            for comp in compliance_rules:
                if comp.get("requirement_level") == "mandatory":
                    rule_text = comp.get("rule_text", "")
                    # If document is substantial (> 100 chars) and mentions claims, verify mandatory disclaimers
                    if len(content_text) > 100 and "guarantee" in content_text.lower() and rule_text.lower() not in content_text.lower():
                        all_findings.append(
                            Finding(
                                id=f"find_comp_req_{comp.get('id', uuid.uuid4().hex[:8])}",
                                category=FindingCategory.CLAIM_VERIFICATION,
                                severity=FindingSeverity.HIGH,
                                title=f"Missing Mandatory Disclosure: {comp.get('title')}",
                                message=f"Content makes assertions requiring the mandatory statement: '{rule_text}'.",
                                evidence="Omitted disclaimer",
                                source_reference=SourceReference(
                                    guideline_id=f"guideline_v{g_version}",
                                    section="Mandatory Compliance & Disclosures",
                                    rule_name=comp.get("title", "Mandatory Disclaimer"),
                                    verification_status=VerificationStatus.UNVERIFIED,
                                ),
                                confidence=0.92,
                                suggested_correction=SuggestedCorrection(
                                    replacement_text=rule_text,
                                    rationale="Mandatory regulatory disclosure required by published brand guidelines.",
                                ),
                                status=FindingStatus.OPEN,
                                requires_human_review=True,
                            )
                        )

        # 6. Aggregate Findings & Calculate Scores
        critical_count = sum(1 for f in all_findings if f.severity == FindingSeverity.CRITICAL)
        high_count = sum(1 for f in all_findings if f.severity == FindingSeverity.HIGH)
        medium_count = sum(1 for f in all_findings if f.severity == FindingSeverity.MEDIUM)
        low_count = sum(1 for f in all_findings if f.severity == FindingSeverity.LOW)
        info_count = sum(1 for f in all_findings if f.severity == FindingSeverity.INFO)

        # Weighted penalty deduction from 100
        penalty = (critical_count * 30.0) + (high_count * 15.0) + (medium_count * 8.0) + (low_count * 3.0)
        compliance_score = max(0.0, round(100.0 - penalty, 1))

        # Overall Status Determination
        if critical_count > 0 or compliance_score < 60.0:
            overall_status = OverallAuditStatus.NON_COMPLIANT
        elif high_count > 0 or medium_count > 0 or compliance_score < 90.0:
            overall_status = OverallAuditStatus.NEEDS_REVIEW
        else:
            overall_status = OverallAuditStatus.COMPLIANT

        human_review_required = any(f.requires_human_review for f in all_findings) or overall_status != OverallAuditStatus.COMPLIANT

        verdict_overview = cls._generate_verdict_overview(
            overall_status=overall_status,
            total=len(all_findings),
            critical=critical_count,
            high=high_count,
            medium=medium_count,
            guideline_version=g_version,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        summary = AuditSummary(
            compliance_score=compliance_score,
            total_findings=len(all_findings),
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            info_count=info_count,
            human_review_required=human_review_required,
            verdict_overview=verdict_overview,
        )

        engine_metadata = EngineMetadata(
            engine_version=cls.ENGINE_VERSION,
            execution_time_ms=elapsed_ms,
            modules_executed=modules_executed,
            models_used=["published_brand_rules_evaluator", "rule_engine_v1", "deterministic_tone_parser"],
            warnings=[],
        )

        return AuditResult(
            schema_version="1.0.0",
            audit_id=str(uuid.uuid4()),
            content_id=content_id,
            revision_id=revision_id,
            overall_status=overall_status,
            summary=summary,
            findings=all_findings,
            created_at=datetime.now(timezone.utc),
            engine_metadata=engine_metadata,
        )

    @staticmethod
    def _generate_verdict_overview(
        overall_status: OverallAuditStatus,
        total: int,
        critical: int,
        high: int,
        medium: int,
        guideline_version: str = "1.0.0",
    ) -> str:
        if total == 0:
            return f"Content successfully conforms to all verified brand guidelines (v{guideline_version}), terminology standards, and tone requirements."
        parts = []
        if critical > 0:
            parts.append(f"{critical} critical policy violation(s)")
        if high > 0:
            parts.append(f"{high} high-severity issue(s)")
        if medium > 0:
            parts.append(f"{medium} moderate guideline divergence(s)")

        summary_clause = ", ".join(parts) if parts else f"{total} finding(s)"
        return f"Evaluated against Brand Guidelines v{guideline_version}: identified {summary_clause}. Human reviewer validation recommended prior to external release."
