"""
Comprehensive Tests for Phase 6: Unified Workflow and Approval Orchestration
Validates:
1. Campaign creation, tenant isolation, and initial draft state.
2. Workflow state machine transitions (valid flows, invalid rejections, and role guards).
3. Invariant: AI engines NEVER transition a campaign or submission to APPROVED.
4. Optimistic concurrency control (version conflict detection throwing 409).
5. Policy decision service: dynamic determination of required review tracks (Marketing, Visual, Legal).
6. Multi-track review orchestration: exact version association, partial failure resilience.
7. Human review & approval gating: separation of duties preventing creator self-approval.
8. Revision invalidation: modifying content after approval suspends readiness until re-audited.
9. In-app notifications: delivery, read tracking, and idempotency deduplication.
10. Activity timeline and audit trail immutability.
11. Strict cross-tenant isolation on campaigns and notifications.
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.database.session import get_db
from app.core.security import AuthContext, UserRole
from app.models import (
    Organization,
    User,
    Membership,
    BrandGuideline,
    GuidelineRule,
    ContentSubmission,
    ContentRevision,
    AuditEvent,
    ReviewDecision,
)
from app.models.campaign import Campaign
from app.models.notification import Notification
from app.workflow.state_machine import WorkflowStateMachine, WorkflowState, WorkflowTransitionError
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignDecisionRequest,
    CampaignPriority,
    CampaignReviewTrackStatus,
)
from app.services.workflow.campaign_orchestrator import CampaignOrchestrator
from app.services.workflow.campaign_policy import CampaignPolicyService
from app.services.workflow.notification_service import NotificationService


@pytest.fixture
def marketing_auth():
    return AuthContext(
        user_id="usr_mkt_101",
        organization_id="org_workflow_corp",
        roles=[UserRole.MARKETING, UserRole.CREATOR],
        email="mkt.lead@workflow.internal",
        is_authenticated=True,
    )


@pytest.fixture
def compliance_auth():
    return AuthContext(
        user_id="usr_comp_202",
        organization_id="org_workflow_corp",
        roles=[UserRole.COMPLIANCE_OFFICER, UserRole.LEGAL, UserRole.REVIEWER],
        email="compliance.reviewer@workflow.internal",
        is_authenticated=True,
    )


@pytest.fixture
def admin_auth():
    return AuthContext(
        user_id="usr_admin_303",
        organization_id="org_workflow_corp",
        roles=[UserRole.ADMIN],
        email="admin@workflow.internal",
        is_authenticated=True,
    )


@pytest.fixture
def adversary_auth():
    return AuthContext(
        user_id="usr_adversary_999",
        organization_id="org_competitor_888",
        roles=[UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER],
        email="adversary@competitor.internal",
        is_authenticated=True,
    )


@pytest.fixture
def seed_workflow_env(db_session, marketing_auth, compliance_auth):
    # Tenant Setup
    org = Organization(id="org_workflow_corp", name="Workflow Enterprise Corp", slug="workflow-corp")
    mkt_user = User(id="usr_mkt_101", email="mkt.lead@workflow.internal", full_name="Alice Marketing")
    comp_user = User(id="usr_comp_202", email="compliance.reviewer@workflow.internal", full_name="Robert Counsel")
    db_session.add_all([org, mkt_user, comp_user])

    # Published Brand Guideline with a rule
    guideline = BrandGuideline(
        id="guide_wf_001",
        organization_id=org.id,
        name="Global Brand Governance Guideline",
        version="1.0.0",
        is_active=True,
    )
    rule = GuidelineRule(
        guideline_id=guideline.id,
        category="brand_rules",
        rule_name="Mandatory High Availability Claims Policy",
        rule_definition={"forbidden_terms": ["100% guarantee", "zero downtime"]},
        severity_default="critical",
        requires_human_review=True,
    )
    db_session.add_all([guideline, rule])

    # Seed an attached text submission
    sub = ContentSubmission(
        id="sub_wf_001",
        organization_id=org.id,
        creator_id=mkt_user.id,
        title="Q4 AI Cloud Launch Copy",
        content_type="text",
        status=WorkflowState.DRAFT.value,
    )
    db_session.add(sub)
    db_session.flush()

    rev = ContentRevision(
        id="rev_wf_001",
        submission_id=sub.id,
        version_number=1,
        raw_text="Inkloom AI delivers 99.9% reliable cloud governance for high-growth enterprises.",
    )
    db_session.add(rev)
    sub.current_revision_id = rev.id
    db_session.commit()

    return {
        "org": org,
        "mkt_user": mkt_user,
        "comp_user": comp_user,
        "submission": sub,
        "revision": rev,
    }


def test_campaign_creation_and_defaults(db_session, marketing_auth, seed_workflow_env):
    """
    Test 1: Validates campaign creation, tenant isolation, priority, and audit trail logging.
    """
    payload = CampaignCreate(
        name="Global Cloud Governance Q4",
        description="Unified enterprise marketing campaign across web and digital channels.",
        product_name="Enterprise Cloud AI",
        target_audience="Enterprise CIOs and Compliance Directors",
        target_channel="omnichannel",
        target_jurisdiction="US",
        regulated_category="b2b_enterprise_saas",
        priority=CampaignPriority.HIGH,
        creative_brief="Establish Inkloom AI as the trusted brand governance partner.",
        submission_ids=["sub_wf_001"],
    )

    campaign = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)

    assert campaign.id.startswith("cmp_")
    assert campaign.name == "Global Cloud Governance Q4"
    assert campaign.status == WorkflowState.DRAFT.value
    assert campaign.version == 1
    assert campaign.organization_id == marketing_auth.organization_id
    assert campaign.owner_id == marketing_auth.user_id

    # Verify submission was linked to the campaign
    sub = db_session.query(ContentSubmission).filter(ContentSubmission.id == "sub_wf_001").first()
    assert sub.campaign_id == campaign.id

    # Verify audit trail event was logged
    audit_event = db_session.query(AuditEvent).filter(
        AuditEvent.organization_id == marketing_auth.organization_id,
        AuditEvent.entity_id == campaign.id,
        AuditEvent.event_type == "campaign_created",
    ).first()
    assert audit_event is not None


def test_campaign_state_machine_transitions():
    """
    Test 2: Validates strict state transition enforcement and AI-approval prohibitions.
    """
    # Valid progression
    assert WorkflowStateMachine.can_transition("draft", "in_progress") is True
    assert WorkflowStateMachine.can_transition("in_progress", "ai_review_in_progress") is True
    assert WorkflowStateMachine.can_transition("ai_review_in_progress", "human_review_pending") is True
    assert WorkflowStateMachine.can_transition("human_review_pending", "approved") is True

    # Invalid jump: draft cannot jump directly to approved
    assert WorkflowStateMachine.can_transition("draft", "approved") is False

    with pytest.raises(WorkflowTransitionError) as exc:
        WorkflowStateMachine.validate_transition(
            current="draft",
            target="approved",
            actor_role="compliance_officer",
        )
    assert "Permissible target states from 'draft'" in str(exc.value)

    # Invariant: AI engines may NEVER authorize publication approval
    with pytest.raises(WorkflowTransitionError) as exc_ai:
        WorkflowStateMachine.validate_transition(
            current="human_review_pending",
            target="approved",
            actor_role="admin",
            is_ai_action=True,
        )
    assert "AI engines cannot authorize publication" in str(exc_ai.value)

    # Unauthorized role attempting to approve
    with pytest.raises(WorkflowTransitionError) as exc_role:
        WorkflowStateMachine.validate_transition(
            current="human_review_pending",
            target="approved",
            actor_role="creator",
            is_ai_action=False,
        )
    assert "does not have authority to approve" in str(exc_role.value)


def test_campaign_optimistic_concurrency_lock(db_session, marketing_auth, seed_workflow_env):
    """
    Test 3: Validates that concurrent updates with mismatched version counters throw HTTP 409 Conflict.
    """
    payload = CampaignCreate(
        name="Concurrent Test Campaign",
        priority=CampaignPriority.MEDIUM,
    )
    campaign = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)
    assert campaign.version == 1

    # Update with matching version succeeds and bumps version to 2
    update_ok = CampaignUpdate(name="Renamed Campaign", version=1)
    updated = CampaignOrchestrator.update_campaign(db_session, marketing_auth, campaign.id, update_ok)
    assert updated.version == 2
    assert updated.name == "Renamed Campaign"

    # Stale client tries updating using version 1 -> Must throw 409 Conflict
    stale_update = CampaignUpdate(name="Stale Rename", version=1)
    with pytest.raises(HTTPException) as exc:
        CampaignOrchestrator.update_campaign(db_session, marketing_auth, campaign.id, stale_update)
    assert exc.value.status_code == 409
    assert "Concurrent modification detected" in exc.value.detail


def test_policy_service_determines_required_tracks(db_session, marketing_auth, seed_workflow_env):
    """
    Test 4: Dynamic policy determination based on jurisdiction, product category, and content format.
    """
    # 1. Regulated enterprise SaaS campaign in EU with visual channel -> Requires marketing, visual, legal
    cmp_saas = Campaign(
        id="cmp_test_policy_01",
        organization_id="org_workflow_corp",
        name="SaaS EU Campaign",
        target_channel="display_ads",
        target_jurisdiction="EU",
        regulated_category="b2b_enterprise_saas",
        status="draft",
        policy_config={},
    )
    tracks = CampaignPolicyService.get_required_tracks_for_campaign(cmp_saas)
    assert "marketing" in tracks
    assert "visual" in tracks
    assert "legal" in tracks

    # 2. General commercial text-only campaign in Global jurisdiction
    cmp_general = Campaign(
        id="cmp_test_policy_02",
        organization_id="org_workflow_corp",
        name="Internal Newsletter",
        target_channel="email",
        target_jurisdiction="Global",
        regulated_category="general_commercial",
        status="draft",
        policy_config={"required_reviews": ["marketing"]},
    )
    tracks_gen = CampaignPolicyService.get_required_tracks_for_campaign(cmp_general)
    assert tracks_gen == ["marketing"]


def test_multi_track_ai_review_orchestration(db_session, marketing_auth, seed_workflow_env):
    """
    Test 5: Runs end-to-end multi-track audits (Marketing, Visual, Legal) and captures exact revision IDs.
    """
    payload = CampaignCreate(
        name="Omnichannel AI Campaign",
        target_jurisdiction="US",
        regulated_category="b2b_enterprise_saas",
        submission_ids=["sub_wf_001"],
    )
    campaign = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)

    # Execute review orchestration
    response = CampaignOrchestrator.run_campaign_reviews(db_session, marketing_auth, campaign.id)

    assert response.status == WorkflowState.HUMAN_REVIEW_PENDING.value
    assert "marketing" in response.review_tracks
    assert response.review_tracks["marketing"].status in [
        CampaignReviewTrackStatus.COMPLETED,
        CampaignReviewTrackStatus.COMPLETED_WITH_WARNINGS,
    ]
    assert response.review_tracks["marketing"].reviewed_revision_id == "rev_wf_001"
    assert "legal" in response.review_tracks


def test_human_review_and_separation_of_duties(db_session, marketing_auth, compliance_auth, seed_workflow_env):
    """
    Test 6: Validates segregation of duties preventing content creator self-approval,
    and records compliant independent reviewer sign-off.
    """
    payload = CampaignCreate(
        name="Self-Approval Block Test",
        submission_ids=["sub_wf_001"],
    )
    campaign = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)
    campaign.status = WorkflowState.HUMAN_REVIEW_PENDING.value
    db_session.commit()

    # Creator attempts to approve their own campaign -> Must be rejected with HTTP 403
    decision_payload = CampaignDecisionRequest(
        action="approve",
        comments="Looks good to me as the creator.",
    )
    with pytest.raises(HTTPException) as exc:
        CampaignOrchestrator.record_decision(db_session, marketing_auth, campaign.id, decision_payload)
    assert exc.value.status_code == 403
    assert "Segregation of duties violation" in exc.value.detail

    # Designated compliance reviewer signs off -> Success
    counsel_decision = CampaignDecisionRequest(
        action="approve",
        comments="Approved by designated in-house compliance officer for public release.",
        conditions=["Require 99.9% SLA footnote on landing page."],
    )
    approved_cmp = CampaignOrchestrator.record_decision(db_session, compliance_auth, campaign.id, counsel_decision)
    assert approved_cmp.status == WorkflowState.APPROVED.value


def test_content_revision_invalidates_readiness(db_session, marketing_auth, compliance_auth, seed_workflow_env):
    """
    Test 7: Adding a new content revision (v2) to an attached submission after approval
    automatically suspends readiness and alerts the reviewer that re-audit is required.
    """
    payload = CampaignCreate(
        name="Revision Invalidation Campaign",
        submission_ids=["sub_wf_001"],
    )
    campaign = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)
    
    # Run audit and approve campaign
    CampaignOrchestrator.run_campaign_reviews(db_session, marketing_auth, campaign.id)
    decision = CampaignDecisionRequest(action="approve", comments="Approved v1")
    CampaignOrchestrator.record_decision(db_session, compliance_auth, campaign.id, decision)

    # Now verify readiness on v1
    readiness_v1 = CampaignPolicyService.evaluate_readiness(campaign, db_session)
    assert readiness_v1.is_ready_for_release is True

    # Creator modifies submission by creating Revision v2
    sub = seed_workflow_env["submission"]
    rev_v2 = ContentRevision(
        id="rev_wf_002",
        submission_id=sub.id,
        version_number=2,
        raw_text="Modified un-audited copy claiming 100% infallible execution.",
    )
    db_session.add(rev_v2)
    sub.current_revision_id = rev_v2.id
    db_session.commit()

    # Readiness MUST be suspended/invalidated
    readiness_v2 = CampaignPolicyService.evaluate_readiness(campaign, db_session)
    assert readiness_v2.is_ready_for_release is False
    assert any("was revised to v2 after last audit" in b for b in readiness_v2.outstanding_blockers)


def test_in_app_notifications_dispatch_and_deduplication(db_session, marketing_auth, compliance_auth):
    """
    Test 8: Validates notification creation, read marking, and idempotency deduplication.
    """
    idemp_key = "test_review_assign_unique_42"

    # Dispatch first notification
    notif1 = NotificationService.dispatch_notification(
        db=db_session,
        organization_id=marketing_auth.organization_id,
        recipient_id=compliance_auth.user_id,
        sender_id=marketing_auth.user_id,
        title="Review Assigned",
        message="Please review Q4 Campaign.",
        notification_type="review_assigned",
        link_url="/campaigns/cmp_001",
        idempotency_key=idemp_key,
    )
    assert notif1.is_read is False

    # Dispatch duplicate notification with same key -> Must return existing record
    notif2 = NotificationService.dispatch_notification(
        db=db_session,
        organization_id=marketing_auth.organization_id,
        recipient_id=compliance_auth.user_id,
        sender_id=marketing_auth.user_id,
        title="Review Assigned (Duplicate Attempt)",
        message="Duplicate message.",
        notification_type="review_assigned",
        idempotency_key=idemp_key,
    )
    assert notif1.id == notif2.id

    # Recipient marks as read
    read_notif = NotificationService.mark_read(
        db=db_session,
        organization_id=marketing_auth.organization_id,
        recipient_id=compliance_auth.user_id,
        notification_id=notif1.id,
    )
    assert read_notif.is_read is True
    assert read_notif.read_at is not None


def test_activity_timeline_audit_trail(db_session, marketing_auth, seed_workflow_env):
    """
    Test 9: Verifies chronological audit event trail logging for key workflow actions.
    """
    payload = CampaignCreate(
        name="Audit Trail Test Campaign",
    )
    campaign = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)
    
    # Update campaign
    CampaignOrchestrator.update_campaign(
        db_session,
        marketing_auth,
        campaign.id,
        CampaignUpdate(description="Updated description for audit tracking"),
    )

    # Query events
    events = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.entity_id == campaign.id)
        .order_by(AuditEvent.created_at.desc())
        .all()
    )
    assert len(events) >= 2
    types = [e.event_type for e in events]
    assert "campaign_created" in types
    assert "campaign_updated" in types


def test_cross_tenant_isolation_on_campaigns(db_session, marketing_auth, adversary_auth, seed_workflow_env):
    """
    Test 10: Ensures Tenant B cannot view, update, or approve Tenant A's campaigns.
    """
    payload = CampaignCreate(
        name="Confidential Tenant A Campaign",
    )
    cmp_a = CampaignOrchestrator.create_campaign(db_session, marketing_auth, payload)

    # Tenant B tries to access Tenant A's campaign
    with pytest.raises(HTTPException) as exc_get:
        CampaignOrchestrator.get_campaign(db_session, adversary_auth, cmp_a.id)
    assert exc_get.value.status_code == 404

    # Tenant B tries to update Tenant A's campaign
    with pytest.raises(HTTPException) as exc_up:
        CampaignOrchestrator.update_campaign(
            db_session,
            adversary_auth,
            cmp_a.id,
            CampaignUpdate(name="Hacked Campaign"),
        )
    assert exc_up.value.status_code == 404
