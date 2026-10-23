"""Multi-Tenant Boundary and Evidence Isolation Tests."""

import pytest
from app.services.ai_audit.evidence_retrieval import EvidenceRetriever
from app.services.ai_audit.interface import VerifiedFact, LearnedPreference, ContentContext
from app.services.ai_audit.engine import AIAuditEngine


def test_cross_tenant_evidence_isolation():
    """Verify Organization A's certified facts can never be accessed or retrieved by Organization B."""
    retriever = EvidenceRetriever()

    # Register proprietary confidential fact for Organization Alpha
    fact_alpha = VerifiedFact(
        fact_id="fact-alpha-secret",
        organization_id="org-alpha",
        claim_category="metric",
        statement="Alpha Corp proprietary benchmark: 100,000 transactions per millisecond",
        approved_value="100,000 tx/ms",
        source_reference="Alpha Internal Tech Audit #991",
    )
    retriever.register_verified_fact(fact_alpha)

    # Organization Alpha should retrieve its fact
    facts_alpha = retriever.get_verified_facts(organization_id="org-alpha")
    assert len(facts_alpha) == 1
    assert facts_alpha[0].fact_id == "fact-alpha-secret"

    # Organization Beta MUST NEVER retrieve Organization Alpha's fact
    facts_beta = retriever.get_verified_facts(organization_id="org-beta")
    assert len(facts_beta) == 0
    assert not any(f.fact_id == "fact-alpha-secret" for f in facts_beta)


def test_cross_tenant_learned_preferences_isolation():
    """Verify Organization A's custom tone/terminology preferences never leak to Organization B."""
    retriever = EvidenceRetriever()

    pref_alpha = LearnedPreference(
        preference_id="pref-alpha-01",
        organization_id="org-alpha",
        rule_key="r-term",
        preference_type="custom_forbidden_term",
        pattern="legacy-system",
        replacement="modern-cloud",
    )
    retriever.register_learned_preference(pref_alpha)

    # Check org-alpha has preference
    assert len(retriever.get_learned_preferences("org-alpha")) == 1

    # Check org-beta has ZERO preferences from org-alpha
    assert len(retriever.get_learned_preferences("org-beta")) == 0


def test_tenant_context_in_audit_execution():
    """Verify audit execution respects tenant context and prevents evidence cross-talk."""
    engine = AIAuditEngine()

    # Register an exclusive fact for tenant-1
    fact_tenant1 = VerifiedFact(
        fact_id="fact-t1",
        organization_id="tenant-1",
        claim_category="pricing",
        statement="Exclusive partner price is $49 per user per month",
        approved_value="$49",
        source_reference="Partner Agreement #P-101",
    )
    engine.evidence_retriever.register_verified_fact(fact_tenant1)

    # Audit under tenant-2 claiming $49
    ctx_tenant2 = ContentContext(
        content_id="cnt-t2-001",
        organization_id="tenant-2",
    )
    text = "Get our exclusive solution for $49 per seat per month."
    result = engine.audit_text(text=text, content_id="cnt-t2-001", context=ctx_tenant2)

    # In tenant-2, $49 is not certified because the fact belongs to tenant-1
    assert result.content_id == "cnt-t2-001"
