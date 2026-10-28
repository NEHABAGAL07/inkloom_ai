"""
Fact and Promotional Claim Verification Module

Critical Governance Rules:
1. Clearly distinguish UNVERIFIED claims (no verified benchmark exists)
   from CONTRADICTED claims (claims demonstrably contrary to certified benchmarks).
2. NEVER fabricate citations, benchmark whitepapers, or URL sources.
   Missing citations must be explicitly represented as unverified/null.
"""
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
    FindingLocation,
)

# Registry of certified, verified internal claims with real verification references
APPROVED_BENCHMARKS = [
    {
        "claim_key": "latency_reduction",
        "verified_statement": "reduces manual compliance review latency by up to 65%",
        "certified_reference": "Inkloom Enterprise Benchmark Report Q4 2025, Table 3",
        "reference_url": "https://brand.inkloom.internal/benchmarks/2025-q4-latency.pdf",
    },
    {
        "claim_key": "soc2_compliance",
        "verified_statement": "SOC 2 Type II certified infrastructure",
        "certified_reference": "AICPA SOC 2 Type II Independent Audit Report 2025",
        "reference_url": "https://brand.inkloom.internal/compliance/soc2-type2.pdf",
    },
]

# Patterns for unverified promotional multipliers & superlative claims
UNVERIFIED_CLAIM_PATTERNS = [
    {
        "pattern": r"\b(10x|100x|1000x)\s+(faster|reduction|increase|cheaper|better)\b",
        "metric_type": "multiplier",
        "title": "Unverified Quantitative Multiplier Claim",
        "message": "Content asserts an absolute multiplier (e.g. '10x') that is not registered in the approved enterprise claims database.",
        "replacement": "substantially faster performance verified in enterprise benchmark trials",
        "rationale": "Replaces uncertified mathematical multiplier with a qualified performance statement.",
        "severity": FindingSeverity.HIGH,
    },
    {
        "pattern": r"\b(\d{2,4}%)\s+(faster|reduction|increase|cheaper|better|within|guaranteed)\b|\b(boosts?|increases?|reduces?)\b[^\.\,\;\:\n]{0,40}\b(\d{2,4}%)\b",
        "metric_type": "extreme_percentage",
        "title": "Unverified Quantitative Percentage Claim",
        "message": "High-magnitude quantitative percentage claim asserts performance metric without recorded enterprise benchmark dossier.",
        "replacement": "measurably improves performance based on enterprise benchmark testing",
        "rationale": "Replaces unverified percentage multiplier with qualified performance statement.",
        "severity": FindingSeverity.CRITICAL,
    },
    {
        "pattern": r"\b(the world'?s only|the number one brand governance|ranked #1 globally|rated #1|ranked #1|#1 brand management|#1 in user satisfaction)\b",
        "metric_type": "market_ranking",
        "title": "Unsubstantiated Market Leadership Claim",
        "message": "Superlative market ranking claims require independent third-party analyst citation (e.g., Gartner/Forrester) under advertising standards.",
        "replacement": "a leading enterprise brand governance platform",
        "rationale": "Adheres to legal advertising guidelines by removing unverified #1 claims.",
        "severity": FindingSeverity.HIGH,
    },
    {
        "pattern": r"\b(permanently miss your chance|act now or miss out)\b",
        "metric_type": "urgency_tone",
        "title": "High-Pressure Urgency Phrasing",
        "message": "High-pressure urgency phrasing conflicts with enterprise brand voice guidelines.",
        "replacement": "learn how automated governance can support your team",
        "rationale": "Softens high-pressure urgency to professional consultative tone.",
        "severity": FindingSeverity.MEDIUM,
    },
    {
        "pattern": r"\bunlike\s+\w+\s+which\s+is\s+(insecure|corrupt|illegal|dangerous)\b|\bcompetitors?\s+(?:is|are)\s+(?:insecure|corrupt|illegal)\b",
        "metric_type": "competitor_disparagement",
        "title": "Prohibited Competitor Disparagement",
        "message": "Explicit competitor disparagement asserting unsubstantiated negative claims violates brand ethics and advertising law.",
        "replacement": "delivers verifiable enterprise security and governance controls",
        "rationale": "Focuses on positive brand differentiation rather than competitor disparagement.",
        "severity": FindingSeverity.HIGH,
    },
]

# Contradicted claims (claims known to be false based on certified technical limits)
CONTRADICTED_CLAIM_PATTERNS = [
    {
        "pattern": r"\b(processes infinite video in 0 seconds|zero latency in all conditions)\b",
        "title": "Contradicted Technical Claim",
        "message": "Claim is technically impossible and directly contradicted by certified system architecture documentation (minimum pipeline latency is 120ms).",
        "replacement": "sub-second pipeline processing under typical operating conditions",
        "rationale": "Corrects false factual claim to match real architectural specifications.",
        "severity": FindingSeverity.CRITICAL,
        "certified_doc": "Inkloom Architecture Spec V3.4, Section 5.1",
    },
    {
        "pattern": r"\b(?:exclusively offline desktop utility.*cloud storage|offline.*stores data exclusively in the cloud)\b",
        "title": "Contradictory Product Architecture Claim",
        "message": "Claim is self-contradictory: a product cannot operate as an exclusively offline utility while synchronizing data in real-time to multi-tenant cloud storage.",
        "replacement": "cloud-connected platform with local client workflows",
        "rationale": "Eliminates contradictory factual statements.",
        "severity": FindingSeverity.HIGH,
        "certified_doc": "Inkloom System Architecture Overview",
    },
]


class ClaimVerifier:
    @staticmethod
    def verify(text: str, custom_claims: List[Dict[str, Any]] = None) -> List[Finding]:
        findings: List[Finding] = []
        counter = 1

        # 1. Check Contradicted Claims (Demonstrably False)
        for item in CONTRADICTED_CLAIM_PATTERNS:
            regex = re.compile(item["pattern"], re.IGNORECASE)
            for match in regex.finditer(text):
                finding = Finding(
                    id=f"find_claim_{counter:03d}",
                    category=FindingCategory.CLAIM_VERIFICATION,
                    severity=item["severity"],
                    title=item["title"],
                    message=item["message"],
                    evidence=match.group(0),
                    source_reference=SourceReference(
                        rule_name="Factual Accuracy & Technical Limits",
                        section=item["certified_doc"],
                        verification_status=VerificationStatus.CONTRADICTED,
                        is_external=False,
                    ),
                    confidence=0.97,
                    suggested_correction=SuggestedCorrection(
                        replacement_text=item["replacement"],
                        rationale=item["rationale"],
                        preserves_intent=True,
                    ),
                    status=FindingStatus.MANUAL_CHECK_REQUIRED,
                    location=FindingLocation(
                        start_char=match.start(),
                        end_char=match.end(),
                    ),
                    requires_human_review=True,
                )
                findings.append(finding)
                counter += 1

        # 2. Check Unverified Promotional Claims (No certified benchmark found)
        for item in UNVERIFIED_CLAIM_PATTERNS:
            regex = re.compile(item["pattern"], re.IGNORECASE)
            for match in regex.finditer(text):
                finding = Finding(
                    id=f"find_claim_{counter:03d}",
                    category=FindingCategory.CLAIM_VERIFICATION,
                    severity=item["severity"],
                    title=item["title"],
                    message=item["message"],
                    evidence=match.group(0),
                    source_reference=SourceReference(
                        rule_name="Certified Benchmark Citation Requirement",
                        section="Regulatory Rule C-04: Numerical Claims",
                        source_url=None,  # NEVER fabricate missing URL
                        verification_status=VerificationStatus.UNVERIFIED,
                        is_external=False,
                    ),
                    confidence=0.91,
                    suggested_correction=SuggestedCorrection(
                        replacement_text=item["replacement"],
                        rationale=item["rationale"],
                        preserves_intent=True,
                    ),
                    status=FindingStatus.MANUAL_CHECK_REQUIRED,
                    location=FindingLocation(
                        start_char=match.start(),
                        end_char=match.end(),
                    ),
                    requires_human_review=True,
                )
                findings.append(finding)
                counter += 1

        return findings
