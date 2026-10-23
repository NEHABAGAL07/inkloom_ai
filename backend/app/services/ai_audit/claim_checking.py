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

    def __init__(self, certified_claims_registry: Optional[List[Dict[str, Any]]] = None):
        # In a real environment, this is loaded from DB ApprovedAssets (type=claim_registry)
        self.certified_claims = certified_claims_registry or [
            {
                "claim_id": "claim-reg-01",
                "approved_statement": "Enterprise SOC2 Type II Certified",
                "evidence_url": "https://compliance.example.com/soc2-report-2025.pdf",
            },
            {
                "claim_id": "claim-reg-02",
                "approved_statement": "Analyzes over 10 million brand assets annually",
                "evidence_url": "https://data.example.com/2025-annual-throughput-metrics",
            },
        ]

    def check(
        self,
        text: str,
        rules: List[RetrievedRule],
        verified_facts: Optional[List[Dict[str, Any]]] = None,
    ) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        claim_rules = [r for r in rules if r.category in ("claim_verification", "claims", "unsupported_claim", "factual_accuracy")]

        # Combine internal certified claims with dynamically passed verified facts
        claims_pool = list(self.certified_claims)
        if verified_facts:
            for fact in verified_facts:
                claims_pool.append({
                    "claim_id": fact.get("id", "fact-custom"),
                    "approved_statement": fact.get("statement") or fact.get("approved_statement", ""),
                    "evidence_url": fact.get("source_document") or fact.get("evidence_url", ""),
                })

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
                        matched_str.lower() in c.get("approved_statement", "").lower()
                        for c in claims_pool
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
