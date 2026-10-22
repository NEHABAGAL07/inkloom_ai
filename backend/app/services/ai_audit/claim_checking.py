"""AI Audit Engine - Claim Verification and Fact Checking Module.

IMPORTANT GOVERNANCE RULES:
1. Never fabricate or hallucinate citations or registry entries.
2. Clearly distinguish UNVERIFIED claims (no source found) from CONTRADICTED claims (direct mismatch with registry).
3. Always mandate human review for high-impact unverified claims.
"""

import re
from typing import List, Dict, Any, Optional
from app.schemas.audit import FindingSchema, LocationSchema
from app.schemas.common import FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum
from app.services.ai_audit.guideline_retrieval import RetrievedRule


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

    def check(self, text: str, rules: List[RetrievedRule]) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        claim_rules = [r for r in rules if r.category == "claim_verification"]

        for rule in claim_rules:
            patterns = rule.rule_config.get("superlative_patterns", [])

            for pattern_str in patterns:
                pattern = re.compile(pattern_str, re.IGNORECASE)
                for match in pattern.finditer(text):
                    matched_str = match.group(0)
                    start_idx = match.start()
                    end_idx = match.end()
                    line_num = text[:start_idx].count("\n") + 1

                    context_start = max(0, start_idx - 35)
                    context_end = min(len(text), end_idx + 35)
                    evidence_snippet = text[context_start:context_end].strip()

                    # Check if this superlative claim is certified in the claims registry
                    is_certified = any(
                        matched_str.lower() in c.get("approved_statement", "").lower()
                        for c in self.certified_claims
                    )

                    if not is_certified:
                        # Crucial: Unverified claim -> source_reference is explicitly None!
                        finding = FindingSchema(
                            id=f"claim-unverified-{len(findings)+1}",
                            category=FindingCategoryEnum.CLAIM_VERIFICATION,
                            severity=FindingSeverityEnum.HIGH,
                            title="Unsubstantiated Promotional Claim",
                            message=(
                                f"The promotional claim '{matched_str}' was detected without corresponding "
                                f"verification in the organizational claim registry. "
                                f"Unsubstantiated claims create substantial regulatory and brand liability."
                            ),
                            evidence=evidence_snippet,
                            source_reference=None,  # Never invent a fake citation!
                            confidence=0.92,
                            suggested_correction=(
                                f"Remove absolute guarantee '{matched_str}' or submit empirical proof "
                                f"to the legal compliance claims registry."
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
