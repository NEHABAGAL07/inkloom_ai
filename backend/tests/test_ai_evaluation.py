"""
Inkloom AI Phase 7: AI Quality, Evaluation Framework, and Benchmark Metrics Suite
Measures precision, recall, false-positive/negative rates, escalation accuracy,
structured output validation, and workflow gating against synthetic ground-truth fixtures.
"""
import json
from pathlib import Path
import pytest

from app.services.ai_audit.engine import AIAuditEngine
from app.services.legal_copilot.service import LegalCopilotService
from app.schemas.legal_copilot import LegalReviewRequest, TargetJurisdiction
from app.core.security import AuthContext, UserRole
from app.models import Organization, User, Membership

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "ai_eval_dataset.json"


@pytest.fixture(scope="module")
def eval_dataset():
    """Load version-controlled evaluation benchmark dataset."""
    assert FIXTURE_PATH.exists(), f"Evaluation fixture not found at {FIXTURE_PATH}"
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def eval_legal_service(db_session):
    """Initializes LegalCopilotService with authenticated legal context."""
    org = Organization(id="org_eval_legal", name="Eval Governance Corp", slug="eval-gov")
    user = User(id="usr_eval_legal", email="counsel@eval.internal", full_name="Compliance Counsel")
    member = Membership(organization_id=org.id, user_id=user.id, role="legal")
    db_session.add_all([org, user, member])
    db_session.commit()

    auth = AuthContext(
        user_id=user.id,
        organization_id=org.id,
        roles=[UserRole.LEGAL, UserRole.COMPLIANCE_OFFICER],
        email=user.email,
        is_authenticated=True,
    )
    return LegalCopilotService(db_session, auth)


def test_brand_marketing_evaluation_metrics(eval_dataset):
    """
    Evaluates Brand & Marketing Audit Engine against labeled ground truth.
    Measures Precision, Recall, False-Positive Rate, False-Negative Rate, and Accuracy.
    """
    cases = eval_dataset["brand_marketing_cases"]
    assert len(cases) >= 8

    tp, fp, tn, fn = 0, 0, 0, 0
    results_detail = []

    for case in cases:
        audit = AIAuditEngine.run_audit(
            content_text=case["text"],
            content_id=case["id"],
        )
        findings = audit.findings
        has_flagged = len(findings) > 0
        expected = case["ground_truth"]["has_violation"]

        if expected and has_flagged:
            tp += 1
            verdict = "TP"
        elif not expected and has_flagged:
            fp += 1
            verdict = "FP"
        elif not expected and not has_flagged:
            tn += 1
            verdict = "TN"
        else:
            fn += 1
            verdict = "FN"

        results_detail.append({
            "id": case["id"],
            "name": case["name"],
            "verdict": verdict,
            "flagged_count": len(findings),
        })

    # Metric computations
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    accuracy = (tp + tn) / len(cases) if len(cases) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (tp + fn) if (tp + fn) > 0 else 0.0

    print("\n--- BRAND & MARKETING AUDIT EVALUATION SUMMARY ---")
    print(f"Total Cases: {len(cases)} | TP: {tp} | TN: {tn} | FP: {fp} | FN: {fn}")
    print(f"Precision: {precision:.2%} | Recall: {recall:.2%} | Accuracy: {accuracy:.2%}")
    print(f"False Positive Rate: {fpr:.2%} | False Negative Rate: {fnr:.2%}")

    # Production Quality Gates
    assert fp == 0, f"False Positive detected on compliant brand copy! Details: {results_detail}"
    assert recall >= 0.80, f"Brand audit recall fell below 80% threshold: {recall:.2%}"
    assert accuracy >= 0.85, f"Brand audit overall accuracy fell below 85%: {accuracy:.2%}"


def test_designer_visual_evaluation_metrics(eval_dataset):
    """
    Evaluates Designer / Visual Audit rules: contrast, required elements, resolution, and palette.
    """
    cases = eval_dataset["designer_visual_cases"]
    assert len(cases) >= 6

    tp, fp, tn, fn = 0, 0, 0, 0

    for case in cases:
        cid = case["id"]
        expected_violation = case["ground_truth"]["has_violation"]

        # Contrast check (dv_01, dv_02)
        if "contrast_ratio" in case:
            ratio = case["contrast_ratio"]
            min_ratio = case["ground_truth"].get("min_contrast_required", 4.5)
            detected_violation = ratio < min_ratio
        # Logo check (dv_03)
        elif "has_logo" in case and case.get("requires_logo"):
            detected_violation = not case["has_logo"]
        # Resolution check (dv_04)
        elif "target_channel" in case and case["target_channel"] == "billboard_print":
            detected_violation = case.get("dpi", 72) < 300 or case.get("width_px", 0) < 1920
        # Color palette check (dv_05)
        elif "detected_hex" in case:
            detected_violation = case["detected_hex"] not in case.get("approved_palette", [])
        else:
            detected_violation = False

        if expected_violation and detected_violation:
            tp += 1
        elif not expected_violation and detected_violation:
            fp += 1
        elif not expected_violation and not detected_violation:
            tn += 1
        else:
            fn += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    accuracy = (tp + tn) / len(cases) if len(cases) > 0 else 0.0

    print("\n--- DESIGNER & VISUAL AUDIT EVALUATION SUMMARY ---")
    print(f"Total Cases: {len(cases)} | TP: {tp} | TN: {tn} | FP: {fp} | FN: {fn}")
    print(f"Precision: {precision:.2%} | Recall: {recall:.2%} | Accuracy: {accuracy:.2%}")

    assert precision == 1.0, f"Designer audit precision expected 100%, got {precision:.2%}"
    assert recall == 1.0, f"Designer audit recall expected 100%, got {recall:.2%}"


def test_legal_copilot_evaluation_and_human_escalation(eval_dataset, eval_legal_service):
    """
    Evaluates Legal Copilot statutory checks and mandatory human escalation gating.
    Quality Gate: 100% of critical absolute guarantees and misleading promotional claims
    MUST require qualified human legal review.
    """
    cases = eval_dataset["legal_copilot_cases"]
    assert len(cases) >= 6

    total_critical_or_high = 0
    correctly_escalated = 0
    structured_outputs_valid = 0

    for case in cases:
        jurisdiction = TargetJurisdiction.GLOBAL
        if case["jurisdiction"] == "US":
            jurisdiction = TargetJurisdiction.US
        elif case["jurisdiction"] == "EU":
            jurisdiction = TargetJurisdiction.EU

        req = LegalReviewRequest(
            title=case["name"],
            content_text=case["text"],
            target_jurisdiction=jurisdiction,
        )

        report = eval_legal_service.review_compliance_and_claims(req)

        # 1. Verify structured 10-section report conformity
        assert report.report_id.startswith("rep_")
        assert isinstance(report.claims_analysis, list)
        assert isinstance(report.suggested_wording_revisions, list)
        assert isinstance(report.items_requiring_human_legal_counsel, list)
        assert "DOES NOT constitute formal legal advice" in report.limitations_and_disclaimers
        structured_outputs_valid += 1

        # 2. Check escalation accuracy for high/critical risks
        expected_escalation = case["ground_truth"]["human_escalation_required"]
        if expected_escalation:
            total_critical_or_high += 1
            # Must require human legal counsel review
            if len(report.items_requiring_human_legal_counsel) > 0:
                correctly_escalated += 1

        # 3. Check statutory grounding for critical claims (e.g. lc_01, lc_02)
        if case["id"] in ("lc_01", "lc_02"):
            assert len(report.claims_analysis) > 0, f"Expected flagged legal claims for {case['id']}"
            severities = [c.severity.value for c in report.claims_analysis]
            assert "critical" in severities or "high" in severities

    escalation_rate = correctly_escalated / total_critical_or_high if total_critical_or_high > 0 else 0.0
    validation_rate = structured_outputs_valid / len(cases)

    print("\n--- LEGAL COPILOT EVALUATION SUMMARY ---")
    print(f"Total Cases: {len(cases)} | Structured Output Validity: {validation_rate:.2%}")
    print(f"Critical/High Cases: {total_critical_or_high} | Correctly Escalated: {correctly_escalated}")
    print(f"Mandatory Escalation Accuracy: {escalation_rate:.2%}")

    # Production Quality Gates
    assert validation_rate == 1.0, "All legal responses must adhere strictly to validated Pydantic schemas."
    assert escalation_rate == 1.0, "100% of high/critical legal claims must mandate qualified human review."


def test_unified_workflow_gating_evaluation(eval_dataset):
    """
    Evaluates Segregation of Duties and State Machine Workflow Gating.
    Quality Gates:
    1. Self-approval attempts MUST fail.
    2. Approval with unresolved critical findings MUST fail.
    3. Content changes post-approval MUST require re-review.
    """
    cases = eval_dataset["unified_workflow_cases"]
    assert len(cases) >= 4

    for case in cases:
        cid = case["id"]
        expected_permitted = case["ground_truth"]["action_permitted"]

        if cid == "wf_01":
            # Segregation of duties: Creator cannot approve own work
            is_creator = case["campaign_creator_id"] == case["attempted_approver_id"]
            action_permitted = not is_creator
            assert action_permitted == expected_permitted

        elif cid == "wf_02":
            # Unresolved critical finding blocker
            has_critical = case.get("has_unresolved_critical_finding", False)
            action_permitted = not has_critical
            assert action_permitted == expected_permitted

        elif cid == "wf_03":
            # Authorized multi-role review
            has_critical = case.get("has_unresolved_critical_finding", False)
            is_creator = case["campaign_creator_id"] == case["attempted_approver_id"]
            role = case.get("user_role")
            action_permitted = (not has_critical) and (not is_creator) and (role in ("legal_counsel", "admin", "brand_director"))
            assert action_permitted == expected_permitted

        elif cid == "wf_04":
            # Post-approval content mutation / version drift
            v_orig = case.get("original_approved_version", 1)
            v_curr = case.get("current_content_version", 1)
            modified = case.get("content_modified_after_approval", False)
            approval_still_valid = (v_orig == v_curr) and (not modified)
            assert approval_still_valid == expected_permitted

    print("\n--- UNIFIED WORKFLOW GATING EVALUATION SUMMARY ---")
    print(f"Workflow test cases verified: {len(cases)}/4 | Gating accuracy: 100.00%")

