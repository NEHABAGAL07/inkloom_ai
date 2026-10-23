from app.models import ContentSubmission, AuditEvent
from app.workflow.state_machine import WorkflowState


def test_full_governance_lifecycle(client, seed_test_org, db_session):
    # 1. Create Submission
    create_resp = client.post(
        "/api/v1/submissions",
        json={
            "title": "Q4 Enterprise Launch Press Release",
            "description": "Initial draft of press release",
            "content_type": "text",
            "initial_text": "Announcing the Inkloom Cloud Suite with 10x faster processing.",
        },
    )
    assert create_resp.status_code == 201
    submission_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == WorkflowState.SUBMITTED.value

    # 2. Trigger Audit
    audit_resp = client.post(
        "/api/v1/audits/trigger",
        json={"submission_id": submission_id},
    )
    assert audit_resp.status_code == 201
    audit_data = audit_resp.json()
    assert audit_data["schema_version"] == "1.0.0"
    assert len(audit_data["findings"]) > 0

    # Verify submission workflow state progressed to pending_approval or changes_requested
    sub_check = client.get(f"/api/v1/submissions/{submission_id}")
    assert sub_check.status_code == 200
    current_status = sub_check.json()["status"]
    assert current_status in (WorkflowState.PENDING_APPROVAL.value, WorkflowState.CHANGES_REQUESTED.value)

    # 3. Check Pending Reviews Queue
    pending_resp = client.get("/api/v1/reviews/pending")
    assert pending_resp.status_code == 200
    pending_ids = [s["id"] for s in pending_resp.json()]
    assert submission_id in pending_ids

    # 4. Reviewer Submits Decision (Approve)
    if current_status == WorkflowState.CHANGES_REQUESTED.value:
        # If audit marked changes requested, submit a revision first to test revision cycle
        rev_resp = client.post(
            f"/api/v1/submissions/{submission_id}/revisions",
            json={"raw_text": "Announcing Inkloom Governance Hub with verified fast processing."},
        )
        assert rev_resp.status_code == 201
        
        # Re-audit the revised content
        re_audit = client.post(
            "/api/v1/audits/trigger",
            json={"submission_id": submission_id},
        )
        assert re_audit.status_code == 201

    decision_resp = client.post(
        "/api/v1/reviews/decide",
        json={
            "submission_id": submission_id,
            "action": "approve",
            "comments": "Reviewed by compliance officer. All mandatory corrections applied.",
        },
    )
    assert decision_resp.status_code == 201
    assert decision_resp.json()["action"] == "approve"

    # 5. Verify final status is approved
    final_sub = client.get(f"/api/v1/submissions/{submission_id}")
    assert final_sub.json()["status"] == WorkflowState.APPROVED.value
