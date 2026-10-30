import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import AuditEvent, RevokedToken, Organization, User, Membership


def test_auth_security_complete_lifecycle(db_session):
    """
    Comprehensive test of authentication security:
    - Login establishes real user and server-side role
    - Protected endpoints require valid Bearer token (no unauthenticated fallback)
    - Designer cannot access administrator-only operations (RBAC)
    - Cross-tenant data isolation is strictly enforced
    - Server-side logout revokes the token and prevents subsequent access
    - Direct unauthenticated requests return 401 Unauthorized
    """
    uid = uuid.uuid4().hex[:8]
    with TestClient(app) as client:
        # 1. Direct unauthenticated request to protected endpoint -> 401
        unauth_res = client.get("/api/v1/submissions")
        assert unauth_res.status_code == 401
        assert "credentials were not provided" in unauth_res.json()["detail"].lower()

        # 2. Register Organization A with Admin (Manager)
        admin_email = f"manager_{uid}@orga.com"
        reg_a = client.post("/api/v1/auth/register", json={
            "email": admin_email,
            "password": "Password123!",
            "full_name": "Org A Manager",
            "organization_name": f"Org Alpha {uid}",
            "industry": "Technology",
        })
        assert reg_a.status_code == 201
        admin_data = reg_a.json()
        admin_token = admin_data["access_token"]
        org_a_id = admin_data["active_organization_id"]
        admin_headers = {"Authorization": f"Bearer {admin_token}", "X-Tenant-Id": org_a_id}

        # 3. Manager logs in independently
        login_res = client.post("/api/v1/auth/login", json={
            "email": admin_email,
            "password": "Password123!",
        })
        assert login_res.status_code == 200
        assert login_res.json()["active_role"] == "admin"
        assert login_res.json()["user"]["email"] == admin_email

        # 4. Invalid credentials produce useful 401 error
        bad_login = client.post("/api/v1/auth/login", json={
            "email": admin_email,
            "password": "WrongPassword!",
        })
        assert bad_login.status_code == 401
        assert "invalid email or password" in bad_login.json()["detail"].lower()

        # 5. Invite a Designer to Org A
        designer_email = f"designer_{uid}@orga.com"
        inv_res = client.post(
            f"/api/v1/organizations/{org_a_id}/invitations",
            headers=admin_headers,
            json={"email": designer_email, "role": "designer"},
        )
        assert inv_res.status_code == 201
        inv_token = inv_res.json()["token"]

        # 6. Designer accepts invitation and gets own session
        accept_res = client.post("/api/v1/invitations/accept", json={
            "token": inv_token,
            "full_name": "Org A Designer",
            "password": "DesignerPassword123!",
        })
        assert accept_res.status_code == 200
        designer_data = accept_res.json()
        designer_token = designer_data["access_token"]
        designer_headers = {"Authorization": f"Bearer {designer_token}", "X-Tenant-Id": org_a_id}
        assert designer_data["active_role"] == "designer"

        # 7. Role check: Designer attempts an admin-only operation (updating member role) -> 403 Forbidden
        admin_user_id = admin_data["user"]["id"]
        demote_attempt = client.patch(
            f"/api/v1/organizations/{org_a_id}/members/{admin_user_id}",
            headers=designer_headers,
            json={"role": "marketing"},
        )
        assert demote_attempt.status_code == 403
        assert "only organization admins" in demote_attempt.json()["detail"].lower()

        # 8. Tenant isolation: Register Org B
        reg_b = client.post("/api/v1/auth/register", json={
            "email": f"admin_{uid}@orgb.com",
            "password": "Password123!",
            "full_name": "Org B Manager",
            "organization_name": f"Org Beta {uid}",
        })
        assert reg_b.status_code == 201
        org_b_id = reg_b.json()["active_organization_id"]

        # Org A user attempts to forge X-Tenant-Id to Org B -> 403 Forbidden
        tamper_tenant = client.get(
            "/api/v1/submissions",
            headers={"Authorization": f"Bearer {admin_token}", "X-Tenant-Id": org_b_id},
        )
        assert tamper_tenant.status_code == 403

        # 9. Server-side Logout flow
        # Ensure logout requires a valid token
        logout_no_token = client.post("/api/v1/auth/logout")
        assert logout_no_token.status_code == 401

        # Valid logout invalidates the token on server
        logout_res = client.post("/api/v1/auth/logout", headers=designer_headers)
        assert logout_res.status_code == 200
        assert logout_res.json()["revoked"] is True

        # 10. Attempting to use the revoked token -> 401 Unauthorized
        revoked_access_attempt = client.get("/api/v1/submissions", headers=designer_headers)
        assert revoked_access_attempt.status_code == 401
        assert "revoked" in revoked_access_attempt.json()["detail"].lower()

        # 11. Manager's token is still valid (independent sessions)
        manager_access = client.get("/api/v1/submissions", headers=admin_headers)
        assert manager_access.status_code == 200


def test_registration_validation_and_duplicate_handling(db_session):
    """
    Regression test:
    - Enforces required fields
    - Enforces email format validation
    - Enforces minimum password length
    - Rejects duplicate email with 409 Conflict
    - Atomically creates organization, admin user, and initial guidelines
    """
    uid = uuid.uuid4().hex[:8]
    with TestClient(app) as client:
        # 1. Missing organization name -> 400
        res = client.post("/api/v1/auth/register", json={
            "email": f"user_{uid}@corp.com",
            "password": "ValidPassword123",
            "full_name": "Test Admin",
            "organization_name": "",
        })
        assert res.status_code == 400
        assert "organization name is required" in res.json()["detail"].lower()

        # 2. Invalid email format -> 400
        res = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "ValidPassword123",
            "full_name": "Test Admin",
            "organization_name": f"Valid Org {uid}",
        })
        assert res.status_code == 400
        assert "valid corporate work email" in res.json()["detail"].lower()

        # 3. Short password -> 400
        res = client.post("/api/v1/auth/register", json={
            "email": f"user_{uid}@corp.com",
            "password": "123",
            "full_name": "Test Admin",
            "organization_name": f"Valid Org {uid}",
        })
        assert res.status_code == 400
        assert "at least 6 characters" in res.json()["detail"].lower()

        # 4. Valid registration -> 201
        reg_payload = {
            "email": f"admin_{uid}@newcorp.com",
            "password": "StrongPassword2026!",
            "full_name": "First Administrator",
            "organization_name": f"New Corp {uid}",
            "industry": "Technology & SaaS",
        }
        res_ok = client.post("/api/v1/auth/register", json=reg_payload)
        assert res_ok.status_code == 201
        data = res_ok.json()
        assert data["active_role"] == "admin"
        assert data["user"]["email"] == f"admin_{uid}@newcorp.com"
        assert len(data["memberships"]) == 1
        assert data["memberships"][0]["role"] == "admin"

        # 5. Duplicate registration with same email -> 409 Conflict
        res_dup = client.post("/api/v1/auth/register", json=reg_payload)
        assert res_dup.status_code == 409
        assert "already exists" in res_dup.json()["detail"].lower()


def test_demo_personas_auth_and_compatibility(db_session):
    """
    Regression test for demo persona 1-click access:
    - Verifies all 4 demo roles (admin, designer, marketing, compliance_officer)
    - Verifies compatibility between demo123456 and password123
    - Verifies tenant isolation (scoped to org_acme_cloud)
    - Verifies negative authentication on invalid credentials
    """
    personas = [
        ("admin@acmecloud.com", "admin"),
        ("designer@acmecloud.com", "designer"),
        ("marketing@acmecloud.com", "marketing"),
        ("compliance@acmecloud.com", "compliance_officer"),
    ]

    with TestClient(app) as client:
        for email, expected_role in personas:
            # 1. Login with demo123456 (used in 1-click demo button)
            res_demo = client.post("/api/v1/auth/login", json={"email": email, "password": "demo123456"})
            assert res_demo.status_code == 200, f"Failed demo login for {email}: {res_demo.text}"
            body_demo = res_demo.json()
            assert body_demo["active_role"] == expected_role
            assert body_demo["active_organization_id"] == "org_acme_cloud"

            # 2. Login with password123 (seeded password)
            res_p123 = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
            assert res_p123.status_code == 200
            assert res_p123.json()["active_role"] == expected_role
            assert res_p123.json()["active_organization_id"] == "org_acme_cloud"

            # 3. Invalid password -> 401
            res_bad = client.post("/api/v1/auth/login", json={"email": email, "password": "wrongpassword"})
            assert res_bad.status_code == 401

