"""Inkloom AI - Evidence Retrieval and Knowledge Source Isolation Module.

Enforces strict multi-tenant boundary isolation. Organization A can never query or
retrieve facts, guidelines, or learned preferences belonging to Organization B.
"""

from typing import Any, Dict, List, Optional
from app.services.ai_audit.interface import VerifiedFact, LearnedPreference
from app.services.ai_audit.guideline_retrieval import RetrievedRule


class EvidenceRetriever:
    """Manages versioned brand rules, certified facts, and organization-scoped evidence."""

    def __init__(self):
        # In-memory tenant-isolated fact registry: org_id -> List[VerifiedFact]
        self._tenant_facts: Dict[str, List[VerifiedFact]] = {
            "org-default": [
                VerifiedFact(
                    fact_id="fact-soc2-001",
                    organization_id="org-default",
                    claim_category="certification",
                    statement="Enterprise SOC2 Type II Certified",
                    approved_value="SOC2 Type II",
                    source_reference="Security & Compliance Certifications Registry 2025-2026, Cert #SC-9921",
                    evidence_url="https://compliance.inkloom.ai/reports/soc2-type2.pdf",
                    version="2.1",
                ),
                VerifiedFact(
                    fact_id="fact-metric-002",
                    organization_id="org-default",
                    claim_category="metric",
                    statement="Analyzes over 10 million brand assets annually",
                    approved_value="10 million",
                    source_reference="Q4 2025 Verified Throughput Metrics, Operations Report Sec. 2.4",
                    evidence_url="https://metrics.inkloom.ai/annual-throughput-2025",
                    version="1.0",
                ),
                VerifiedFact(
                    fact_id="fact-uptime-003",
                    organization_id="org-default",
                    claim_category="metric",
                    statement="Delivers 99.9% uptime SLA",
                    approved_value="99.9%",
                    source_reference="Enterprise Service Level Agreement v3.2",
                    evidence_url="https://trust.inkloom.ai/sla",
                    version="3.2",
                ),
                VerifiedFact(
                    fact_id="fact-pricing-004",
                    organization_id="org-default",
                    claim_category="pricing",
                    statement="Standard tier starts at $99 per seat per month",
                    approved_value="$99",
                    source_reference="Product Pricing Master Sheet v4.0",
                    version="4.0",
                ),
            ]
        }

        # Tenant-isolated learned preferences
        self._tenant_preferences: Dict[str, List[LearnedPreference]] = {}

    def get_verified_facts(
        self,
        organization_id: str,
        category: Optional[str] = None,
    ) -> List[VerifiedFact]:
        """
        Retrieve verified facts strictly belonging to the specified organization.
        Cross-tenant retrieval is strictly impossible.
        """
        facts = self._tenant_facts.get(organization_id, [])
        if category:
            facts = [f for f in facts if f.claim_category == category]
        return [f for f in facts if f.is_active]

    def register_verified_fact(self, fact: VerifiedFact) -> None:
        """Register a new certified fact under an organization's partition."""
        org_id = fact.organization_id
        if org_id not in self._tenant_facts:
            self._tenant_facts[org_id] = []
        # Prevent duplicate fact_id
        self._tenant_facts[org_id] = [
            f for f in self._tenant_facts[org_id] if f.fact_id != fact.fact_id
        ]
        self._tenant_facts[org_id].append(fact)

    def get_learned_preferences(
        self,
        organization_id: str,
        preference_type: Optional[str] = None,
    ) -> List[LearnedPreference]:
        """Retrieve approved human feedback preferences strictly for the tenant."""
        prefs = self._tenant_preferences.get(organization_id, [])
        if preference_type:
            prefs = [p for p in prefs if p.preference_type == preference_type]
        return [p for p in prefs if p.is_active]

    def register_learned_preference(self, preference: LearnedPreference) -> None:
        """Register an administrator-approved learned preference."""
        org_id = preference.organization_id
        if org_id not in self._tenant_preferences:
            self._tenant_preferences[org_id] = []
        self._tenant_preferences[org_id] = [
            p for p in self._tenant_preferences[org_id] if p.preference_id != preference.preference_id
        ]
        self._tenant_preferences[org_id].append(preference)
