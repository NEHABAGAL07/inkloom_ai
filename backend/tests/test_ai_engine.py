from app.services.ai_audit.engine import AIAuditEngine
from app.schemas.audit_contract import OverallAuditStatus, VerificationStatus, FindingCategory


def test_ai_engine_compliant_text():
    clean_text = (
        "Inkloom AI delivers automated brand governance solutions designed to assist "
        "enterprise compliance teams. Our verified workflows empower reviewers to inspect "
        "content with high precision."
    )
    result = AIAuditEngine.run_audit(
        content_text=clean_text,
        content_id="sub_clean_1",
    )
    assert result.overall_status == OverallAuditStatus.COMPLIANT
    assert result.summary.compliance_score >= 90.0
    assert result.summary.total_findings == 0


def test_ai_engine_detects_violations():
    violating_text = (
        "Get started with the powerful Inkloom Cloud Suite today before your competitors crush you. "
        "We guarantee a 10x reduction in operational costs."
    )
    result = AIAuditEngine.run_audit(
        content_text=violating_text,
        content_id="sub_violate_1",
    )
    assert result.overall_status in (OverallAuditStatus.NEEDS_REVIEW, OverallAuditStatus.NON_COMPLIANT)
    assert result.summary.total_findings >= 3

    categories = [f.category for f in result.findings]
    assert FindingCategory.TERMINOLOGY in categories
    assert FindingCategory.TONE_VOICE in categories
    assert FindingCategory.CLAIM_VERIFICATION in categories


def test_claim_verification_distinguishes_unverified_from_contradicted():
    unverified_text = "We provide a 10x faster review time."
    res_unverified = AIAuditEngine.run_audit(content_text=unverified_text, content_id="test_unv")
    claim_finding = next(f for f in res_unverified.findings if f.category == FindingCategory.CLAIM_VERIFICATION)
    assert claim_finding.source_reference.verification_status == VerificationStatus.UNVERIFIED
    assert claim_finding.source_reference.source_url is None

    contradicted_text = "Our platform processes infinite video in 0 seconds."
    res_contra = AIAuditEngine.run_audit(content_text=contradicted_text, content_id="test_contra")
    contra_finding = next(f for f in res_contra.findings if f.category == FindingCategory.CLAIM_VERIFICATION)
    assert contra_finding.source_reference.verification_status == VerificationStatus.CONTRADICTED
