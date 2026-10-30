import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import (
    Organization,
    User,
    Membership,
    ContentSubmission,
    ContentRevision,
    ReviewCycle,
    DepartmentReview,
    DepartmentFeedback,
)
from app.services.review_cycle_service import ReviewCycleService
from app.core.security import AuthContext, UserRole
from app.schemas.review_cycle import DepartmentReviewSubmit, DepartmentFeedbackCreate


@pytest.fixture
def test_setup_data(db_session: Session):
    """Seed base organization, users with departmental roles, and initial designer submission."""
    org = Organization(
        id=f"org_test_{uuid.uuid4().hex[:8]}",
        name="Acme Governance Corp",
        slug="acme-gov",
    )
    db_session.add(org)

    # Designer
    designer = User(
        id=f"usr_des_{uuid.uuid4().hex[:8]}",
        email="leo.designer@acme.test",
        full_name="Leo Vance",
        hashed_password="test_hash",
    )
    # Brand Manager / Admin
    manager = User(
        id=f"usr_mgr_{uuid.uuid4().hex[:8]}",
        email="alex.manager@acme.test",
        full_name="Alex Mercer",
        hashed_password="test_hash",
    )
    # Marketing Lead
    marketer = User(
        id=f"usr_mkt_{uuid.uuid4().hex[:8]}",
        email="maya.marketing@acme.test",
        full_name="Maya Lin",
        hashed_password="test_hash",
    )
    # Legal Counsel
    legal = User(
        id=f"usr_leg_{uuid.uuid4().hex[:8]}",
        email="elena.legal@acme.test",
        full_name="Elena Rostova",
        hashed_password="test_hash",
    )

    db_session.add_all([designer, manager, marketer, legal])
    db_session.flush()

    # Memberships
    m_des = Membership(user_id=designer.id, organization_id=org.id, role="designer")
    m_mgr = Membership(user_id=manager.id, organization_id=org.id, role="admin")
    m_mkt = Membership(user_id=marketer.id, organization_id=org.id, role="marketing")
    m_leg = Membership(user_id=legal.id, organization_id=org.id, role="legal")
    db_session.add_all([m_des, m_mgr, m_mkt, m_leg])

    # Initial submission
    submission = ContentSubmission(
        id=f"sub_test_{uuid.uuid4().hex[:8]}",
        organization_id=org.id,
        creator_id=designer.id,
        title="Q4 Enterprise Hero Visual Banner",
        description="Hero visual banner submitted for Q4 brand governance.",
        content_type="image",
        status="pending_approval",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(submission)
    db_session.flush()

    rev1 = ContentRevision(
        submission_id=submission.id,
        version_number=1,
        file_name="Q4_Hero_Banner_v1.png",
        raw_text="Visual submission with cyber slate palette #14263D.",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(rev1)
    db_session.flush()

    submission.current_revision_id = rev1.id
    db_session.commit()

    return {
        "org": org,
        "designer": designer,
        "manager": manager,
        "marketer": marketer,
        "legal": legal,
        "submission": submission,
        "revision1": rev1,
    }


def test_review_cycle_initialization(db_session: Session, test_setup_data):
    """
    Test Phase 2 & 3:
    When a designer submits a design, an active ReviewCycle is initialized with cycle_number=1,
    status='in_progress', and exactly 3 pending department reviews (Manager, Marketing, Legal).
    """
    sub = test_setup_data["submission"]
    cycle = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    assert cycle is not None
    assert cycle.cycle_number == 1
    assert cycle.status == "in_progress"
    assert cycle.submission_id == sub.id
    assert cycle.final_approval_status == "pending_approval"

    # Exactly 3 departments initialized
    assert len(cycle.departmental_reviews) == 3
    departments = {dr.department for dr in cycle.departmental_reviews}
    assert departments == {"manager", "marketing", "legal"}

    for dr in cycle.departmental_reviews:
        assert dr.review_status == "pending"
        assert dr.outcome is None


def test_department_role_guard_enforcement(db_session: Session, test_setup_data):
    """
    Test Phase 4 & 9:
    A user cannot submit a departmental review on behalf of another department
    unless authorized (e.g. legal user cannot submit marketing track review).
    """
    sub = test_setup_data["submission"]
    legal_user = test_setup_data["legal"]
    cycle = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    legal_auth = AuthContext(
        user_id=legal_user.id,
        organization_id=test_setup_data["org"].id,
        roles=[UserRole.LEGAL],
        email=legal_user.email,
        is_authenticated=True,
    )

    # Legal user attempts to review Marketing track -> should raise 403 HTTPException
    with pytest.raises(HTTPException) as exc_info:
        ReviewCycleService.submit_departmental_review(
            db=db_session,
            auth=legal_auth,
            cycle_id=cycle.id,
            payload=DepartmentReviewSubmit(
                department="marketing",
                outcome="no_changes_required",
            ),
        )
    assert exc_info.value.status_code == 403
    assert "Unauthorized" in exc_info.value.detail


def test_partial_reviews_keep_cycle_in_progress(db_session: Session, test_setup_data):
    """
    Test Phase 7:
    Cycle completes ONLY when all 3 departments submit.
    1 or 2 department reviews leave the cycle status as 'in_progress'.
    """
    sub = test_setup_data["submission"]
    cycle = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    manager = test_setup_data["manager"]
    mgr_auth = AuthContext(
        user_id=manager.id,
        organization_id=test_setup_data["org"].id,
        roles=[UserRole.ADMIN],
        email=manager.email,
        is_authenticated=True,
    )

    marketer = test_setup_data["marketer"]
    mkt_auth = AuthContext(
        user_id=marketer.id,
        organization_id=test_setup_data["org"].id,
        roles=[UserRole.MARKETING],
        email=marketer.email,
        is_authenticated=True,
    )

    # 1. Manager submits
    ReviewCycleService.submit_departmental_review(
        db=db_session,
        auth=mgr_auth,
        cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(
            department="manager",
            outcome="no_changes_required",
            comments="Approved visual hierarchy.",
        ),
    )

    db_session.refresh(cycle)
    assert cycle.status == "in_progress"

    # 2. Marketing submits
    ReviewCycleService.submit_departmental_review(
        db=db_session,
        auth=mkt_auth,
        cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(
            department="marketing",
            outcome="no_changes_required",
            comments="Messaging is clear.",
        ),
    )

    db_session.refresh(cycle)
    # Legal is still pending, so cycle MUST remain in_progress
    assert cycle.status == "in_progress"


def test_changes_requested_transitions_cycle_and_logs_feedback(db_session: Session, test_setup_data):
    """
    Test Phase 7 & 8:
    If any department requests changes, when all 3 finish, cycle status transitions to 'changes_requested'.
    Actionable department feedback is logged for the designer.
    """
    sub = test_setup_data["submission"]
    cycle = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    manager = test_setup_data["manager"]
    marketer = test_setup_data["marketer"]
    legal = test_setup_data["legal"]

    mgr_auth = AuthContext(user_id=manager.id, organization_id=test_setup_data["org"].id, roles=[UserRole.ADMIN], email=manager.email, is_authenticated=True)
    mkt_auth = AuthContext(user_id=marketer.id, organization_id=test_setup_data["org"].id, roles=[UserRole.MARKETING], email=marketer.email, is_authenticated=True)
    leg_auth = AuthContext(user_id=legal.id, organization_id=test_setup_data["org"].id, roles=[UserRole.LEGAL], email=legal.email, is_authenticated=True)

    # 1. Manager approves
    ReviewCycleService.submit_departmental_review(
        db=db_session,
        auth=mgr_auth,
        cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(department="manager", outcome="no_changes_required"),
    )

    # 2. Marketing requests changes with feedback item
    fb_item = DepartmentFeedbackCreate(
        category="Copywriting",
        description="Headline tone is overly aggressive. Please soften the call to action.",
        requested_correction="Change 'Crush competitors' to 'Empower your teams'.",
    )
    ReviewCycleService.submit_departmental_review(
        db=db_session,
        auth=mkt_auth,
        cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(
            department="marketing",
            outcome="changes_requested",
            comments="Revisions needed before public release.",
            feedback_items=[fb_item],
        ),
    )

    # 3. Legal approves
    ReviewCycleService.submit_departmental_review(
        db=db_session,
        auth=leg_auth,
        cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(department="legal", outcome="no_changes_required"),
    )

    db_session.refresh(cycle)
    db_session.refresh(sub)

    # Cycle status must be changes_requested
    assert cycle.status == "changes_requested"
    assert sub.status == "changes_requested"

    # Feedback was created
    fb_records = db_session.query(DepartmentFeedback).filter(DepartmentFeedback.cycle_id == cycle.id).all()
    assert len(fb_records) == 1
    assert fb_records[0].feedback_category == "Copywriting"
    assert fb_records[0].requested_correction == "Change 'Crush competitors' to 'Empower your teams'."

    # Cannot grant final approval while changes are requested
    with pytest.raises(HTTPException) as exc_info:
        ReviewCycleService.grant_final_approval(db_session, auth=mgr_auth, cycle_id=cycle.id)
    assert exc_info.value.status_code == 400
    assert "requested changes" in exc_info.value.detail


def test_designer_upload_v2_starts_new_cycle_preserving_history(db_session: Session, test_setup_data):
    """
    Test Phase 8:
    Designer uploads revised version (v2).
    A new review cycle (cycle_number=2) is created with status 'in_progress'.
    Cycle 1 and past department feedback remain preserved in database history.
    """
    sub = test_setup_data["submission"]
    cycle1 = ReviewCycleService.get_or_create_active_cycle(db_session, sub)
    cycle1_id = cycle1.id

    # Create revision 2
    rev2 = ContentRevision(
        submission_id=sub.id,
        version_number=2,
        file_name="Q4_Hero_Banner_v2.png",
        raw_text="Updated CTA: Empower your teams with verified cyber slate palette.",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(rev2)
    db_session.flush()

    sub.current_revision_id = rev2.id
    db_session.commit()

    # Get active cycle for updated submission
    cycle2 = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    assert cycle2.id != cycle1_id
    assert cycle2.cycle_number == 2
    assert cycle2.status == "in_progress"
    assert cycle2.revision_id == rev2.id

    # Verify cycle 1 still exists
    c1 = db_session.query(ReviewCycle).filter(ReviewCycle.id == cycle1_id).first()
    assert c1 is not None
    assert c1.cycle_number == 1


def test_all_departments_approve_and_manager_final_approval(db_session: Session, test_setup_data):
    """
    Test Phase 7 & 8:
    When all 3 departments submit 'no_changes_required', cycle transitions to 'review_complete'.
    Brand Admin can then grant final approval, transitioning cycle and submission to 'approved'.
    """
    sub = test_setup_data["submission"]
    cycle = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    manager = test_setup_data["manager"]
    marketer = test_setup_data["marketer"]
    legal = test_setup_data["legal"]

    mgr_auth = AuthContext(user_id=manager.id, organization_id=test_setup_data["org"].id, roles=[UserRole.ADMIN], email=manager.email, is_authenticated=True)
    mkt_auth = AuthContext(user_id=marketer.id, organization_id=test_setup_data["org"].id, roles=[UserRole.MARKETING], email=marketer.email, is_authenticated=True)
    leg_auth = AuthContext(user_id=legal.id, organization_id=test_setup_data["org"].id, roles=[UserRole.LEGAL], email=legal.email, is_authenticated=True)

    # All 3 approve
    ReviewCycleService.submit_departmental_review(
        db=db_session, auth=mgr_auth, cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(department="manager", outcome="no_changes_required")
    )
    ReviewCycleService.submit_departmental_review(
        db=db_session, auth=mkt_auth, cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(department="marketing", outcome="no_changes_required")
    )
    ReviewCycleService.submit_departmental_review(
        db=db_session, auth=leg_auth, cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(department="legal", outcome="no_changes_required")
    )

    db_session.refresh(cycle)
    assert cycle.status == "review_complete"

    # Non-admin cannot grant final approval
    with pytest.raises(HTTPException) as exc_info:
        ReviewCycleService.grant_final_approval(db_session, auth=mkt_auth, cycle_id=cycle.id)
    assert exc_info.value.status_code == 403

    # Admin grants final approval
    approved_cycle = ReviewCycleService.grant_final_approval(
        db=db_session,
        auth=mgr_auth,
        cycle_id=cycle.id,
        comments="All 3 departments approved and asset verified against 2026 standards.",
    )

    assert approved_cycle.status == "approved"
    assert approved_cycle.final_approval_status == "approved"
    assert approved_cycle.final_approved_by == manager.id
    assert approved_cycle.final_approved_at is not None

    db_session.refresh(sub)
    assert sub.status == "approved"


def test_designer_feedback_summary_aggregation(db_session: Session, test_setup_data):
    """
    Test Phase 6:
    Verify ReviewCycleService.get_designer_feedback_summary accurately aggregates
    metrics (total feedback, changes requested, reviews completed, awaiting review)
    and structures groups for the Designer New Feedback dashboard.
    """
    org_id = test_setup_data["org"].id
    sub = test_setup_data["submission"]
    cycle = ReviewCycleService.get_or_create_active_cycle(db_session, sub)

    manager = test_setup_data["manager"]
    mgr_auth = AuthContext(user_id=manager.id, organization_id=org_id, roles=[UserRole.ADMIN], email=manager.email, is_authenticated=True)

    # Submit 1 review
    ReviewCycleService.submit_departmental_review(
        db=db_session,
        auth=mgr_auth,
        cycle_id=cycle.id,
        payload=DepartmentReviewSubmit(
            department="manager",
            outcome="no_changes_required",
            comments="Layout looks balanced.",
            feedback_items=[DepartmentFeedbackCreate(category="Visual Hierarchy", description="Good balance.")],
        ),
    )

    summary = ReviewCycleService.get_designer_feedback_summary(db_session, auth=mgr_auth)

    assert summary.total_feedback_items >= 1
    assert summary.reviews_completed_count >= 1
    assert summary.designs_awaiting_review_count == 1  # 1 design submission currently in review
    assert len(summary.design_groups) >= 1

    group = summary.design_groups[0]
    assert group.submission_id == sub.id
    assert len(group.versions) >= 1
    assert group.active_cycle is not None
