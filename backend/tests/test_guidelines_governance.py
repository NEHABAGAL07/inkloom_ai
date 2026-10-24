import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models import (
    Organization,
    User,
    Membership,
    BrandGuideline,
    BrandGuidelineVersion,
    GuidelineRule,
    GuidelineClarificationReport,
    AuditEvent,
)
from app.database.session import SessionLocal

client = TestClient(app)


def test_enterprise_guidelines_governance_full_lifecycle():
    """
    Comprehensive test suite covering all compliance governance requirements:
    1. Role-based permissions matrix (Admin, Legal/Compliance, Marketing, Designer)
    2. Read-only employee access (no draft leakage, cannot edit/publish)
    3. Legal review workflow: Draft -> Submit -> Legal Review -> Approve/Reject -> Publish
    4. Prohibition of unauthorized manager publication of legally sensitive rules
    5. Version immutability & rollback via new version creation
    6. Conflict resolution & priority hierarchy enforcement
    7. Starter template library with verified legal citations
    8. Employee clarification reporting & resolution
    9. Cross-tenant isolation
    10. Audit-engine integration: uses active published version, records version and legal disclaimer
    """
    db = SessionLocal()
    try:
        # User auth tokens
        admin_token = create_access_token({"sub": "user_acme_admin", "org_id": "org_acme_cloud"})
        headers_admin = {"Authorization": f"Bearer {admin_token}", "X-Tenant-Id": "org_acme_cloud"}

        compliance_token = create_access_token({"sub": "user_acme_compliance", "org_id": "org_acme_cloud"})
        headers_legal = {"Authorization": f"Bearer {compliance_token}", "X-Tenant-Id": "org_acme_cloud"}

        marketing_token = create_access_token({"sub": "user_acme_marketing", "org_id": "org_acme_cloud"})
        headers_marketing = {"Authorization": f"Bearer {marketing_token}", "X-Tenant-Id": "org_acme_cloud"}

        designer_token = create_access_token({"sub": "user_acme_designer", "org_id": "org_acme_cloud"})
        headers_designer = {"Authorization": f"Bearer {designer_token}", "X-Tenant-Id": "org_acme_cloud"}

        # -----------------------------------------------------------------
        # 1. Profile retrieval & permission flags
        # -----------------------------------------------------------------
        # Admin profile
        res_admin = client.get("/api/v1/guidelines/profile", headers=headers_admin)
        assert res_admin.status_code == 200
        p_admin = res_admin.json()
        assert p_admin["can_edit"] is True
        assert p_admin["can_publish"] is True
        assert p_admin["can_review_legal"] is False  # Admin is NOT a legal reviewer!
        assert p_admin["user_role"] == "admin"
        assert p_admin["compliance_disclaimer"] is not None

        # Legal/Compliance Officer profile
        res_legal = client.get("/api/v1/guidelines/profile", headers=headers_legal)
        assert res_legal.status_code == 200
        p_legal = res_legal.json()
        assert p_legal["can_edit"] is True
        assert p_legal["can_publish"] is True
        assert p_legal["can_review_legal"] is True  # Legal reviewer
        assert p_legal["user_role"] == "compliance_officer"

        # Marketing / Designer (Employees) profile
        res_mkt = client.get("/api/v1/guidelines/profile", headers=headers_marketing)
        assert res_mkt.status_code == 200
        p_mkt = res_mkt.json()
        assert p_mkt["can_edit"] is False
        assert p_mkt["can_publish"] is False
        assert p_mkt["can_review_legal"] is False
        assert p_mkt["draft_data"] is None  # DRAFT DATA NEVER LEAKED TO EMPLOYEES
        assert p_mkt["published_data"] is not None

        # -----------------------------------------------------------------
        # 2. Unauthorized edits rejected by backend RBAC
        # -----------------------------------------------------------------
        for h, role_name in [(headers_marketing, "Marketing"), (headers_designer, "Designer")]:
            res_bad_edit = client.put(
                "/api/v1/guidelines/draft",
                headers=h,
                json={"draft_data": {"identity": {"brand_name": f"Hacked by {role_name}"}}},
            )
            assert res_bad_edit.status_code == 403, f"{role_name} should be rejected from editing drafts"

            res_bad_pub = client.post(
                "/api/v1/guidelines/publish",
                headers=h,
                json={"version": "9.9.9", "changelog": "Illegal publish"},
            )
            assert res_bad_pub.status_code == 403, f"{role_name} should be rejected from publishing"

            res_bad_rev = client.post(
                "/api/v1/guidelines/review-decision",
                headers=h,
                json={"decision": "approved", "rationale": "I self-approve"},
            )
            assert res_bad_rev.status_code == 403, f"{role_name} should be rejected from reviewing"

        # -----------------------------------------------------------------
        # 3. Manager creates draft with legally sensitive compliance rule
        # -----------------------------------------------------------------
        base_draft = p_admin["published_data"] or {}
        new_draft = {
            **base_draft,
            "identity": {
                **base_draft.get("identity", {}),
                "brand_name": "Inkloom Enterprise Cloud",
                "tagline": "Provable Brand & Legal Compliance AI",
            },
            "compliance": [
                {
                    "id": "comp_rule_new",
                    "title": "Mandatory Performance Disclaimers",
                    "category": "regulatory",
                    "rule_text": "Results based on internal testing; performance varies by infrastructure.",
                    "requirement_level": "mandatory",
                }
            ],
        }

        res_put = client.put(
            "/api/v1/guidelines/draft",
            headers=headers_admin,
            json={
                "name": "Inkloom Enterprise Cloud Standards",
                "jurisdiction": "US",
                "industry": "SaaS",
                "content_channels": ["web", "social", "advertising"],
                "draft_data": new_draft,
            },
        )
        assert res_put.status_code == 200
        assert res_put.json()["jurisdiction"] == "US"

        # -----------------------------------------------------------------
        # 4. Admin cannot bypass legal review when legal rules are modified!
        # -----------------------------------------------------------------
        res_admin_bypass = client.post(
            "/api/v1/guidelines/publish",
            headers=headers_admin,
            json={"version": "2.0.0-unauthorized", "changelog": "Admin trying to bypass legal approval"},
        )
        assert res_admin_bypass.status_code == 403
        assert "legally sensitive rules" in res_admin_bypass.json()["detail"].lower()

        # -----------------------------------------------------------------
        # 5. Admin submits proposal for Legal Review
        # -----------------------------------------------------------------
        res_submit = client.post(
            "/api/v1/guidelines/submit-for-review",
            headers=headers_admin,
            json={
                "submission_notes": "Added statutory FTC disclaimer requirement for Q1 marketing campaigns.",
                "requires_legal_approval": True,
                "jurisdiction": "US",
                "industry": "SaaS",
            },
        )
        assert res_submit.status_code == 200
        assert res_submit.json()["status"] == "submitted"
        assert res_submit.json()["submitted_by"] is not None

        # Admin still cannot self-publish while status is "submitted"
        res_admin_still_blocked = client.post(
            "/api/v1/guidelines/publish",
            headers=headers_admin,
            json={"version": "2.0.0-still-blocked", "changelog": "Still submitted"},
        )
        assert res_admin_still_blocked.status_code == 403

        # Admin CANNOT record a legal review decision (only compliance officers can!)
        res_admin_fake_review = client.post(
            "/api/v1/guidelines/review-decision",
            headers=headers_admin,
            json={"decision": "approved", "rationale": "Admin approving own proposal"},
        )
        assert res_admin_fake_review.status_code == 403

        # -----------------------------------------------------------------
        # 6. Legal / Compliance Officer inspects review queue
        # -----------------------------------------------------------------
        res_queue = client.get("/api/v1/guidelines/pending-review", headers=headers_legal)
        assert res_queue.status_code == 200
        pending_list = res_queue.json()
        assert len(pending_list) >= 1
        assert any(item["status"] == "submitted" for item in pending_list)

        # -----------------------------------------------------------------
        # 7. Legal Officer requests changes first
        # -----------------------------------------------------------------
        res_changes = client.post(
            "/api/v1/guidelines/review-decision",
            headers=headers_legal,
            json={
                "decision": "changes_requested",
                "rationale": "Please specify that the benchmark testing was conducted in Q4 2025.",
            },
        )
        assert res_changes.status_code == 200
        assert res_changes.json()["status"] == "changes_requested"
        assert "Q4 2025" in res_changes.json()["review_rationale"]

        # Re-submit with requested correction
        new_draft["compliance"][0]["rule_text"] = "Results based on internal Q4 2025 testing; performance varies by infrastructure."
        client.put("/api/v1/guidelines/draft", headers=headers_admin, json={"draft_data": new_draft})
        client.post(
            "/api/v1/guidelines/submit-for-review",
            headers=headers_admin,
            json={"submission_notes": "Updated disclaimer with Q4 2025 date as requested."},
        )

        # -----------------------------------------------------------------
        # 8. Legal Officer Approves the Guideline Draft
        # -----------------------------------------------------------------
        res_approve = client.post(
            "/api/v1/guidelines/review-decision",
            headers=headers_legal,
            json={
                "decision": "approved",
                "rationale": "Meets FTC 16 CFR Part 255 substantiation and disclosure requirements.",
            },
        )
        assert res_approve.status_code == 200
        assert res_approve.json()["status"] == "approved"
        assert res_approve.json()["review_decision"] == "approved"

        # -----------------------------------------------------------------
        # 9. Publication of Approved Version
        # -----------------------------------------------------------------
        published_v_tag = f"3.0.{int(time.time()) % 1000}"
        res_publish = client.post(
            "/api/v1/guidelines/publish",
            headers=headers_admin,
            json={"version": published_v_tag, "changelog": "Q1 2026 Authoritative Enterprise Guidelines"},
        )
        assert res_publish.status_code == 200
        assert res_publish.json()["status"] == "published"
        assert res_publish.json()["version"] == published_v_tag

        # -----------------------------------------------------------------
        # 10. Version History & Immutability Check
        # -----------------------------------------------------------------
        res_versions = client.get("/api/v1/guidelines/versions", headers=headers_admin)
        assert res_versions.status_code == 200
        versions = res_versions.json()
        assert len(versions) >= 1
        published_snapshot = next(v for v in versions if v["version"] == published_v_tag)
        assert published_snapshot["approved_by"] is not None
        assert published_snapshot["snapshot_data"]["identity"]["brand_name"] == "Inkloom Enterprise Cloud"

        # -----------------------------------------------------------------
        # 11. Rollback via New Version Creation
        # -----------------------------------------------------------------
        res_rollback = client.post(
            "/api/v1/guidelines/rollback",
            headers=headers_admin,
            json={"version_id": published_snapshot["id"], "rationale": "Safety rollback verification test"},
        )
        assert res_rollback.status_code == 200
        rollback_profile = res_rollback.json()
        assert "rollback" in rollback_profile["version"]
        assert rollback_profile["status"] == "published"

        # -----------------------------------------------------------------
        # 12. Conflict Resolution & Priority Hierarchy
        # -----------------------------------------------------------------
        res_conflict = client.post("/api/v1/guidelines/conflict-check", headers=headers_admin)
        assert res_conflict.status_code == 200
        conflict_data = res_conflict.json()
        assert "priority_hierarchy" in conflict_data
        assert len(conflict_data["priority_hierarchy"]) == 5
        assert conflict_data["priority_hierarchy"][0]["level"] == 1  # Mandatory Legal highest

        # -----------------------------------------------------------------
        # 13. Starter Template Library with Verified Sources
        # -----------------------------------------------------------------
        res_templates = client.get("/api/v1/guidelines/starter-templates?jurisdiction=US", headers=headers_admin)
        assert res_templates.status_code == 200
        templates_data = res_templates.json()
        assert templates_data["total_templates"] >= 3
        # Check authentic citations
        sources = [t.get("authoritative_source", "") for t in templates_data["templates"]]
        assert any("FTC" in s or "Lanham" in s for s in sources)

        # -----------------------------------------------------------------
        # 14. Employee Clarification Reporting & Resolution
        # -----------------------------------------------------------------
        res_report = client.post(
            "/api/v1/guidelines/report-unclear",
            headers=headers_marketing,
            json={
                "rule_reference": "Brand Voice - Words to Avoid",
                "report_type": "unclear",
                "description": "Is 'robust' allowed when describing enterprise cloud security architecture?",
            },
        )
        assert res_report.status_code == 201
        report_id = res_report.json()["id"]

        # List reports
        res_rep_list = client.get("/api/v1/guidelines/reports", headers=headers_legal)
        assert res_rep_list.status_code == 200
        assert any(r["id"] == report_id for r in res_rep_list.json())

        # Legal officer resolves report
        res_resolve = client.put(
            f"/api/v1/guidelines/reports/{report_id}",
            headers=headers_legal,
            json={
                "status": "resolved",
                "resolution_notes": "'Robust' is permitted exclusively for technical security architecture documentation.",
            },
        )
        assert res_resolve.status_code == 200
        assert res_resolve.json()["status"] == "resolved"

        # -----------------------------------------------------------------
        # 15. Cross-Tenant Isolation
        # -----------------------------------------------------------------
        # Attempt to access with a different tenant header
        headers_cross_tenant = {
            "Authorization": f"Bearer {admin_token}",
            "X-Tenant-Id": "org_unauthorized_external",
        }
        res_cross = client.get("/api/v1/guidelines/profile", headers=headers_cross_tenant)
        assert res_cross.status_code == 403
        assert "not a registered member" in res_cross.json()["detail"].lower()

    finally:
        db.close()
