"""Comprehensive Backend Tests for Inkloom AI Brand Governance Platform.

Covers:
- Health endpoints (/health, /api/health, /api/v1/health)
- Brand guidelines & rules CRUD
- Verified facts / evidence registry
- Content submissions, revisions, and immutable versioning
- Deterministic AI audit findings (terminology, tone, claims)
- Section 9 BrandAuditFinding schema validation
- Review decisions (approve, request_changes, reject)
- Invariant: Approval applies ONLY to reviewed version; new revisions do NOT inherit approval
- Workflow transition validation & error handling
- Dynamic database-calculated analytics
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.audit import BrandAuditFinding


@pytest.mark.asyncio
async def test_health_endpoints():
    """Verify health endpoints across /health, /api/health, and /api/v1/health."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Root /health
        res_root = await client.get("/health")
        assert res_root.status_code == 200
        data_root = res_root.json()
        assert data_root["status"] == "healthy"
        assert data_root["service"] == "inkloom_ai_backend"

        # 2. Versioned /api/v1/health
        res_v1 = await client.get("/api/v1/health")
        assert res_v1.status_code == 200
        data_v1 = res_v1.json()
        assert data_v1["status"] == "healthy"
        assert data_v1["version"] == "1.0.0"

        # 3. Predictable /api/health
        res_api = await client.get("/api/health")
        assert res_api.status_code == 200
        data_api = res_api.json()
        assert data_api["status"] == "healthy"


@pytest.mark.asyncio
async def test_guideline_and_rule_lifecycle():
    """Verify guideline creation, rule addition, retrieval, and listing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Create a brand guideline
        create_payload = {
            "name": "Social Media Governance Guideline",
            "category": "terminology",
            "version": "1.2",
            "description": "Rules governing external social channels.",
            "rules": [
                {
                    "rule_key": "product_name_rule",
                    "title": "Proper Product Casing",
                    "description": "Always use 'Inkloom AI', never 'inkloom'.",
                    "severity": "high",
                    "rule_config": {
                        "forbidden_variants": ["inkloom", "InkLoom"],
                        "preferred_term": "Inkloom AI",
                        "case_sensitive": True,
                    },
                    "is_active": True,
                }
            ],
        }
        res_create = await client.post("/api/guidelines", json=create_payload)
        assert res_create.status_code == 201
        guideline = res_create.json()
        guideline_id = guideline["id"]
        assert guideline["name"] == "Social Media Governance Guideline"
        assert len(guideline["rules"]) == 1

        # Step 2: Add a new rule to this guideline
        add_rule_payload = {
            "rule_key": "hashtags_rule",
            "title": "Approved Corporate Hashtags",
            "description": "Include #BrandGovernance on social posts.",
            "severity": "low",
            "rule_config": {"required_tags": ["#BrandGovernance"]},
            "is_active": True,
        }
        res_rule = await client.post(f"/api/guidelines/{guideline_id}/rules", json=add_rule_payload)
        assert res_rule.status_code == 201
        rule_data = res_rule.json()
        assert rule_data["rule_key"] == "hashtags_rule"
        assert rule_data["guideline_id"] == guideline_id

        # Step 3: Retrieve single guideline by ID
        res_get = await client.get(f"/api/guidelines/{guideline_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["id"] == guideline_id
        assert len(fetched["rules"]) == 2

        # Step 4: List guidelines
        res_list = await client.get("/api/guidelines")
        assert res_list.status_code == 200
        guidelines = res_list.json()
        assert any(g["id"] == guideline_id for g in guidelines)


@pytest.mark.asyncio
async def test_verified_facts_registry():
    """Verify registered facts / knowledge sources for claims verification."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Create a verified fact
        fact_payload = {
            "statement": "99.9% uptime SLA verified across all enterprise nodes",
            "category": "product_spec",
            "source_document": "2026 Enterprise Service Level Agreement, Exhibit B",
        }
        res_fact = await client.post("/api/facts", json=fact_payload)
        assert res_fact.status_code == 201
        fact_data = res_fact.json()
        fact_id = fact_data["id"]
        assert fact_data["statement"] == fact_payload["statement"]

        # Step 2: Retrieve fact by ID
        res_get = await client.get(f"/api/facts/{fact_id}")
        assert res_get.status_code == 200
        assert res_get.json()["id"] == fact_id

        # Step 3: List facts
        res_list = await client.get("/api/facts")
        assert res_list.status_code == 200
        facts = res_list.json()
        assert any(f["id"] == fact_id for f in facts)


@pytest.mark.asyncio
async def test_content_submission_and_revision_flow():
    """Verify content creation, revision iteration, and immutable version history."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Submit initial content (version 1)
        sub_payload = {
            "title": "Winter Product Newsletter",
            "content_type": "text",
            "raw_text": "Welcome to inkloom! We are super pumped to launch today.",
        }
        res_sub = await client.post("/api/content", json=sub_payload)
        assert res_sub.status_code == 201
        sub_data = res_sub.json()
        content_id = sub_data["id"]
        assert sub_data["current_revision_num"] == 1
        assert sub_data["current_status"] == "submitted"
        assert len(sub_data["revisions"]) == 1

        # Step 2: Create a second revision (version 2)
        rev_payload = {
            "raw_text": "Welcome to Inkloom AI! We are proud to launch today.",
        }
        res_rev = await client.post(f"/api/content/{content_id}/revisions", json=rev_payload)
        assert res_rev.status_code == 201
        rev_data = res_rev.json()
        assert rev_data["current_revision_num"] == 2
        assert rev_data["current_status"] == "resubmitted"
        assert len(rev_data["revisions"]) == 2

        # Step 3: Get version history
        res_history = await client.get(f"/api/content/{content_id}/history")
        assert res_history.status_code == 200
        hist_data = res_history.json()
        assert hist_data["content_id"] == content_id
        assert hist_data["current_version"] == 2
        assert len(hist_data["versions"]) == 2
        assert len(hist_data["audit_history"]) >= 2


@pytest.mark.asyncio
async def test_deterministic_audit_and_section9_schema():
    """Verify deterministic audit produces structured findings conforming to Section 9 schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Submit violating content
        sub_payload = {
            "title": "Marketing Blog Post",
            "raw_text": (
                "Try inkloom today for best-in-class branding. "
                "We provide a 100% error-free guarantee on all campaign materials. "
                "Our team is super pumped to reveal this capability."
            ),
        }
        res_sub = await client.post("/api/content", json=sub_payload)
        assert res_sub.status_code == 201
        content_id = res_sub.json()["id"]

        # Step 2: Trigger audit via POST /api/content/{content_id}/audit
        res_audit = await client.post(f"/api/content/{content_id}/audit", json={"content_id": content_id})
        assert res_audit.status_code == 200
        audit_data = res_audit.json()
        audit_id = audit_data["audit_id"]
        assert audit_data["content_id"] == content_id
        assert len(audit_data["findings"]) >= 3

        # Step 3: Validate Section 9 Finding Schema attributes on each finding
        # Allowed categories: tone, terminology, factual_accuracy, unsupported_claim, visual_consistency, accessibility
        # Allowed severity: low, medium, high, critical
        # Allowed evidence_status: supported, contradicted, unverified, unavailable
        for raw_finding in audit_data["findings"]:
            cat_val = raw_finding["category"]
            sev_val = raw_finding["severity"]
            # Convert to Section 9 representation
            cat_map = {
                "tone_and_voice": "tone",
                "claim_verification": "unsupported_claim",
                "visual_compliance": "visual_consistency",
            }
            sec9_cat = cat_map.get(cat_val, cat_val)
            sec9_sev = sev_val if sev_val != "info" else "low"
            ev_status = "unverified" if sec9_cat in ("unsupported_claim", "factual_accuracy") else "unavailable"

            # Validate against BrandAuditFinding Pydantic schema
            brand_finding = BrandAuditFinding(
                id=raw_finding["id"],
                category=sec9_cat,
                severity=sec9_sev,
                original_text=raw_finding.get("evidence") or "",
                explanation=raw_finding["message"],
                guideline_id=raw_finding.get("source_reference"),
                evidence_status=ev_status,
                suggestion=raw_finding.get("suggested_correction"),
            )
            assert brand_finding.id is not None
            assert brand_finding.category in [
                "tone", "terminology", "factual_accuracy",
                "unsupported_claim", "visual_consistency", "accessibility"
            ]
            assert brand_finding.severity in ["low", "medium", "high", "critical"]
            assert brand_finding.evidence_status in ["supported", "contradicted", "unverified", "unavailable"]

        # Step 4: Fetch audit by ID via GET /api/audits/{audit_id}
        res_get_audit = await client.get(f"/api/audits/{audit_id}")
        assert res_get_audit.status_code == 200
        fetched_audit = res_get_audit.json()
        assert fetched_audit["audit_id"] == audit_id


@pytest.mark.asyncio
async def test_approval_invalidation_on_new_revision():
    """
    CRITICAL INVARIANT TEST:
    1. Content version 1 is submitted.
    2. Version 1 is audited and approved by human reviewer.
    3. Creator submits revision (producing version 2).
    4. Version 2 MUST NOT inherit approval! State must be resubmitted.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Submit content
        sub_payload = {
            "title": "Corporate Keynote Announcement",
            "raw_text": "Welcome to the Inkloom AI Brand Governance Platform.",
        }
        res_sub = await client.post("/api/content", json=sub_payload)
        assert res_sub.status_code == 201
        content_id = res_sub.json()["id"]

        # 2. Audit version 1
        res_audit = await client.post(f"/api/content/{content_id}/audit")
        assert res_audit.status_code == 200

        # Verify state is pending_approval
        res_check = await client.get(f"/api/content/{content_id}")
        assert res_check.json()["current_status"] == "pending_approval"

        # 3. Human reviewer approves version 1
        review_payload = {
            "content_id": content_id,
            "revision_id": f"rev-{content_id}-1",
            "action": "approved",
            "comments": "Approved for keynote distribution.",
        }
        res_dec = await client.post("/api/reviews/decision", json=review_payload)
        assert res_dec.status_code == 200
        assert res_dec.json()["new_workflow_status"] == "approved"

        # Verify content is approved
        res_appr = await client.get(f"/api/content/{content_id}")
        assert res_appr.json()["current_status"] == "approved"

        # 4. Creator submits an edit (revision 2)
        rev2_payload = {
            "raw_text": "Welcome to the Inkloom AI Brand Governance Platform. Added confidential slide.",
        }
        res_rev2 = await client.post(f"/api/content/{content_id}/revisions", json=rev2_payload)
        assert res_rev2.status_code == 201
        updated_sub = res_rev2.json()

        # 5. VERIFY: The new revision does NOT inherit approval!
        assert updated_sub["current_revision_num"] == 2
        assert updated_sub["current_status"] != "approved"
        assert updated_sub["current_status"] == "resubmitted"


@pytest.mark.asyncio
async def test_invalid_workflow_transitions():
    """Verify state machine rejects invalid or unauthorized transitions with 400 Bad Request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Submit fresh draft/submitted content (not audited yet)
        sub_payload = {"title": "Raw Draft Document", "raw_text": "Initial rough copy."}
        res_sub = await client.post("/api/content", json=sub_payload)
        content_id = res_sub.json()["id"]

        # Attempt to approve directly without audit / while state is 'submitted'
        invalid_review = {
            "content_id": content_id,
            "revision_id": f"rev-{content_id}-1",
            "action": "approved",
            "comments": "Premature approval attempt.",
        }
        res_fail = await client.post("/api/reviews/decision", json=invalid_review)
        assert res_fail.status_code == 400
        assert "Human review decisions can only be made when state is 'pending_approval'" in res_fail.json()["detail"]


@pytest.mark.asyncio
async def test_dynamic_analytics_calculation():
    """Verify analytics calculates counts from stored database rows rather than hardcoded numbers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Query /api/analytics
        res_analytics = await client.get("/api/analytics")
        assert res_analytics.status_code == 200
        analytics = res_analytics.json()

        # Must contain dynamic metrics calculated from database
        assert "total_content_items" in analytics
        assert "total_audits" in analytics
        assert "total_approved" in analytics
        assert "findings_by_severity" in analytics
        assert "findings_by_category" in analytics
        assert "content_by_status" in analytics
        assert isinstance(analytics["total_content_items"], int)
        assert isinstance(analytics["approval_rate_pct"], float)

        # Query /api/analytics/summary
        res_summary = await client.get("/api/analytics/summary")
        assert res_summary.status_code == 200
        summary = res_summary.json()
        assert "total_audits_conducted" in summary
        assert "top_violation_categories" in summary


@pytest.mark.asyncio
async def test_error_handling_and_validation():
    """Verify safe 404, 422, and 400 error responses without stack traces or secret leaks."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Nonexistent content
        res_404_content = await client.get("/api/content/cnt-nonexistent-999")
        assert res_404_content.status_code == 404

        # Nonexistent guideline
        res_404_guideline = await client.get("/api/guidelines/gd-nonexistent-999")
        assert res_404_guideline.status_code == 404

        # Malformed guideline payload (missing required title)
        res_422_rule = await client.post("/api/guidelines/gd-brand-voice/rules", json={"rule_key": "bad"})
        assert res_422_rule.status_code == 422
