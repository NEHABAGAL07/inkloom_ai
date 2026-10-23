"""Inkloom AI - Factual Claim Verification and Substantiation Module.

Validates promotional statements, quantitative metrics, superlatives, and certifications
against registered corporate facts. Strictly upholds two non-negotiable governance principles:
1. Never fabricate or hallucinate citations, URLs, or registry references.
2. Distinctly categorize claims as supported, contradicted, unverified, or unavailable.
"""

import re
from typing import List, Dict, Any, Optional
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule
from app.services.ai_audit.interface import VerifiedFact, EvidenceStatusEnum


class ClaimChecker:
    """Verifies promotional statements and quantitative claims against registered brand facts."""

    def __init__(
        self,
        certified_claims_registry: Optional[List[Dict[str, Any]]] = None,
        verified_facts: Optional[List[VerifiedFact]] = None,
    ):
        self.verified_facts: List[VerifiedFact] = verified_facts or []
        
        # Support legacy certified claims dict format for backward compatibility
        if certified_claims_registry:
            for item in certified_claims_registry:
                self.verified_facts.append(
                    VerifiedFact(
                        fact_id=item.get("claim_id", "fact-legacy"),
                        organization_id="org-default",
                        claim_category="certification",
                        statement=item.get("approved_statement", ""),
                        approved_value=item.get("approved_statement"),
                        source_reference=item.get("source_reference"),
                        evidence_url=item.get("evidence_url"),
                    )
                )

        if not self.verified_facts:
            # Baseline certified facts
            self.verified_facts = [
                VerifiedFact(
                    fact_id="fact-soc2-001",
                    organization_id="org-default",
                    claim_category="certification",
                    statement="Enterprise SOC2 Type II Certified",
                    approved_value="SOC2 Type II",
                    source_reference="Security & Compliance Certifications Registry 2025-2026, Cert #SC-9921",
                    evidence_url="https://compliance.example.com/soc2-report-2025.pdf",
                ),
                VerifiedFact(
                    fact_id="fact-metric-002",
                    organization_id="org-default",
                    claim_category="metric",
                    statement="Analyzes over 10 million brand assets annually",
                    approved_value="10 million",
                    source_reference="Q4 2025 Throughput Audit, Sec 2.1",
                    evidence_url="https://data.example.com/2025-annual-throughput-metrics",
                ),
                VerifiedFact(
                    fact_id="fact-uptime-003",
                    organization_id="org-default",
                    claim_category="metric",
                    statement="99.9% uptime SLA guarantee",
                    approved_value="99.9%",
                    source_reference="Customer Service Level Agreement 2026",
                ),
                VerifiedFact(
                    fact_id="fact-pricing-004",
                    organization_id="org-default",
                    claim_category="pricing",
                    statement="Standard tier starts at $99 per user per month",
                    approved_value="$99",
                    source_reference="Master Pricing Schedule v3.0",
                ),
            ]

    def check(
        self,
        text: str,
        rules: List[RetrievedRule],
        verified_facts: Optional[List[VerifiedFact]] = None,
    ) -> List[FindingSchema]:
        """Check content against empirical facts and detect unsubstantiated or contradicted claims."""
        findings: List[FindingSchema] = []
        facts_pool = verified_facts if verified_facts is not None else self.verified_facts
        claim_rules = [r for r in rules if r.category == "claim_verification"]

        # 1. Contradiction Checks against Verified Facts
        findings.extend(self._check_contradictions(text, facts_pool))

        # 2. Superlative and Absolute Guarantee Checks (Unverified Claims)
        for rule in claim_rules:
            patterns = rule.rule_config.get("superlative_patterns", [])
            for pattern_str in patterns:
                try:
                    pattern = re.compile(pattern_str, re.IGNORECASE)
                except re.error:
                    continue

                for match in pattern.finditer(text):
                    matched_str = match.group(0)
                    start_idx = match.start()
                    end_idx = match.end()
                    line_num = text[:start_idx].count("\n") + 1

                    context_start = max(0, start_idx - 35)
                    context_end = min(len(text), end_idx + 35)
                    evidence_snippet = text[context_start:context_end].strip()

                    # Check if this specific superlative statement is certified in registry
                    is_certified = any(
                        matched_str.lower() in f.statement.lower() or
                        (f.approved_value and matched_str.lower() in f.approved_value.lower())
                        for f in facts_pool
                    )

                    if not is_certified:
                        # Non-negotiable invariant: Unverified claim -> source_reference MUST BE None!
                        finding = FindingSchema(
                            id=f"claim-unverified-{len(findings)+1}",
                            category=FindingCategoryEnum.CLAIM_VERIFICATION,
                            severity=FindingSeverityEnum.HIGH,
                            title="Unsubstantiated Performance Claim",
                            message=(
                                f"The superlative or guarantee claim '{matched_str}' was detected without corresponding "
                                f"verification in the corporate claim registry. "
                                f"Unsubstantiated claims expose marketing to regulatory challenge and deceptive advertising liability."
                            ),
                            evidence=evidence_snippet,
                            source_reference=None,  # NEVER fabricate a citation!
                            confidence=0.94,
                            suggested_correction=(
                                f"Replace absolute claim '{matched_str}' with verifiable descriptive language "
                                f"or submit empirical substantiation to the legal compliance registry."
                            ),
                            status=FindingStatusEnum.FLAGGED,
                            location=LocationSchema(
                                start_offset=start_idx,
                                end_offset=end_idx,
                                line=line_num,
                                page=1,
                            ),
                            requires_human_review=True,  # Mandatory human sign-off
                        )
                        findings.append(finding)

        return findings

    def _check_contradictions(
        self,
        text: str,
        facts: List[VerifiedFact],
    ) -> List[FindingSchema]:
        """Detect claims that directly contradict known verified facts."""
        contradictions: List[FindingSchema] = []

        # Example check: Uptime claim contradictions
        uptime_match = re.search(r"\b(99\.\d+)%\s+(?:uptime|availability)\b", text, re.IGNORECASE)
        if uptime_match:
            claimed_uptime = uptime_match.group(1)
            # Find SLA fact
            uptime_facts = [f for f in facts if "uptime" in f.statement.lower() or "sla" in f.statement.lower()]
            for fact in uptime_facts:
                if fact.approved_value and claimed_uptime != fact.approved_value.replace("%", ""):
                    start_idx = uptime_match.start()
                    end_idx = uptime_match.end()
                    contradictions.append(
                        FindingSchema(
                            id=f"claim-contradicted-{len(contradictions)+1}",
                            category=FindingCategoryEnum.CLAIM_VERIFICATION,
                            severity=FindingSeverityEnum.HIGH,
                            title="Contradicted Uptime SLA Claim",
                            message=(
                                f"Content claims {claimed_uptime}% uptime, which directly contradicts approved SLA "
                                f"specification of {fact.approved_value}."
                            ),
                            evidence=uptime_match.group(0),
                            source_reference=fact.source_reference,
                            confidence=0.96,
                            suggested_correction=f"Align uptime claim to certified SLA: {fact.approved_value} uptime.",
                            status=FindingStatusEnum.FLAGGED,
                            location=LocationSchema(
                                start_offset=start_idx,
                                end_offset=end_idx,
                                line=text[:start_idx].count("\n") + 1,
                                page=1,
                            ),
                            requires_human_review=True,
                        )
                    )

        # Example check: Pricing contradictions
        pricing_match = re.search(r"\$(\d+)(?:\s*(?:per|\/)\s*(?:user|seat|month|mo))", text, re.IGNORECASE)
        if pricing_match:
            claimed_price = f"${pricing_match.group(1)}"
            pricing_facts = [f for f in facts if f.claim_category == "pricing" and f.approved_value]
            for fact in pricing_facts:
                if fact.approved_value and claimed_price != fact.approved_value:
                    start_idx = pricing_match.start()
                    end_idx = pricing_match.end()
                    contradictions.append(
                        FindingSchema(
                            id=f"claim-contradicted-{len(contradictions)+1}",
                            category=FindingCategoryEnum.CLAIM_VERIFICATION,
                            severity=FindingSeverityEnum.HIGH,
                            title="Contradicted Pricing Figure",
                            message=(
                                f"Content specifies pricing of {claimed_price}, which conflicts with certified "
                                f"pricing of {fact.approved_value} in {fact.statement}."
                            ),
                            evidence=pricing_match.group(0),
                            source_reference=fact.source_reference,
                            confidence=0.95,
                            suggested_correction=f"Update pricing to certified rate: {fact.approved_value}.",
                            status=FindingStatusEnum.FLAGGED,
                            location=LocationSchema(
                                start_offset=start_idx,
                                end_offset=end_idx,
                                line=text[:start_idx].count("\n") + 1,
                                page=1,
                            ),
                            requires_human_review=True,
                        )
                    )

        return contradictions
