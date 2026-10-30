"""
End-to-End Verification of Real-Time Database Storage in Inkloom AI
This script directly interacts with the live database (backend/inkloom_dev.db)
and live FastAPI app using TestClient, authenticating as real seeded users:
- designer@acmecloud.com (Designer role)
- admin@acmecloud.com (Admin role)
- admin@novabio.com (Other organization Admin)
"""
import os
import sys
import sqlite3
import io
from fastapi.testclient import TestClient

# Anchor backend path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.core.config import settings
from app.database.session import SessionLocal, engine
from app.models.media import MediaItem
from app.models.submission import ContentSubmission

client = TestClient(app)

results = {}

def run_test(name, func):
    try:
        print(f"\n==========================================")
        print(f"RUNNING: {name}")
        print(f"==========================================")
        func()
        results[name] = "PASS"
        print(f"--> RESULT: PASS")
    except Exception as e:
        results[name] = f"FAIL: {str(e)}"
        print(f"--> RESULT: FAIL: {str(e)}")
        import traceback
        traceback.print_exc()


def test_auth_login():
    """Verify login works for real seeded accounts against live database."""
    res_des = client.post("/api/v1/auth/login", json={"email": "designer@acmecloud.com", "password": "password123"})
    assert res_des.status_code == 200, f"Designer login failed: {res_des.text}"
    global designer_token
    designer_token = res_des.json()["access_token"]
    assert designer_token is not None

    res_adm = client.post("/api/v1/auth/login", json={"email": "admin@acmecloud.com", "password": "password123"})
    assert res_adm.status_code == 200, f"Admin login failed: {res_adm.text}"
    global admin_token
    admin_token = res_adm.json()["access_token"]
    assert admin_token is not None

    res_other = client.post("/api/v1/auth/login", json={"email": "admin@novabio.com", "password": "password123"})
    assert res_other.status_code == 200, f"Other org login failed: {res_other.text}"
    global other_org_token
    other_org_token = res_other.json()["access_token"]


global_uploaded_media_id = None
global_stored_file_path = None

def test_a_upload_persistence():
    """Test A: Upload image from Designer, verify file physically stored & metadata in real DB."""
    global global_uploaded_media_id, global_stored_file_path

    # 1x1 test PNG
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_obj = io.BytesIO(png_content)

    headers = {
        "Authorization": f"Bearer {designer_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.post(
        "/api/v1/media/upload",
        headers=headers,
        files={"file": ("live_test_banner.png", file_obj, "image/png")},
        data={"description": "Real live test banner uploaded by Designer"},
    )
    assert res.status_code == 201, f"Upload failed: {res.text}"
    data = res.json()
    print("Upload response payload:", data)

    media_id = data["id"]
    global_uploaded_media_id = media_id
    file_path = data["file_path"]
    global_stored_file_path = file_path

    # Verify ID is a genuine UUID
    assert len(media_id) >= 32
    assert data["original_filename"] == "live_test_banner.png"
    assert data["file_type"] == "image"
    assert data["file_size"] == len(png_content)

    # 1. Verify physical file is stored on disk in persistent storage
    assert os.path.exists(file_path), f"Physical file missing at {file_path}"
    with open(file_path, "rb") as f:
        stored_bytes = f.read()
    assert stored_bytes == png_content, "Stored file content does not match uploaded content"
    print(f"Physical file verified: {file_path} ({len(stored_bytes)} bytes)")

    # 2. Verify metadata directly inside SQLite database via raw sqlite3
    db_file = settings.DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    cur.execute("SELECT id, original_filename, stored_filename, file_size, organization_id, uploaded_by FROM media_items WHERE id = ?", (media_id,))
    row = cur.fetchone()
    assert row is not None, "Record not found in sqlite3 database!"
    print("Direct sqlite3 record row:", row)
    assert row[1] == "live_test_banner.png"
    assert row[3] == len(png_content)
    assert row[4] == "org_acme_cloud"
    assert row[5] == "designer@acmecloud.com"
    conn.close()


def test_b_database_persistence_across_restart():
    """Test B: Restart engine/session, retrieve uploaded media again; verify record still exists."""
    assert global_uploaded_media_id is not None
    # Dispose all connections in pool to simulate backend process restart
    engine.dispose()

    # Create new isolated session
    new_session = SessionLocal()
    try:
        item = new_session.query(MediaItem).filter(MediaItem.id == global_uploaded_media_id).first()
        assert item is not None, "MediaItem record was lost after database restart!"
        assert item.original_filename == "live_test_banner.png"
        assert item.file_size > 0
        assert os.path.exists(item.file_path)
        print("Record retrieved after backend restart:", item.id, item.original_filename, item.created_at)
    finally:
        new_session.close()

    # Also test API retrieval after restart
    headers = {
        "Authorization": f"Bearer {designer_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.get(f"/api/v1/media/{global_uploaded_media_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == global_uploaded_media_id


def test_c_cross_dashboard_visibility():
    """Test C: Designer uploads content, Admin retrieves media list and sees the record."""
    assert global_uploaded_media_id is not None

    # Query from Admin account
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.get("/api/v1/admin/media", headers=headers)
    assert res.status_code == 200, f"Admin media retrieval failed: {res.text}"
    data = res.json()
    print(f"Admin retrieved {data['total']} media items from database")

    matching = [item for item in data["items"] if item["id"] == global_uploaded_media_id]
    assert len(matching) == 1, "Uploaded designer media was NOT found in admin media retrieval!"
    admin_item = matching[0]
    assert admin_item["original_filename"] == "live_test_banner.png"
    assert admin_item["uploaded_by"] == "designer@acmecloud.com"
    print("Admin dashboard verified matching item:", admin_item["id"], admin_item["original_filename"])

    # Also query submissions list (which both dashboards use)
    subs_res = client.get("/api/v1/submissions", headers=headers)
    assert subs_res.status_code == 200
    subs_data = subs_res.json()
    matching_subs = [s for s in subs_data if s.get("file_name") == "live_test_banner.png"]
    assert len(matching_subs) >= 1, "Submission pipeline does not reflect uploaded media"
    print("ContentSubmission pipeline verified for Admin dashboard:", matching_subs[0]["id"], matching_subs[0]["title"])


def test_d_api_verification():
    """Test D: Verify data comes from SQLAlchemy DB queries rather than mock data."""
    # Insert dummy media with unique identifier directly into DB via raw sqlite3
    db_file = settings.DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    raw_id = "test_raw_db_unique_998877"
    raw_fn = "direct_db_insert.png"
    dummy_path = os.path.join(settings.UPLOAD_STORAGE_DIR, "org_acme_cloud", "media", raw_fn)
    os.makedirs(os.path.dirname(dummy_path), exist_ok=True)
    with open(dummy_path, "wb") as f:
        f.write(b"direct_sqlite_bytes")

    cur.execute("""
        INSERT INTO media_items (id, organization_id, original_filename, stored_filename, file_path, file_type, mime_type, file_size, uploaded_by, description, status, extra_metadata, created_at, updated_at)
        VALUES (?, 'org_acme_cloud', ?, ?, ?, 'image', 'image/png', 19, 'test@manual.db', 'Direct DB insert', 'active', '{}', datetime('now'), datetime('now'))
    """, (raw_id, raw_fn, raw_fn, dummy_path))
    conn.commit()
    conn.close()

    # Now call the Admin retrieval API: if it comes from DB, it MUST include raw_id!
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.get("/api/v1/admin/media", headers=headers)
    assert res.status_code == 200
    items = res.json()["items"]
    found = [it for it in items if it["id"] == raw_id]
    assert len(found) == 1, "Direct SQLite insert was NOT retrieved by API - API might be returning static data!"
    print(f"Confirmed: API retrieved record inserted directly into SQLite: {found[0]['id']}")

    # Clean up test direct insert
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    cur.execute("DELETE FROM media_items WHERE id = ?", (raw_id,))
    conn.commit()
    conn.close()
    if os.path.exists(dummy_path):
        os.remove(dummy_path)


def test_pdf_upload():
    """Verify Designer uploads PDF document persistently."""
    pdf_content = b"%PDF-1.4 Enterprise Brand Guidelines Manual\n%%EOF"
    headers = {
        "Authorization": f"Bearer {designer_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.post(
        "/api/v1/media/upload",
        headers=headers,
        files={"file": ("Brand_Guidelines_2026.pdf", io.BytesIO(pdf_content), "application/pdf")},
        data={"description": "Brand manual PDF"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["file_type"] == "document"
    assert os.path.exists(data["file_path"])


def test_video_upload():
    """Verify Designer uploads video persistently."""
    video_content = b"\x00\x00\x00 ftypmp42\x00\x00\x00\x00isommp42"
    headers = {
        "Authorization": f"Bearer {designer_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.post(
        "/api/v1/media/upload",
        headers=headers,
        files={"file": ("launch_teaser.mp4", io.BytesIO(video_content), "video/mp4")},
        data={"description": "Launch teaser video"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["file_type"] == "video"
    assert os.path.exists(data["file_path"])


def test_invalid_file_rejected():
    """Verify unallowed file types are rejected with 400 Bad Request."""
    headers = {
        "Authorization": f"Bearer {designer_token}",
        "X-Tenant-Id": "org_acme_cloud",
    }
    res = client.post(
        "/api/v1/media/upload",
        headers=headers,
        files={"file": ("malware.exe", io.BytesIO(b"MZ123"), "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "Unsupported media file" in res.json()["detail"]


def test_unauthorized_access():
    """Verify unauthenticated requests are denied with 401."""
    # Use unauthenticated client without session cookies
    unauthed_client = TestClient(app)
    res = unauthed_client.post(
        "/api/v1/media/upload",
        files={"file": ("sample.png", io.BytesIO(b"fake"), "image/png")},
    )
    assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"


def test_organization_isolation():
    """Verify multi-tenant isolation: admin from novabio cannot see acme media."""
    headers = {
        "Authorization": f"Bearer {other_org_token}",
        "X-Tenant-Id": "org_novabio_health",
    }
    res = client.get("/api/v1/admin/media", headers=headers)
    assert res.status_code == 200
    items = res.json()["items"]
    # Check that none belong to org_acme_cloud
    acme_items = [it for it in items if it["organization_id"] == "org_acme_cloud"]
    assert len(acme_items) == 0, "Multi-tenant violation: NovaBio admin saw Acme Cloud media!"


def test_media_file_streaming():
    """Verify file streaming endpoint serves actual content with headers."""
    assert global_uploaded_media_id is not None
    res = client.get(f"/api/v1/media/file/{global_uploaded_media_id}")
    assert res.status_code == 200
    assert "image/png" in res.headers["content-type"]
    assert len(res.content) > 0


if __name__ == "__main__":
    test_auth_login()
    run_test("Test A: Upload persistence", test_a_upload_persistence)
    run_test("Test B: Database persistence across restart", test_b_database_persistence_across_restart)
    run_test("Test C: Cross-dashboard visibility", test_c_cross_dashboard_visibility)
    run_test("Test D: API verification (SQLAlchemy query)", test_d_api_verification)
    run_test("Test: Designer uploads PDF", test_pdf_upload)
    run_test("Test: Designer uploads video", test_video_upload)
    run_test("Test: Invalid file rejected", test_invalid_file_rejected)
    run_test("Test: Unauthorized access denied", test_unauthorized_access)
    run_test("Test: Organization isolation", test_organization_isolation)
    run_test("Test: File streaming endpoint", test_media_file_streaming)

    print("\n==========================================")
    print("FINAL TEST RESULTS SUMMARY:")
    print("==========================================")
    all_passed = True
    for t_name, status_str in results.items():
        print(f"[{status_str}] {t_name}")
        if "FAIL" in status_str:
            all_passed = False

    if all_passed:
        print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("\nSOME TESTS FAILED.")
        sys.exit(1)
