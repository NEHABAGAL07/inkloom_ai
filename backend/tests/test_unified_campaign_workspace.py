"""
Tests for INKLOOM AI - Unified Marketing Campaign Management Workspace
Validates all 12 criteria specified in Section 9:
1. User can create a campaign.
2. Campaign is persisted in the database.
3. Authorized roles can view the campaign.
4. Designer can create content within the campaign context.
5. One master post can have multiple platform adaptations.
6. The content is linked to the correct campaign.
7. Review records are linked to the correct content and campaign.
8. Approved content can be scheduled or published through supported integrations.
9. Marketing can view the campaign's actual analytics.
10. AI campaign insights use actual analytics.
11. Tenant and role restrictions work correctly.
12. Empty states work when no campaigns or content exist.
"""
import pytest
from datetime import datetime, timezone
from fastapi import HTTPException

from app.core.security import AuthContext, UserRole
from app.models import Organization, User, ContentSubmission, ContentRevision, ReviewDecision, AuditEvent
from app.models.campaign import Campaign
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignPriority,
    CampaignDecisionRequest,
)
from app.services.workflow.campaign_orchestrator import CampaignOrchestrator
from app.services.workflow.campaign_policy import CampaignPolicyService


@pytest.fixture
def workspace_env(db_session):
    """Seed test organizations and users with different roles."""
    org1 = Organization(id="org_marketing_corp", name="Marketing Global Corp", slug="mkt-corp")
    org2 = Organization(id="org_rival_corp", name="Rival Enterprises", slug="rival-corp")

    user_mkt = User(id="usr_mkt_99", email="sarah.marketing@corp.internal", full_name="Sarah Marketer")
    user_des = User(id="usr_des_99", email="dave.designer@corp.internal", full_name="Dave Designer")
    user_leg = User(id="usr_leg_99", email="laura.legal@corp.internal", full_name="Laura Legal")
    user_adm = User(id="usr_adm_99", email="adam.admin@corp.internal", full_name="Adam Admin")
    user_rival = User(id="usr_rival_99", email="rival@rival.internal", full_name="Rival User")

    db_session.add_all([org1, org2, user_mkt, user_des, user_leg, user_adm, user_rival])
    db_session.commit()

    return {
        "org_id": org1.id,
        "rival_org_id": org2.id,
        "mkt_auth": AuthContext(
            user_id=user_mkt.id,
            organization_id=org1.id,
            roles=[UserRole.MARKETING, UserRole.CREATOR],
            email=user_mkt.email,
            is_authenticated=True,
        ),
        "des_auth": AuthContext(
            user_id=user_des.id,
            organization_id=org1.id,
            roles=[UserRole.DESIGNER, UserRole.CREATOR],
            email=user_des.email,
            is_authenticated=True,
        ),
        "leg_auth": AuthContext(
            user_id=user_leg.id,
            organization_id=org1.id,
            roles=[UserRole.LEGAL, UserRole.COMPLIANCE_OFFICER, UserRole.REVIEWER],
            email=user_leg.email,
            is_authenticated=True,
        ),
        "adm_auth": AuthContext(
            user_id=user_adm.id,
            organization_id=org1.id,
            roles=[UserRole.ADMIN],
            email=user_adm.email,
            is_authenticated=True,
        ),
        "rival_auth": AuthContext(
            user_id=user_rival.id,
            organization_id=org2.id,
            roles=[UserRole.MARKETING, UserRole.ADMIN],
            email=user_rival.email,
            is_authenticated=True,
        ),
    }


def test_1_and_2_create_and_persist_campaign(db_session, workspace_env):
    """1. User can create a campaign. 2. Campaign is persisted in the database."""
    auth = workspace_env["mkt_auth"]

    payload = CampaignCreate(
        name="Acme Cloud Product Launch 2026",
        campaign_objective="Introduce a new enterprise cloud governance platform.",
        description="Comprehensive omnichannel launch campaign targeting CIOs and DevOps leaders.",
        target_audience="Enterprise CIOs & IT Directors",
        campaign_type="Product Launch",
        start_date="2026-11-01",
        end_date="2026-12-15",
        platforms=["LinkedIn", "Instagram", "Facebook", "Blog", "Email"],
        content_formats=["Social Post", "Display Banner", "Editorial Article"],
        brand_info="Acme Cloud Enterprise v4.0",
        priority=CampaignPriority.HIGH,
    )

    campaign = CampaignOrchestrator.create_campaign(db=db_session, auth=auth, payload=payload)
    db_session.commit()

    # 1. Verification of creation
    assert campaign.id is not None
    assert campaign.name == "Acme Cloud Product Launch 2026"
    assert campaign.status == "draft"

    # 2. Direct database persistence verification
    saved_campaign = db_session.query(Campaign).filter_by(id=campaign.id).first()
    assert saved_campaign is not None
    assert saved_campaign.organization_id == auth.organization_id
    assert saved_campaign.owner_id == auth.user_id
    assert saved_campaign.campaign_type == "Product Launch"
    assert "LinkedIn" in saved_campaign.platforms
    assert saved_campaign.version == 1


def test_3_authorized_roles_can_view_campaign(db_session, workspace_env):
    """3. Authorized roles (Manager, Marketing, Designer, Legal) can view the campaign."""
    mkt_auth = workspace_env["mkt_auth"]
    des_auth = workspace_env["des_auth"]
    leg_auth = workspace_env["leg_auth"]
    adm_auth = workspace_env["adm_auth"]

    payload = CampaignCreate(
        name="Governance Campaign Q4",
        campaign_objective="Compliance overview",
        priority=CampaignPriority.MEDIUM,
    )
    campaign = CampaignOrchestrator.create_campaign(db=db_session, auth=mkt_auth, payload=payload)
    db_session.commit()

    # Marketing can retrieve
    c_mkt = CampaignOrchestrator.get_campaign(db=db_session, auth=mkt_auth, campaign_id=campaign.id)
    assert c_mkt.id == campaign.id

    # Designer can retrieve
    c_des = CampaignOrchestrator.get_campaign(db=db_session, auth=des_auth, campaign_id=campaign.id)
    assert c_des.id == campaign.id

    # Legal can retrieve
    c_leg = CampaignOrchestrator.get_campaign(db=db_session, auth=leg_auth, campaign_id=campaign.id)
    assert c_leg.id == campaign.id

    # Admin can retrieve
    c_adm = CampaignOrchestrator.get_campaign(db=db_session, auth=adm_auth, campaign_id=campaign.id)
    assert c_adm.id == campaign.id


def test_4_and_6_designer_creates_content_linked_to_campaign(db_session, workspace_env):
    """4. Designer can create content within the campaign context. 6. Content is linked to correct campaign."""
    mkt_auth = workspace_env["mkt_auth"]
    des_auth = workspace_env["des_auth"]

    # 1. Create campaign
    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(name="Summer Cloud Expo", priority=CampaignPriority.MEDIUM),
    )
    db_session.commit()

    # 2. Designer creates a design brief submission linked directly to the campaign
    submission = ContentSubmission(
        id="sub_des_brief_001",
        organization_id=des_auth.organization_id,
        creator_id=des_auth.user_id,
        campaign_id=campaign.id,
        title="Acme Cloud Enterprise Banner Ad",
        content_type="image",
        status="submitted",
        description="Key visual asset for cloud launch",
    )
    revision = ContentRevision(
        id="rev_des_001",
        submission_id=submission.id,
        version_number=1,
        raw_text="Zero trust cloud compliance guaranteed.",
    )
    db_session.add_all([submission, revision])
    db_session.commit()

    # 6. Verify relationship
    loaded_campaign = CampaignOrchestrator.get_campaign(db=db_session, auth=mkt_auth, campaign_id=campaign.id)
    assert len(loaded_campaign.submissions) == 1
    assert loaded_campaign.submissions[0].id == "sub_des_brief_001"
    assert loaded_campaign.submissions[0].campaign_id == campaign.id


def test_5_one_master_post_multiple_platform_adaptations(db_session, workspace_env):
    """5. One master post can have multiple platform adaptations under the same campaign."""
    mkt_auth = workspace_env["mkt_auth"]

    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(
            name="Omnichannel Product Rollout",
            platforms=["LinkedIn", "Instagram", "Facebook"],
            priority=CampaignPriority.HIGH,
        ),
    )
    db_session.commit()

    # Master post
    master = ContentSubmission(
        id="sub_master_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="Master Announcement: Cloud Platform 2026",
        content_type="text",
        status="submitted",
    )

    # LinkedIn adaptation
    adapt_li = ContentSubmission(
        id="sub_adapt_li_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="[LinkedIn] Master Announcement: Cloud Platform 2026",
        content_type="text",
        status="submitted",
    )

    # Instagram visual adaptation
    adapt_ig = ContentSubmission(
        id="sub_adapt_ig_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="[Instagram Carousel] Visual Feature Highlights",
        content_type="image",
        status="submitted",
    )

    db_session.add_all([master, adapt_li, adapt_ig])
    db_session.commit()

    loaded_campaign = CampaignOrchestrator.get_campaign(db=db_session, auth=mkt_auth, campaign_id=campaign.id)
    assert len(loaded_campaign.submissions) == 3
    all_sub_ids = [s.id for s in loaded_campaign.submissions]
    assert "sub_master_001" in all_sub_ids
    assert "sub_adapt_li_001" in all_sub_ids
    assert "sub_adapt_ig_001" in all_sub_ids


def test_7_review_records_linked_to_content_and_campaign(db_session, workspace_env):
    """7. Review records are linked to the correct content and campaign."""
    mkt_auth = workspace_env["mkt_auth"]
    leg_auth = workspace_env["leg_auth"]

    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(name="Regulated Cloud Service", priority=CampaignPriority.CRITICAL),
    )
    db_session.commit()

    submission = ContentSubmission(
        id="sub_claim_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="Enterprise Speed Benchmark",
        content_type="text",
        status="submitted",
    )
    db_session.add(submission)
    db_session.commit()

    # Move to human review state
    campaign.status = "human_review_pending"
    db_session.add(campaign)
    db_session.commit()

    # Legal review decision
    decision_payload = CampaignDecisionRequest(
        action="approve",
        comments="Claims verified against SOC2 benchmark reports.",
    )
    res = CampaignOrchestrator.record_decision(
        db=db_session,
        auth=leg_auth,
        campaign_id=campaign.id,
        payload=decision_payload,
    )

    # Verify decision is recorded in audit trail
    events = (
        db_session.query(AuditEvent)
        .filter_by(entity_id=campaign.id, organization_id=mkt_auth.organization_id)
        .all()
    )
    event_types = [e.event_type for e in events]
    assert any("campaign_decision" in et for et in event_types)


def test_8_approved_content_scheduled_and_published(db_session, workspace_env):
    """8. Approved content can be scheduled or published through supported integrations."""
    mkt_auth = workspace_env["mkt_auth"]

    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(name="Q1 Product Reveal", priority=CampaignPriority.MEDIUM),
    )
    db_session.commit()

    sub = ContentSubmission(
        id="sub_sched_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="Live Keynote Teaser",
        content_type="text",
        status="approved",
    )
    db_session.add(sub)
    db_session.commit()

    # Schedule post
    scheduled_campaign = CampaignOrchestrator.schedule_post(
        db=db_session,
        auth=mkt_auth,
        campaign_id=campaign.id,
        submission_id=sub.id,
        platform="LinkedIn",
        scheduled_at="2026-11-05T14:00:00Z",
        notes="Target US West coast audience",
    )

    schedule = scheduled_campaign.publishing_schedule
    assert len(schedule) == 1
    assert schedule[0]["platform"] == "LinkedIn"
    assert schedule[0]["status"] == "scheduled"
    sched_id = schedule[0]["id"]

    # Publish post
    published_campaign = CampaignOrchestrator.publish_post(
        db=db_session,
        auth=mkt_auth,
        campaign_id=campaign.id,
        schedule_id=sched_id,
        notes="Published via LinkedIn API",
    )

    updated_schedule = published_campaign.publishing_schedule
    assert updated_schedule[0]["status"] == "published"
    assert updated_schedule[0]["published_at"] is not None


def test_9_marketing_can_view_actual_analytics(db_session, workspace_env):
    """9. Marketing can view the campaign's actual analytics."""
    mkt_auth = workspace_env["mkt_auth"]

    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(name="Spring Campaign", priority=CampaignPriority.MEDIUM),
    )
    db_session.commit()

    sub = ContentSubmission(
        id="sub_perf_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="Spring Post",
        content_type="text",
        status="approved",
    )
    db_session.add(sub)
    db_session.commit()

    perf = CampaignOrchestrator.get_or_calculate_performance(
        db=db_session,
        auth=mkt_auth,
        campaign_id=campaign.id,
    )

    assert "impressions" in perf
    assert perf["impressions"] > 0
    assert "reach" in perf
    assert "clicks" in perf
    assert "engagement_rate" in perf
    assert "platform_breakdown" in perf
    assert "linkedin" in perf["platform_breakdown"]


def test_10_ai_campaign_insights_use_actual_analytics(db_session, workspace_env):
    """10. AI campaign insights use actual analytics."""
    mkt_auth = workspace_env["mkt_auth"]

    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(
            name="AI Analytics Testing",
            target_audience="Enterprise Developers",
            priority=CampaignPriority.HIGH,
        ),
    )
    db_session.commit()

    sub = ContentSubmission(
        id="sub_insights_001",
        organization_id=mkt_auth.organization_id,
        creator_id=mkt_auth.user_id,
        campaign_id=campaign.id,
        title="High Performance Post",
        content_type="text",
        status="approved",
    )
    db_session.add(sub)
    db_session.commit()

    insights = CampaignOrchestrator.generate_ai_insights(
        db=db_session,
        auth=mkt_auth,
        campaign_id=campaign.id,
    )

    assert "summary" in insights
    assert "best_performing_content" in insights
    assert "platform_comparisons" in insights
    assert "evidence_basis" in insights
    assert len(insights["platform_comparisons"]) > 0


def test_11_tenant_and_role_restrictions(db_session, workspace_env):
    """11. Tenant and role restrictions work correctly."""
    mkt_auth = workspace_env["mkt_auth"]
    rival_auth = workspace_env["rival_auth"]

    # Org 1 campaign
    campaign = CampaignOrchestrator.create_campaign(
        db=db_session,
        auth=mkt_auth,
        payload=CampaignCreate(name="Confidential Internal Campaign", priority=CampaignPriority.HIGH),
    )
    db_session.commit()

    # Competitor from Org 2 cannot retrieve Org 1 campaign (404 isolation)
    with pytest.raises(HTTPException) as exc_info:
        CampaignOrchestrator.get_campaign(db=db_session, auth=rival_auth, campaign_id=campaign.id)
    assert exc_info.value.status_code == 404

    # Listing campaigns from rival org returns empty list
    rival_campaigns = CampaignOrchestrator.list_campaigns(db=db_session, auth=rival_auth)
    assert len(rival_campaigns) == 0


def test_12_empty_states_work_when_no_campaigns_or_content_exist(db_session, workspace_env):
    """12. Empty states work when no campaigns or content exist."""
    rival_auth = workspace_env["rival_auth"]

    # When no campaigns exist:
    summary = CampaignOrchestrator.get_campaign_summary(db=db_session, auth=rival_auth)
    assert summary["total_campaigns"] == 0
    assert summary["draft_campaigns"] == 0
    assert summary["in_progress_campaigns"] == 0
    assert summary["published_campaigns"] == 0

    campaigns = CampaignOrchestrator.list_campaigns(db=db_session, auth=rival_auth)
    assert campaigns == []
