"""
Evidence and Grounded Knowledge Retrieval Module
Stage 3, Stage 4, Stage 5:
- Retrieves applicable approved brand rules (Stage 3)
- Retrieves authorized verified facts and certified benchmarks (Stage 4)
- Retrieves authoritative statutory laws, regulations, and official guidance (Stage 5)
Strictly adheres to:
1. No fabrication of laws, citations, or URLs.
2. Explicit differentiation: SUPPORTED, CONTRADICTED, UNVERIFIED, UNAVAILABLE.
3. Distinction between binding law, official guidance, internal policy, and general recommendation.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.schemas.knowledge import (
    KnowledgeSourceType,
    EvidenceStatus,
    RulePriorityType,
    VerificationStatus,
)
from app.schemas.ai_context import (
    ProvenanceRecord,
    BrandRuleContext,
    VerifiedFactContext,
    LegalSourceContext,
)
from app.services.shared_intelligence.retrieval import KnowledgeRetriever
from app.services.ai_audit.claim_checking import (
    APPROVED_BENCHMARKS,
    CONTRADICTED_CLAIM_PATTERNS,
    UNVERIFIED_CLAIM_PATTERNS,
)


class EvidenceRetriever:
    """Coordinates multi-tenant grounded evidence and legal authority retrieval."""

    @classmethod
    def retrieve_brand_rules(
        cls,
        db: Optional[Session],
        organization_id: Optional[str],
        content_text: str,
        channel: str = "web",
        jurisdiction: str = "Global",
        active_guidelines: Optional[List[Dict[str, Any]]] = None,
        guideline_version: str = "1.0.0",
        guideline_profile: Optional[Dict[str, Any]] = None,
    ) -> List[BrandRuleContext]:
        """Retrieves approved brand rules strictly from published guidelines and active knowledge."""
        rules: List[BrandRuleContext] = []

        if db and organization_id:
            db_rules = KnowledgeRetriever.retrieve_applicable_rules(
                db=db,
                organization_id=organization_id,
                content_text=content_text,
                target_channel=channel,
                target_jurisdiction=jurisdiction,
            )
            rules.extend(db_rules)

        # Supplement with active_guidelines passed in memory
        if active_guidelines:
            for ag in active_guidelines:
                rule_id = ag.get("id", f"rule_{len(rules)+1}")
                if any(r.rule_id == rule_id for r in rules):
                    continue
                rules.append(
                    BrandRuleContext(
                        rule_id=rule_id,
                        category=ag.get("category", "editorial_standards"),
                        rule_name=ag.get("rule_name", "Brand Governance Rule"),
                        section=ag.get("section", f"Guideline v{guideline_version}"),
                        severity_default=ag.get("severity", "medium"),
                        rule_type=RulePriorityType.BRAND_STANDARD,
                        priority_level=3,
                        rule_definition=ag.get("rule_definition", {}),
                        provenance=ProvenanceRecord(
                            source_id=rule_id,
                            source_type=KnowledgeSourceType.BRAND_RULE,
                            title=ag.get("rule_name", "Brand Rule"),
                            source_reference=f"v{guideline_version}",
                            jurisdiction=jurisdiction,
                            version=guideline_version,
                            verification_status=VerificationStatus.VERIFIED,
                            is_binding=False,
                        ),
                    )
                )

        return rules

    @classmethod
    def retrieve_verified_facts(
        cls,
        db: Optional[Session],
        organization_id: Optional[str],
        query_text: Optional[str] = None,
    ) -> List[VerifiedFactContext]:
        """
        Retrieves registered verified facts and certified claims.
        Explicitly distinguishes supported, contradicted, unverified, and unavailable.
        """
        facts: List[VerifiedFactContext] = []

        # 1. Registered facts in database
        if db and organization_id:
            db_facts = KnowledgeRetriever.retrieve_verified_facts(
                db=db,
                organization_id=organization_id,
                query_text=query_text,
            )
            facts.extend(db_facts)

        # 2. Hardened built-in certified benchmark registry
        for b in APPROVED_BENCHMARKS:
            if not any(f.claim_key == b["claim_key"] for f in facts):
                facts.append(
                    VerifiedFactContext(
                        fact_id=f"cert_bench_{b['claim_key']}",
                        claim_key=b["claim_key"],
                        statement=b["verified_statement"],
                        evidence_status=EvidenceStatus.SUPPORTED,
                        provenance=ProvenanceRecord(
                            source_id=f"doc_{b['claim_key']}",
                            source_type=KnowledgeSourceType.CERTIFIED_CLAIM,
                            title=b["certified_reference"],
                            authoritative_source="Inkloom Enterprise Audit Bureau",
                            source_reference=b["certified_reference"],
                            source_url=b.get("reference_url"),
                            jurisdiction="Global",
                            version="2025.4",
                            effective_date=datetime(2025, 10, 1, tzinfo=timezone.utc),
                            verification_status=VerificationStatus.VERIFIED,
                            is_binding=False,
                        ),
                    )
                )

        return facts

    @classmethod
    def retrieve_legal_references(
        cls,
        db: Optional[Session],
        organization_id: Optional[str],
        jurisdiction: str = "Global",
    ) -> List[LegalSourceContext]:
        """
        Retrieves statutory codes, administrative regulations, and official guidance.
        Distinguishes binding law, regulatory guidance, and internal company policies.
        Never fabricates laws, legal citations, or URLs.
        """
        legal_sources: List[LegalSourceContext] = []

        if db and organization_id:
            db_legal = KnowledgeRetriever.retrieve_legal_sources(
                db=db,
                organization_id=organization_id,
                jurisdiction=jurisdiction,
            )
            legal_sources.extend(db_legal)

        # Authoritative baseline statutory references (grounded in actual statutes)
        baseline_statutes = [
            {
                "id": "statute_ftc_act_sec5",
                "type": KnowledgeSourceType.LEGISLATION,
                "title": "FTC Act Section 5: Prohibition on Unfair or Deceptive Practices",
                "citation": "15 U.S.C. § 45(a)(1)",
                "jurisdiction": "US",
                "summary": "Prohibits unfair or deceptive acts or practices in or affecting commerce, including unsubstantiated advertising claims.",
                "source_url": "https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act",
                "is_binding": True,
                "effective_date": datetime(1914, 9, 26, tzinfo=timezone.utc),
            },
            {
                "id": "statute_eu_ai_act_transparency",
                "type": KnowledgeSourceType.REGULATION,
                "title": "EU Artificial Intelligence Act (Regulation 2024/1689), Article 50 Transparency",
                "citation": "EU Reg 2024/1689 Art 50",
                "jurisdiction": "EU",
                "summary": "Mandates clear disclosure to users when content is AI-generated or manipulated, and requires machine-readable watermarking.",
                "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
                "is_binding": True,
                "effective_date": datetime(2024, 8, 1, tzinfo=timezone.utc),
            },
            {
                "id": "guidance_ftc_endorsement_guides",
                "type": KnowledgeSourceType.OFFICIAL_GUIDANCE,
                "title": "FTC Guides Concerning the Use of Endorsements and Testimonials in Advertising",
                "citation": "16 CFR Part 255",
                "jurisdiction": "US",
                "summary": "Requires clear and conspicuous disclosure of material connections between advertisers and endorsers.",
                "source_url": "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking",
                "is_binding": False,
                "effective_date": datetime(2023, 7, 26, tzinfo=timezone.utc),
            },
        ]

        for s in baseline_statutes:
            # Check jurisdiction match
            if jurisdiction in ("Global", s["jurisdiction"]) or s["jurisdiction"] == "Global":
                if not any(l.source_id == s["id"] for l in legal_sources):
                    legal_sources.append(
                        LegalSourceContext(
                            source_id=s["id"],
                            legal_type=s["type"],
                            citation=s["citation"],
                            jurisdiction=s["jurisdiction"],
                            title=s["title"],
                            summary=s["summary"],
                            is_binding=s["is_binding"],
                            effective_date=s["effective_date"],
                            provenance=ProvenanceRecord(
                                source_id=s["id"],
                                source_type=s["type"],
                                title=s["title"],
                                authoritative_source=s["citation"],
                                source_reference=s["citation"],
                                source_url=s["source_url"],
                                jurisdiction=s["jurisdiction"],
                                version="2024",
                                effective_date=s["effective_date"],
                                verification_status=VerificationStatus.VERIFIED,
                                is_binding=s["is_binding"],
                            ),
                        )
                    )

        return legal_sources
