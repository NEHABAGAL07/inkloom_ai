"""
Test Suite for Persistent Media Storage and Administration
Tests end-to-end media upload, file persistence, database insertion,
cross-dashboard admin retrieval, and tenant isolation.
"""
import io
import os
import pytest
from app.models.media import MediaItem
from app.models.submission import ContentSubmission
from app.core.security import AuthContext, UserRole, get_current_auth_context
from app.main import app


@pytest.fixture
def designer_auth():
    return AuthContext(
        user_id="user_acme_designer_test",
        organization_id="test_org_001",
        roles=[UserRole.DESIGNER],
        email="designer@test.org",
        is_authenticated=True,
    )


@pytest.fixture
def admin_auth():
    return AuthContext(
        user_id="user_acme_admin_test",
        organization_id="test_org_001",
        roles=[UserRole.ADMIN],
        email="admin@test.org",
        is_authenticated=True,
    )


@pytest.fixture
def other_org_auth():
    return AuthContext(
        user_id="user_other_org",
        organization_id="test_org_999",
        roles=[UserRole.ADMIN],
        email="admin@otherorg.io",
        is_authenticated=True,
    )


def test_upload_image_persists_file_and_database_record(client, designer_auth, db_session):
    """Test A: Designer uploads an image; verify file persistence, metadata in DB, and unique ID."""
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth

    # Generate test PNG bytes
    image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_data = io.BytesIO(image_bytes)

    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("hero_banner.png", file_data, "image/png")},
        data={"description": "Q4 Hero Banner for campaign"},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["original_filename"] == "hero_banner.png"
    assert data["file_type"] == "image"
    assert data["mime_type"] == "image/png"
    assert data["file_size"] == len(image_bytes)
    assert data["organization_id"] == "test_org_001"
    assert data["uploaded_by"] == "designer@test.org"
    assert data["media_url"] == f"/api/v1/media/file/{data['id']}"

    # Verify physical file exists on disk
    file_path = data["file_path"]
    assert os.path.exists(file_path), f"File {file_path} does not exist on disk"

    # Verify database record exists in database session
    db_media = db_session.query(MediaItem).filter(MediaItem.id == data["id"]).first()
    assert db_media is not None
    assert db_media.original_filename == "hero_banner.png"
    assert db_media.file_size == len(image_bytes)

    # Verify linked ContentSubmission was also created
    assert db_media.submission_id is not None
    sub = db_session.query(ContentSubmission).filter(ContentSubmission.id == db_media.submission_id).first()
    assert sub is not None
    assert sub.content_type == "image"

    # Clean up physical file after test
    if os.path.exists(file_path):
        os.remove(file_path)


def test_upload_pdf_persists_file(client, designer_auth, db_session):
    """Verify PDF document uploads persist to storage and create database entries."""
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF"
    file_data = io.BytesIO(pdf_bytes)

    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("brand_specs.pdf", file_data, "application/pdf")},
        data={"description": "Brand specification PDF"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["file_type"] == "document"
    assert data["mime_type"] == "application/pdf"
    assert os.path.exists(data["file_path"])

    if os.path.exists(data["file_path"]):
        os.remove(data["file_path"])


def test_upload_video_persists_file(client, designer_auth, db_session):
    """Verify video uploads persist to storage."""
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth

    video_bytes = b"\x00\x00\x00 ftypmp42\x00\x00\x00\x00isommp42"
    file_data = io.BytesIO(video_bytes)

    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("promo.mp4", file_data, "video/mp4")},
        data={"description": "Product launch promo video"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["file_type"] == "video"
    assert os.path.exists(data["file_path"])

    if os.path.exists(data["file_path"]):
        os.remove(data["file_path"])


def test_upload_invalid_file_rejected(client, designer_auth):
    """Verify unapproved file types (e.g. .exe) are rejected with HTTP 400."""
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth

    bad_data = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("virus.exe", bad_data, "application/x-msdownload")},
    )
    assert response.status_code == 400
    assert "Unsupported media file" in response.json()["detail"]


def test_admin_retrieval_and_cross_dashboard_visibility(client, designer_auth, admin_auth, db_session):
    """Test C: Designer uploads media, Admin queries /admin/media and sees the record."""
    # 1. Designer uploads media
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth
    test_bytes = b"fake-artwork-png-content"
    upload_res = client.post(
        "/api/v1/media/upload",
        files={"file": ("campaign_asset.png", io.BytesIO(test_bytes), "image/png")},
        data={"description": "Autumn campaign graphic"},
    )
    assert upload_res.status_code == 201
    media_id = upload_res.json()["id"]
    file_path = upload_res.json()["file_path"]

    # 2. Admin retrieves media list
    app.dependency_overrides[get_current_auth_context] = lambda: admin_auth
    admin_res = client.get("/api/v1/admin/media")
    assert admin_res.status_code == 200
    admin_data = admin_res.json()

    assert admin_data["total"] >= 1
    found = [item for item in admin_data["items"] if item["id"] == media_id]
    assert len(found) == 1
    assert found[0]["original_filename"] == "campaign_asset.png"
    assert found[0]["uploaded_by"] == "designer@test.org"

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)


def test_organization_isolation(client, designer_auth, other_org_auth, db_session):
    """Verify multi-tenant isolation: Org B cannot see Org A media."""
    # Upload under test_org_001
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth
    upload_res = client.post(
        "/api/v1/media/upload",
        files={"file": ("secret_roadmap.png", io.BytesIO(b"org1_data"), "image/png")},
    )
    assert upload_res.status_code == 201
    media_id = upload_res.json()["id"]
    file_path = upload_res.json()["file_path"]

    # Other org queries
    app.dependency_overrides[get_current_auth_context] = lambda: other_org_auth
    other_res = client.get("/api/v1/admin/media")
    assert other_res.status_code == 200
    found = [item for item in other_res.json()["items"] if item["id"] == media_id]
    assert len(found) == 0, "Security breach: Other org could access private media record"

    # Direct detail access by other org returns 404
    detail_res = client.get(f"/api/v1/media/{media_id}")
    assert detail_res.status_code == 404

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)


def test_media_file_streaming(client, designer_auth, db_session):
    """Verify GET /api/v1/media/file/{id} returns physical file content with proper headers."""
    app.dependency_overrides[get_current_auth_context] = lambda: designer_auth
    content = b"SVG_TEST_CONTENT_LOREM_IPSUM"
    upload_res = client.post(
        "/api/v1/media/upload",
        files={"file": ("vector.svg", io.BytesIO(content), "image/svg+xml")},
    )
    assert upload_res.status_code == 201
    media_id = upload_res.json()["id"]
    file_path = upload_res.json()["file_path"]

    # Stream file
    stream_res = client.get(f"/api/v1/media/file/{media_id}")
    assert stream_res.status_code == 200
    assert stream_res.content == content
    assert "image/svg+xml" in stream_res.headers["content-type"]
    assert 'inline; filename="vector.svg"' in stream_res.headers["content-disposition"]

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)
