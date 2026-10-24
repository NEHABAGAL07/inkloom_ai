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

        # 5. Invite Legal, Marketing, and Designer members to verify RBAC
        # 5a. Legal Department Member
        inv_legal = client.post(
            f"/api/v1/organizations/{org_id}/invitations",
            headers=mgr_headers,
            json={"email": f"legal_{uid}@acmetest.com", "role": "compliance_officer"},
        )
        assert inv_legal.status_code == 201
        token_legal = inv_legal.json()["token"]
        acc_legal = client.post("/api/v1/invitations/accept", json={
            "token": token_legal,
            "full_name": "Elena Legal",
            "password": "password123",
        })
        assert acc_legal.status_code == 200
        legal_headers = {"Authorization": f"Bearer {acc_legal.json()['access_token']}", "X-Tenant-Id": org_id}

        # 5b. Marketing Department Member
        inv_mkt = client.post(
            f"/api/v1/organizations/{org_id}/invitations",
            headers=mgr_headers,
            json={"email": f"marketing_{uid}@acmetest.com", "role": "marketing"},
        )
        assert inv_mkt.status_code == 201
        token_mkt = inv_mkt.json()["token"]
        acc_mkt = client.post("/api/v1/invitations/accept", json={
            "token": token_mkt,
            "full_name": "Maya Marketing",
            "password": "password123",
        })
        assert acc_mkt.status_code == 200
        mkt_headers = {"Authorization": f"Bearer {acc_mkt.json()['access_token']}", "X-Tenant-Id": org_id}

        # 5c. Designer Member
        inv_des = client.post(
            f"/api/v1/organizations/{org_id}/invitations",
            headers=mgr_headers,
            json={"email": f"designer_{uid}@acmetest.com", "role": "designer"},
        )
        assert inv_des.status_code == 201
        token_des = inv_des.json()["token"]
        acc_des = client.post("/api/v1/invitations/accept", json={
            "token": token_des,
            "full_name": "Leo Designer",
            "password": "password123",
        })
        assert acc_des.status_code == 200
        des_headers = {"Authorization": f"Bearer {acc_des.json()['access_token']}", "X-Tenant-Id": org_id}

        # 6. Legal Department adds improvement comment -> SUCCESS (201)
        legal_comment_res = client.post(
            f"/api/v1/submissions/{sub_id}/comments",
            headers=legal_headers,
            json={
                "comment_text": "Statutory footnote required regarding comparative claims.",
                "category": "legal_compliance",
            },
        )
        assert legal_comment_res.status_code == 201
        legal_comment_id = legal_comment_res.json()["id"]

        # 7. Marketing Department adds improvement comment -> SUCCESS (201)
        mkt_comment_res = client.post(
            f"/api/v1/submissions/{sub_id}/comments",
            headers=mkt_headers,
            json={
                "comment_text": "Update call-to-action to match active Q4 branding.",
                "category": "copy_tone",
            },
        )
        assert mkt_comment_res.status_code == 201
        mkt_comment_id = mkt_comment_res.json()["id"]

        # 8. Designer tries to add suggestion/improvement comment -> FORBIDDEN (403)
        des_comment_res = client.post(
            f"/api/v1/submissions/{sub_id}/comments",
            headers=des_headers,
            json={
                "comment_text": "Designer attempting to post suggestion box comment.",
                "category": "visual_design",
            },
        )
        assert des_comment_res.status_code == 403
        assert "Only Manager, Legal Department, and Marketing Department" in des_comment_res.json()["detail"]

        # 9. Designer views all comments on the uploaded design -> SUCCESS (200)
        des_view_res = client.get(f"/api/v1/submissions/{sub_id}/comments", headers=des_headers)
        assert des_view_res.status_code == 200
        assert des_view_res.json()["total_count"] == 3
        assert des_view_res.json()["open_count"] == 2
        assert des_view_res.json()["resolved_count"] == 1

        # 10. Designer marks the legal comment as done (✓) -> SUCCESS (200)
        des_resolve_res = client.patch(
            f"/api/v1/submissions/{sub_id}/comments/{legal_comment_id}/resolve",
            headers=des_headers,
            json={
                "is_resolved": True,
                "resolution_note": "Added certified benchmark disclaimer footnote in 10pt font.",
            },
        )
        assert des_resolve_res.status_code == 200
        assert des_resolve_res.json()["is_resolved"] is True
        assert des_resolve_res.json()["resolved_by"] == "Leo Designer"

        # Verify updated counts
        final_list = client.get(f"/api/v1/submissions/{sub_id}/comments", headers=des_headers).json()
        assert final_list["resolved_count"] == 2
        assert final_list["open_count"] == 1

