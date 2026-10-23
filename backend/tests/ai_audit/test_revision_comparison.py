"""Revision-Aware Auditing and Iteration Comparison Tests."""

import pytest
from app.services.ai_audit.engine import AIAuditEngine
from app.services.ai_audit.interface import ContentContext, RevisionDiff
from app.schemas.common import FindingCategoryEnum


def test_revision_aware_comparison_flow():
    """Verify revision comparisons distinguish resolved, persistent, and newly introduced issues."""
    engine = AIAuditEngine()

    # Revision 1 text with multiple issues:
    # 1. 'inkloom' (terminology)
    # 2. '100% error-free guarantee' (claim)
    # 3. 'super pumped' (tone)
    rev1_text = (
        "Try inkloom today for enterprise marketing! "
        "Our system provides a 100% error-free guarantee across all campaigns. "
        "We are super pumped to launch."
    )

    # Revision 2 text:
    # Author fixed 'inkloom' -> 'Inkloom AI' (resolved)
    # Author fixed 'super pumped' -> 'proud' (resolved)
    # Kept '100% error-free guarantee' (persistent)
    # Added 'crazy good' (new tone issue introduced)
    rev2_text = (
        "Try Inkloom AI today for enterprise marketing! "
        "Our system provides a 100% error-free guarantee across all campaigns. "
        "We are proud to launch this crazy good platform."
    )

    ctx_rev2 = ContentContext(
        content_id="cnt-rev-lifecycle-001",
        revision_id="rev-002",
        revision_num=2,
        previous_revision_text=rev1_text,
    )

    audit_result, diff, advisory = engine.audit_with_context(
        text=rev2_text,
        context=ctx_rev2,
    )

    assert diff is not None
    assert isinstance(diff, RevisionDiff)

    # Verify resolved issues
    assert diff.resolved_count >= 1
    assert any("Capitalization" in title for title in diff.resolved_titles)

    # Verify persistent issues (the unverified 100% claim)
    assert diff.persistent_count >= 1
    assert any("Superlative" in title or "Claim" in title for title in diff.persistent_titles)

    # Verify newly introduced issues ('crazy good')
    assert diff.new_findings_count >= 1

    # Findings in audit_result must reflect only Revision 2 issues
    # Ensure resolved 'inkloom' casing issue is NOT present in Rev 2 findings
    assert not any(
        f.category == FindingCategoryEnum.TERMINOLOGY and "inkloom" in (f.evidence or "").lower()
        for f in audit_result.findings
    )
