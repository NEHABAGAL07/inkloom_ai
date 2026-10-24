import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import ContentSubmission, ContentComment, Organization, User, Membership


def test_designer_comments_and_tick_resolution(db_session):
    uid = uuid.uuid4().hex[:8]
    with TestClient(app) as client:
        # Register Org
        reg = client.post("/api/v1/auth/register", json={
            "email": f"manager_{uid}@acmetest.com",
            "password": "password123",
            "full_name": "Alice Manager",
            "organization_name": f"Acme Test {uid}",
            "industry": "Cloud",
        })
        assert reg.status_code == 201
        mgr_token = reg.json()["access_token"]
        org_id = reg.json()["active_organization_id"]

        mgr_headers = {"Authorization": f"Bearer {mgr_token}", "X-Tenant-Id": org_id}

        # Create submission (e.g. designer uploaded an image asset)
        sub_res = client.post(
            "/api/v1/submissions",
            headers=mgr_headers,
            json={
                "title": "Q4 Campaign Hero Banner",
                "content_type": "image",
                "initial_text": "Hero image banner with logo and promo headline.",
            },
        )
        assert sub_res.status_code == 201
        sub_id = sub_res.json()["id"]

        # 1. Post a review comment
        res_post = client.post(
            f"/api/v1/submissions/{sub_id}/comments",
            headers=mgr_headers,
            json={
                "comment_text": "Please increase contrast ratio on headline banner text to meet WCAG AA.",
                "category": "visual_design",
            },
        )
        assert res_post.status_code == 201
        comment = res_post.json()
        assert comment["comment_text"] == "Please increase contrast ratio on headline banner text to meet WCAG AA."
        assert comment["is_resolved"] is False

        # 2. List comments - check open vs resolved counts
        list_res = client.get(f"/api/v1/submissions/{sub_id}/comments", headers=mgr_headers)
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total_count"] == 1
        assert list_data["open_count"] == 1
        assert list_data["resolved_count"] == 0

        # 3. Designer fixes the issue: click tick sign to resolve
        resolve_res = client.patch(
            f"/api/v1/submissions/{sub_id}/comments/{comment['id']}/resolve",
            headers=mgr_headers,
            json={
                "is_resolved": True,
                "resolution_note": "Adjusted headline typography contrast ratio from 3.2:1 to 4.8:1.",
            },
        )
        assert resolve_res.status_code == 200
        resolved_data = resolve_res.json()
        assert resolved_data["is_resolved"] is True
        assert resolved_data["resolution_note"] == "Adjusted headline typography contrast ratio from 3.2:1 to 4.8:1."

        # 4. List comments again - check tracking status updated
        list_res_2 = client.get(f"/api/v1/submissions/{sub_id}/comments", headers=mgr_headers)
        assert list_res_2.status_code == 200
        list_data_2 = list_res_2.json()
        assert list_data_2["open_count"] == 0
        assert list_data_2["resolved_count"] == 1
