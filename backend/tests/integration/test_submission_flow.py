"""Integration Test: Full submission, automated audit, and human review cycle."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_full_governance_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Submit draft content
        submit_data = {
            "title": "Q4 Press Release",
            "content_type": "text",
            "raw_text": "Try inkloom today! Our software offers a 100% error-free guarantee across campaigns.",
            "workspace_id": "ws-main-001",
        }
        submit_res = await client.post("/api/v1/content/submit", data=submit_data)
        assert submit_res.status_code == 201
        submission = submit_res.json()
        content_id = submission["id"]
        assert submission["current_status"] == "submitted"

        # Step 2: Run automated AI audit
        audit_payload = {
            "content_id": content_id,
            "revision_id": 1,
        }
        audit_res = await client.post("/api/v1/audits/run", json=audit_payload)
        assert audit_res.status_code == 200
        audit_data = audit_res.json()
        assert audit_data["content_id"] == content_id
        assert audit_data["schema_version"] == "1.0.0"
        assert len(audit_data["findings"]) >= 2

        # Step 3: Human Reviewer records decision (Request Changes)
        review_payload = {
            "content_id": content_id,
            "revision_id": f"rev-{content_id}-1",
            "action": "request_changes",
            "comments": "Please resolve unverified 100% error-free claim before re-auditing.",
        }
        review_res = await client.post("/api/v1/reviews/decision", json=review_payload)
        assert review_res.status_code == 200
        review_data = review_res.json()
        assert review_data["new_workflow_status"] == "changes_requested"
        assert review_data["action"] == "request_changes"
