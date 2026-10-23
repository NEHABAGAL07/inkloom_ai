import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_multi_tenant_registration_and_login(db_session):
    """Verifies that a new organization can register and authenticate."""
    uid = uuid.uuid4().hex[:8]
    email = f"cto_{uid}@teststartup.io"
    with TestClient(app) as raw_client:
        reg_payload = {
            "email": email,
            "password": "securepassword123",
            "full_name": "Test CTO",
            "organization_name": f"Test Startup {uid}",
            "industry": "FinTech",
        }
        res = raw_client.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["active_role"] == "admin"
        assert len(data["memberships"]) >= 1

        # Login with the newly registered user
        login_payload = {
            "email": email,
            "password": "securepassword123",
        }
        res_login = raw_client.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200
        login_data = res_login.json()
        assert "access_token" in login_data
        assert login_data["user"]["email"] == email


def test_tenant_data_isolation(db_session):
    """Verifies that users from Org A cannot access or query Org B's private submissions."""
    uid = uuid.uuid4().hex[:8]
    with TestClient(app) as raw_client:
        # Register Org A
        reg_a = raw_client.post("/api/v1/auth/register", json={
            "email": f"admin_{uid}@alpha.com",
            "password": "password123",
            "full_name": "Alpha Admin",
            "organization_name": f"Company Alpha {uid}",
        })
        assert reg_a.status_code == 201
        token_a = reg_a.json()["access_token"]
        org_id_a = reg_a.json()["active_organization_id"]

        # Register Org B
        reg_b = raw_client.post("/api/v1/auth/register", json={
            "email": f"admin_{uid}@beta.com",
            "password": "password123",
            "full_name": "Beta Admin",
            "organization_name": f"Company Beta {uid}",
        })
        assert reg_b.status_code == 201
        token_b = reg_b.json()["access_token"]
        org_id_b = reg_b.json()["active_organization_id"]

        # Create submission in Org B
        sub_b_res = raw_client.post(
            "/api/v1/submissions",
            headers={"Authorization": f"Bearer {token_b}", "X-Tenant-Id": org_id_b},
            json={"title": "Top Secret Beta Document", "content_type": "text", "initial_text": "Secret content"},
        )
        assert sub_b_res.status_code == 201
        sub_b_id = sub_b_res.json()["id"]

        # User A lists submissions -> sub_b must NOT appear
        list_a = raw_client.get(
            "/api/v1/submissions",
            headers={"Authorization": f"Bearer {token_a}", "X-Tenant-Id": org_id_a},
        )
        assert list_a.status_code == 200
        submissions_a = list_a.json()
        assert not any(s["id"] == sub_b_id for s in submissions_a)

        # User A attempts IDOR direct access to Org B's submission -> 404
        idor_res = raw_client.get(
            f"/api/v1/submissions/{sub_b_id}",
            headers={"Authorization": f"Bearer {token_a}", "X-Tenant-Id": org_id_a},
        )
        assert idor_res.status_code == 404

        # User A attempts to forge X-Tenant-Id to Org B using User A's token -> 403 Forbidden!
        tamper_res = raw_client.get(
            "/api/v1/submissions",
            headers={"Authorization": f"Bearer {token_a}", "X-Tenant-Id": org_id_b},
        )
        assert tamper_res.status_code == 403


def test_invitation_lifecycle(db_session):
    """Verifies creating, inspecting, and accepting an employee invitation."""
    uid = uuid.uuid4().hex[:8]
    with TestClient(app) as raw_client:
        reg_res = raw_client.post("/api/v1/auth/register", json={
            "email": f"boss_{uid}@invitecorp.io",
            "password": "password123",
            "full_name": "Boss Inviter",
            "organization_name": f"Invite Corp {uid}",
        })
        assert reg_res.status_code == 201
        admin_token = reg_res.json()["access_token"]
        org_id = reg_res.json()["active_organization_id"]

        headers = {"Authorization": f"Bearer {admin_token}", "X-Tenant-Id": org_id}

        # 1. Invite a designer
        designer_email = f"designer_{uid}@invitecorp.io"
        invite_res = raw_client.post(
            f"/api/v1/organizations/{org_id}/invitations",
            json={"email": designer_email, "role": "designer"},
            headers=headers,
        )
        assert invite_res.status_code == 201
        invite_data = invite_res.json()
        token = invite_data["token"]
        assert invite_data["role"] == "designer"

        # 2. Inspect invitation publicly
        inspect_res = raw_client.get(f"/api/v1/invitations/{token}")
        assert inspect_res.status_code == 200
        pub_data = inspect_res.json()
        assert pub_data["is_valid"] is True
        assert pub_data["organization_name"] == f"Invite Corp {uid}"

        # 3. Accept invitation
        accept_res = raw_client.post(
            "/api/v1/invitations/accept",
            json={"token": token, "full_name": "Jane Designer", "password": "password123"},
        )
        assert accept_res.status_code == 200
        auth_data = accept_res.json()
        assert auth_data["active_role"] == "designer"
        assert auth_data["user"]["email"] == designer_email


def test_separation_of_duties_approval_guard(db_session):
    """Verifies non-admin creators cannot approve their own submissions."""
    uid = uuid.uuid4().hex[:8]
    with TestClient(app) as raw_client:
        # Register Org with Admin
        reg_res = raw_client.post("/api/v1/auth/register", json={
            "email": f"manager_{uid}@sodcorp.io",
            "password": "password123",
            "full_name": "Manager",
            "organization_name": f"SoD Corp {uid}",
        })
        assert reg_res.status_code == 201
        org_id = reg_res.json()["active_organization_id"]
        admin_token = reg_res.json()["access_token"]

        # Invite a marketing creator
        marketer_email = f"marketer_{uid}@sodcorp.io"
        inv_res = raw_client.post(
            f"/api/v1/organizations/{org_id}/invitations",
            headers={"Authorization": f"Bearer {admin_token}", "X-Tenant-Id": org_id},
            json={"email": marketer_email, "role": "marketing"},
        )
        assert inv_res.status_code == 201
        inv_token = inv_res.json()["token"]

        # Accept invite as marketer
        acc_res = raw_client.post("/api/v1/invitations/accept", json={
            "token": inv_token,
            "full_name": "Marketing Person",
            "password": "password123",
        })
        assert acc_res.status_code == 200
        marketer_token = acc_res.json()["access_token"]
        marketer_headers = {"Authorization": f"Bearer {marketer_token}", "X-Tenant-Id": org_id}

        # Marketer creates submission
        sub_res = raw_client.post(
            "/api/v1/submissions",
            headers=marketer_headers,
            json={"title": "Marketer Campaign", "content_type": "text", "initial_text": "Sample text"},
        )
        assert sub_res.status_code == 201
        sub_id = sub_res.json()["id"]

        # Marketer attempts to approve own submission
        approval_res = raw_client.post(
            "/api/v1/reviews/decide",
            headers=marketer_headers,
            json={"submission_id": sub_id, "action": "approve", "comments": "Self approved"},
        )
        # Should be rejected with 400 (unauthorized role) or 403 (separation of duties)
        assert approval_res.status_code in [400, 403]
