"""Inkloom AI - Media Audit FastAPI Endpoints Unit Tests."""

import io
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.core.security import CurrentUser, get_current_user
from app.services.media_audit.interfaces import MediaProcessingStatus
from app.schemas.common import WorkflowStateEnum
from app.api.routes.content import _SUBMISSION_STORE
from app.schemas.content import ContentSubmissionResponse, ContentRevisionResponse
from datetime import datetime, timezone


@pytest.fixture
def client():
    """Create test client with authenticated user dependency override."""
    test_user = CurrentUser(
        user_id="usr-media-test",
        email="qa-media@inkloom.ai",
        organization_id="org-inkloom-media",
        roles=["reviewer"],
    )
    app.dependency_overrides[get_current_user] = lambda: test_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_api_media_audit_txt_upload(client):
    """Verify uploading a text document executes audit and returns MediaAuditResult."""
    content = b"Inkloom AI launch copy.\n\nWe provide a 100% error-free guarantee."
    files = {"file": ("launch.txt", io.BytesIO(content), "text/plain")}

    response = client.post("/api/v1/media/audit", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] in ("success", "partial")
    assert data["media_type"] == "text/plain"
    assert "Inkloom AI launch copy." in data["extracted_text"]
    assert data["audit_result"] is not None
    assert len(data["findings"]) >= 1


def test_api_media_audit_image_with_alt_text(client):
    """Verify image upload with alt_text passes through visual inspection."""
    from PIL import Image
    img = Image.new("RGB", (600, 400), color=(26, 54, 93))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("banner.png", buf, "image/png")}
    data_form = {"alt_text": "Inkloom corporate logo on navy brand background"}

    response = client.post("/api/v1/media/audit", files=files, data=data_form)
    assert response.status_code == 200
    data = response.json()

    assert data["media_type"] == "image/png"
    assert data["capabilities"]["visual_analysis_success"] is True
    assert data["file_metadata"]["width"] == 600
    assert data["file_metadata"]["height"] == 400


def test_api_media_audit_unsupported_format_rejected(client):
    """Verify unsupported extensions return HTTP 400 Bad Request."""
    files = {"file": ("exploit.exe", io.BytesIO(b"binary_payload"), "application/octet-stream")}

    response = client.post("/api/v1/media/audit", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_api_media_audit_empty_file_rejected(client):
    """Verify 0-byte upload returns HTTP 400 Bad Request."""
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}

    response = client.post("/api/v1/media/audit", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_api_media_audit_spoofed_file_rejected(client):
    """Verify file with extension/magic bytes mismatch returns HTTP 400."""
    # Renamed Windows EXE claiming to be PDF
    files = {"file": ("spoofed.pdf", io.BytesIO(b"MZ\x00\x00fake_pdf"), "application/pdf")}

    response = client.post("/api/v1/media/audit", files=files)
    assert response.status_code == 400
    assert "signature mismatch" in response.json()["detail"].lower()


def test_api_media_audit_oversized_file_rejected(client):
    """Verify file exceeding upload size limit returns HTTP 413 Payload Too Large."""
    from app.core.config import settings
    original_limit = settings.MAX_UPLOAD_SIZE_BYTES
    settings.MAX_UPLOAD_SIZE_BYTES = 100  # Set tiny limit of 100 bytes

    try:
        files = {"file": ("oversized.txt", io.BytesIO(b"A" * 500), "text/plain")}
        response = client.post("/api/v1/media/audit", files=files)
        assert response.status_code == 413
        assert "exceeds maximum upload size limit" in response.json()["detail"]
    finally:
        settings.MAX_UPLOAD_SIZE_BYTES = original_limit


def test_api_media_audit_never_auto_approves(client):
    """Verify media audit transitions content to PENDING_APPROVAL, never APPROVED."""
    content_id = "cnt-media-gov-001"
    now = datetime.now(timezone.utc)
    _SUBMISSION_STORE[content_id] = ContentSubmissionResponse(
        id=content_id,
        organization_id="org-inkloom-media",
        workspace_id="ws-main",
        author_id="usr-test",
        title="Governed Campaign",
        content_type="text",
        current_status=WorkflowStateEnum.SUBMITTED,
        current_revision_num=1,
        created_at=now,
        updated_at=now,
        revisions=[
            ContentRevisionResponse(
                id=f"rev-{content_id}-1",
                submission_id=content_id,
                revision_num=1,
                raw_text="Launch copy",
                created_at=now,
            )
        ],
    )

    content = b"Flawless and 100% error-free marketing launch copy."
    files = {"file": ("launch.txt", io.BytesIO(content), "text/plain")}
    data_form = {"content_id": content_id}

    response = client.post("/api/v1/media/audit", files=files, data=data_form)
    assert response.status_code == 200

    # Ensure status is PENDING_APPROVAL, strictly never APPROVED
    updated_sub = _SUBMISSION_STORE[content_id]
    assert updated_sub.current_status == WorkflowStateEnum.PENDING_APPROVAL
    assert updated_sub.current_status != WorkflowStateEnum.APPROVED


def test_api_media_audit_compatibility_route(client):
    """Verify /api/media/audit alias endpoint works identically."""
    content = b"Inkloom AI copy text."
    files = {"file": ("alias_test.txt", io.BytesIO(content), "text/plain")}

    response = client.post("/api/media/audit", files=files)
    assert response.status_code == 200
    assert response.json()["media_type"] == "text/plain"
