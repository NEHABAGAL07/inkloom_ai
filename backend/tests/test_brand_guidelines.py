import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models import Organization, User, Membership, BrandGuideline
from app.database.session import SessionLocal

client = TestClient(app)


def test_brand_guideline_permissions_and_lifecycle():
    db = SessionLocal()
    try:
        # 1. Admin / Manager context
        admin_token = create_access_token({"sub": "user_acme_admin", "org_id": "org_acme_cloud"})
        headers_admin = {"Authorization": f"Bearer {admin_token}", "X-Tenant-Id": "org_acme_cloud"}

        # 2. Employee context (Marketing creator)
        employee_token = create_access_token({"sub": "user_acme_marketing", "org_id": "org_acme_cloud"})
        headers_emp = {"Authorization": f"Bearer {employee_token}", "X-Tenant-Id": "org_acme_cloud"}

        # A. Manager gets profile
        res_admin = client.get("/api/v1/guidelines/profile", headers=headers_admin)
        assert res_admin.status_code == 200
        admin_profile = res_admin.json()
        assert admin_profile["is_manager"] is True
        assert admin_profile["published_data"] is not None

        # B. Employee gets profile - must have is_manager=False and draft_data=None
        res_emp = client.get("/api/v1/guidelines/profile", headers=headers_emp)
        assert res_emp.status_code == 200
        emp_profile = res_emp.json()
        assert emp_profile["is_manager"] is False
        assert emp_profile["draft_data"] is None
        assert emp_profile["published_data"] is not None

        # C. Employee cannot update draft (403 Forbidden)
        res_emp_put = client.put(
            "/api/v1/guidelines/draft",
            headers=headers_emp,
            json={"draft_data": {"identity": {"brand_name": "Hacked Brand"}}},
        )
        assert res_emp_put.status_code == 403

        # D. Manager can update draft
        import time
        unique_draft = f"Next-Gen Zero-Trust Multi-Cloud Fabric {time.time()}"
        draft_update = admin_profile["published_data"].copy()
        draft_update["identity"]["tagline"] = unique_draft
        res_admin_put = client.put(
            "/api/v1/guidelines/draft",
            headers=headers_admin,
            json={"draft_data": draft_update},
        )
        assert res_admin_put.status_code == 200
        assert res_admin_put.json()["status"] == "changes_pending"
        assert res_admin_put.json()["draft_data"]["identity"]["tagline"] == unique_draft

        # E. Employee still sees old published tagline, NOT the unpublished draft!
        res_emp_after = client.get("/api/v1/guidelines/profile", headers=headers_emp)
        assert res_emp_after.json()["published_data"]["identity"]["tagline"] != unique_draft

        # F. Employee cannot publish (403 Forbidden)
        res_emp_pub = client.post(
            "/api/v1/guidelines/publish",
            headers=headers_emp,
            json={"version": f"v_{int(time.time())}", "changelog": "Unauthorized update"},
        )
        assert res_emp_pub.status_code == 403

        # G. Manager publishes new version
        new_version_tag = f"2026.2.{int(time.time()) % 1000}"
        res_admin_pub = client.post(
            "/api/v1/guidelines/publish",
            headers=headers_admin,
            json={"version": new_version_tag, "changelog": "Updated tagline for enterprise positioning."},
        )
        assert res_admin_pub.status_code == 200
        assert res_admin_pub.json()["version"] == new_version_tag
        assert res_admin_pub.json()["status"] == "published"

        # H. Now employee sees the newly published guidelines
        res_emp_final = client.get("/api/v1/guidelines/profile", headers=headers_emp)
        assert res_emp_final.json()["published_data"]["identity"]["tagline"] == unique_draft

        # I. Check version history
        res_versions = client.get("/api/v1/guidelines/versions", headers=headers_admin)
        assert res_versions.status_code == 200
        versions = res_versions.json()
        assert len(versions) >= 1
        assert any(v["version"] == new_version_tag for v in versions)

        # J. Check effective settings calculation
        res_eff = client.get("/api/v1/guidelines/effective?media_type=social_media", headers=headers_admin)
        assert res_eff.status_code == 200
        eff = res_eff.json()
        assert "primary_color" in eff["effective_settings"]
        assert "brand_name" in eff["effective_settings"]
    finally:
        db.close()
