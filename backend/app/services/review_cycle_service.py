"""
Review Cycle Service for Centralized Multi-Department Governance Workflow.
Connects Designer, Manager, Marketing, and Legal & Compliance.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.security import AuthContext, UserRole
from app.models import (
    ContentSubmission,
    ContentRevision,
    ReviewCycle,
    DepartmentReview,
    DepartmentFeedback,
    AuditEvent,
    ReviewDecision,
    ContentComment,
)
from app.workflow.state_machine import WorkflowState
from app.schemas.review_cycle import (
    DepartmentReviewSubmit,
    DepartmentFeedbackCreate,
    ReviewCycleResponse,
    DepartmentReviewResponse,
    DepartmentFeedbackResponse,
    DesignerFeedbackSummaryResponse,
    DesignerFeedbackGroup,
    DesignVersionSummary,
)
from app.services.realtime_broadcaster import broadcaster
from app.services.audit_orchestrator import AuditOrchestrator


class ReviewCycleService:
    DEPARTMENTS = ["manager", "marketing", "legal"]

    @classmethod
    def get_user_department(cls, auth: AuthContext) -> Optional[str]:
        """Resolves primary department from user roles."""
        if UserRole.ADMIN in auth.roles:
            return "manager"
        if UserRole.MARKETING in auth.roles or UserRole.CREATOR in auth.roles:
            return "marketing"
        if UserRole.COMPLIANCE_OFFICER in auth.roles or UserRole.LEGAL in auth.roles or UserRole.REVIEWER in auth.roles:
            return "legal"
        if UserRole.DESIGNER in auth.roles:
            return "designer"
        return None

    @classmethod
    def can_review_department(cls, auth: AuthContext, department: str) -> bool:
        """Enforces least-privilege role guard for department review submission."""
        if UserRole.ADMIN in auth.roles:
            return True  # Admins can review or act across departments
        if department == "marketing":
            return UserRole.MARKETING in auth.roles or UserRole.CREATOR in auth.roles
        if department == "legal":
            return (
                UserRole.COMPLIANCE_OFFICER in auth.roles
                or UserRole.LEGAL in auth.roles
                or UserRole.REVIEWER in auth.roles
            )
        if department == "manager":
            return UserRole.ADMIN in auth.roles
        return False

    @classmethod
    def get_or_create_active_cycle(
        cls,
        db: Session,
        submission: ContentSubmission,
        revision: Optional[ContentRevision] = None,
    ) -> ReviewCycle:
        """
        Retrieves active review cycle for the submission revision or creates one.
        Initializes 3 independent department reviews (Manager, Marketing, Legal) in pending state.
        """
        target_revision_id = revision.id if revision else submission.current_revision_id
        
        # Look for existing cycle for this revision
        existing_cycle = (
            db.query(ReviewCycle)
            .options(
                selectinload(ReviewCycle.departmental_reviews),
                selectinload(ReviewCycle.feedback_records),
            )
            .filter(
                ReviewCycle.submission_id == submission.id,
                ReviewCycle.revision_id == target_revision_id,
            )
            .order_by(ReviewCycle.cycle_number.desc())
            .first()
        )
        if existing_cycle:
            # Ensure all 3 departments exist
            existing_depts = {dr.department for dr in existing_cycle.departmental_reviews}
            missing_depts = set(cls.DEPARTMENTS) - existing_depts
            if missing_depts:
                for dept in missing_depts:
                    d_rev = DepartmentReview(
                        id=f"drev_{uuid.uuid4().hex[:12]}",
                        cycle_id=existing_cycle.id,
                        submission_id=submission.id,
                        revision_id=target_revision_id,
                        organization_id=submission.organization_id,
                        department=dept,
                        review_status="pending",
                    )
                    db.add(d_rev)
                db.commit()
                db.refresh(existing_cycle)
            return existing_cycle

        # Compute next cycle number
        max_cycle = (
            db.query(ReviewCycle.cycle_number)
            .filter(ReviewCycle.submission_id == submission.id)
            .order_by(ReviewCycle.cycle_number.desc())
            .first()
        )
        next_cycle_num = (max_cycle[0] + 1) if max_cycle else 1

        cycle = ReviewCycle(
            id=f"cycle_{uuid.uuid4().hex[:12]}",
            organization_id=submission.organization_id,
            submission_id=submission.id,
            revision_id=target_revision_id,
            cycle_number=next_cycle_num,
            status="in_progress",
            final_approval_status="pending_approval",
            started_at=datetime.now(timezone.utc),
        )
        db.add(cycle)
        db.flush()

        # Initialize the 3 required departments in 'pending' state
        for dept in cls.DEPARTMENTS:
            d_rev = DepartmentReview(
                id=f"drev_{uuid.uuid4().hex[:12]}",
                cycle_id=cycle.id,
                submission_id=submission.id,
                revision_id=target_revision_id,
                organization_id=submission.organization_id,
                department=dept,
                review_status="pending",
            )
            db.add(d_rev)

        event = AuditEvent(
            organization_id=submission.organization_id,
            actor_id=submission.creator_id or "system",
            entity_type="review_cycle",
            entity_id=cycle.id,
            event_type="review_cycle_created",
            details={
                "submission_id": submission.id,
                "cycle_number": next_cycle_num,
                "revision_id": target_revision_id,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(cycle)

        # Broadcast event
        broadcaster.publish(
            organization_id=submission.organization_id,
            event_type="new_review_cycle",
            data={
                "cycle_id": cycle.id,
                "submission_id": submission.id,
                "cycle_number": cycle.cycle_number,
                "status": cycle.status,
            },
        )

        return cycle

    @classmethod
    def submit_departmental_review(
        cls,
        db: Session,
        auth: AuthContext,
        cycle_id: str,
        payload: DepartmentReviewSubmit,
    ) -> ReviewCycle:
        """
        Submits an independent departmental review (Manager, Marketing, or Legal).
        Enforces least-privilege departmental authorization, persists feedback records,
        and evaluates whether all 3 departments have submitted to complete the cycle.
        """
        # Validate department
        target_dept = payload.department.lower().strip()
        if target_dept not in cls.DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid department '{target_dept}'. Must be one of: {', '.join(cls.DEPARTMENTS)}.",
            )

        if not cls.can_review_department(auth, target_dept):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unauthorized: Your role does not permit submitting review decisions for the '{target_dept}' department.",
            )

        cycle = (
            db.query(ReviewCycle)
            .options(
                selectinload(ReviewCycle.departmental_reviews),
                selectinload(ReviewCycle.feedback_records),
                selectinload(ReviewCycle.submission),
            )
            .filter(
                ReviewCycle.id == cycle_id,
                ReviewCycle.organization_id == auth.organization_id,
            )
            .first()
        )
        if not cycle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review cycle '{cycle_id}' not found.",
            )

        submission = cycle.submission
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated submission not found.",
            )

        # Separation of duties: Creators cannot submit reviews on their own designs
        if submission.creator_id == auth.user_id and not auth.has_role(UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Separation of duties policy: Authors cannot review their own submissions.",
            )

        # Find or create department review record (idempotent)
        dept_review = next(
            (dr for dr in cycle.departmental_reviews if dr.department == target_dept),
            None,
        )
        if not dept_review:
            dept_review = DepartmentReview(
                id=f"drev_{uuid.uuid4().hex[:12]}",
                cycle_id=cycle.id,
                submission_id=submission.id,
                revision_id=cycle.revision_id,
                organization_id=auth.organization_id,
                department=target_dept,
            )
            db.add(dept_review)

        reviewer_name = auth.full_name or auth.email or f"{target_dept.capitalize()} Reviewer"

        # Update department review status and decision
        dept_review.reviewer_id = auth.user_id
        dept_review.reviewer_name = reviewer_name
        dept_review.review_status = "completed"
        dept_review.outcome = payload.outcome  # no_changes_required or changes_requested
        dept_review.comments = payload.comments or ("No changes required." if payload.outcome == "no_changes_required" else "Changes requested.")
        dept_review.submitted_at = datetime.now(timezone.utc)
        db.flush()

        # Create persistent DepartmentFeedback records
        created_feedback_list = []
        if payload.feedback_items:
            for item in payload.feedback_items:
                fb = DepartmentFeedback(
                    id=f"fb_{uuid.uuid4().hex[:12]}",
                    organization_id=auth.organization_id,
                    submission_id=submission.id,
                    revision_id=cycle.revision_id,
                    cycle_id=cycle.id,
                    department_review_id=dept_review.id,
                    reviewer_id=auth.user_id,
                    reviewer_name=reviewer_name,
                    reviewer_department=target_dept,
                    feedback_category=item.category or "general",
                    feedback_description=item.description,
                    requested_correction=item.requested_correction,
                    review_outcome=payload.outcome,
                    status="open",
                    relevant_audit_evidence=item.evidence or {},
                )
                db.add(fb)
                created_feedback_list.append(fb)
        elif payload.comments:
            # If no individual items, persist the general comment as a feedback record
            fb = DepartmentFeedback(
                id=f"fb_{uuid.uuid4().hex[:12]}",
                organization_id=auth.organization_id,
                submission_id=submission.id,
                revision_id=cycle.revision_id,
                cycle_id=cycle.id,
                department_review_id=dept_review.id,
                reviewer_id=auth.user_id,
                reviewer_name=reviewer_name,
                reviewer_department=target_dept,
                feedback_category="general",
                feedback_description=payload.comments,
                review_outcome=payload.outcome,
                status="open",
            )
            db.add(fb)
            created_feedback_list.append(fb)

        # Backward compatibility: add ReviewDecision
        mapped_action = "approve" if payload.outcome == "no_changes_required" else "request_changes"
        rev_decision = ReviewDecision(
            id=f"dec_{uuid.uuid4().hex[:12]}",
            submission_id=submission.id,
            revision_id=cycle.revision_id,
            reviewer_id=auth.user_id,
            action=mapped_action,
            comments=f"[{target_dept.capitalize()}] {payload.comments or payload.outcome}",
            review_metadata={
                "department": target_dept,
                "cycle_id": cycle.id,
                "outcome": payload.outcome,
            },
        )
        db.add(rev_decision)

        # Backward compatibility: ContentComment
        content_comment = ContentComment(
            id=f"cmt_{uuid.uuid4().hex[:12]}",
            submission_id=submission.id,
            organization_id=auth.organization_id,
            author_id=auth.user_id,
            author_name=reviewer_name,
            author_role=auth.roles[0].value if auth.roles else target_dept,
            comment_text=payload.comments or f"{target_dept.capitalize()} review: {payload.outcome.replace('_', ' ')}",
            category=payload.feedback_items[0].category if payload.feedback_items else "general",
            is_resolved=(payload.outcome == "no_changes_required"),
        )
        db.add(content_comment)
        db.flush()

        # Audit Event
        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="department_review",
            entity_id=dept_review.id,
            event_type="department_review_submitted",
            details={
                "cycle_id": cycle.id,
                "submission_id": submission.id,
                "department": target_dept,
                "outcome": payload.outcome,
                "feedback_count": len(created_feedback_list),
            },
        )
        db.add(event)

        # Check if ALL 3 departments have submitted their review
        all_reviews = (
            db.query(DepartmentReview)
            .filter(DepartmentReview.cycle_id == cycle.id)
            .all()
        )
        dept_status_map = {dr.department: dr for dr in all_reviews}
        all_three_completed = all(
            d in dept_status_map and dept_status_map[d].review_status == "completed"
            for d in cls.DEPARTMENTS
        )

        if all_three_completed:
            cycle.completed_at = datetime.now(timezone.utc)
            # If ANY department requested changes -> cycle becomes changes_requested
            any_changes_requested = any(
                dept_status_map[d].outcome == "changes_requested"
                for d in cls.DEPARTMENTS
            )
            if any_changes_requested:
                cycle.status = "changes_requested"
                submission.status = WorkflowState.CHANGES_REQUESTED.value
                cycle_event_type = "changes_requested"
            else:
                cycle.status = "review_complete"
                cycle.final_approval_status = "pending_approval"
                submission.status = WorkflowState.PENDING_APPROVAL.value
                cycle_event_type = "review_cycle_completed"

            # Audit event for cycle completion
            cycle_event = AuditEvent(
                organization_id=auth.organization_id,
                actor_id="system",
                entity_type="review_cycle",
                entity_id=cycle.id,
                event_type=cycle_event_type,
                details={
                    "submission_id": submission.id,
                    "final_cycle_status": cycle.status,
                    "any_changes_requested": any_changes_requested,
                },
            )
            db.add(cycle_event)
        else:
            cycle.status = "in_progress"
            cycle_event_type = "department_reviewed"

        db.commit()
        db.refresh(cycle)

        # Broadcast real-time event to connected Designer & Reviewer workspaces
        broadcaster.publish(
            organization_id=auth.organization_id,
            event_type=cycle_event_type,
            data={
                "cycle_id": cycle.id,
                "submission_id": submission.id,
                "department": target_dept,
                "outcome": payload.outcome,
                "cycle_status": cycle.status,
                "submission_status": submission.status,
                "reviewer_name": reviewer_name,
                "all_three_completed": all_three_completed,
            },
        )

        return cycle

    @classmethod
    def list_review_cycles_for_submission(
        cls,
        db: Session,
        auth: AuthContext,
        submission_id: str,
    ) -> List[ReviewCycle]:
        """Lists all review cycles for a submission in descending order."""
        return (
            db.query(ReviewCycle)
            .options(
                selectinload(ReviewCycle.departmental_reviews),
                selectinload(ReviewCycle.feedback_records),
            )
            .filter(
                ReviewCycle.submission_id == submission_id,
                ReviewCycle.organization_id == auth.organization_id,
            )
            .order_by(ReviewCycle.cycle_number.desc())
            .all()
        )

    @classmethod
    def get_designer_feedback_summary(
        cls,
        db: Session,
        auth: AuthContext,
    ) -> DesignerFeedbackSummaryResponse:
        """
        Builds the summary report for the Designer 'New Feedback' dashboard:
        - Total feedback items across all design versions
        - Changes requested count
        - Reviews completed count
        - Designs awaiting review count
        - Complete grouped feedback by submission, version, and review cycle.
        """
        submissions = (
            db.query(ContentSubmission)
            .options(
                selectinload(ContentSubmission.revisions),
                selectinload(ContentSubmission.review_cycles).selectinload(ReviewCycle.departmental_reviews),
                selectinload(ContentSubmission.review_cycles).selectinload(ReviewCycle.feedback_records),
            )
            .filter(ContentSubmission.organization_id == auth.organization_id)
            .order_by(ContentSubmission.updated_at.desc())
            .all()
        )

        total_feedback = 0
        changes_requested_count = 0
        reviews_completed_count = 0
        awaiting_review_count = 0
        design_groups = []

        for sub in submissions:
            # Auto-ensure active cycle exists for draft/submitted content
            active_cycle = None
            if sub.review_cycles:
                active_cycle = sub.review_cycles[0]
            else:
                # Auto-initialize cycle 1 if not exists
                active_cycle = cls.get_or_create_active_cycle(db, sub)

            # Revisions summary
            revisions_summary = []
            for rev in sorted(sub.revisions, key=lambda r: r.version_number, reverse=True):
                revisions_summary.append(
                    DesignVersionSummary(
                        version_id=rev.id,
                        version_number=rev.version_number,
                        file_name=rev.file_name,
                        file_path=rev.file_path,
                        media_url=rev.file_path,
                        created_at=rev.created_at,
                        change_summary=(rev.media_metadata or {}).get("change_summary") if rev.media_metadata else None,
                    )
                )

            current_ver = revisions_summary[0].version_number if revisions_summary else 1
            thumb_url = sub.media_url or (revisions_summary[0].media_url if revisions_summary else None)

            # Cycle stats
            has_changes = any(
                c.status == "changes_requested"
                or any(dr.outcome == "changes_requested" for dr in c.departmental_reviews)
                for c in sub.review_cycles
            )
            all_completed = (
                active_cycle is not None
                and len(active_cycle.departmental_reviews) == 3
                and all(dr.review_status == "completed" for dr in active_cycle.departmental_reviews)
            )

            # Count feedback items
            for c in sub.review_cycles:
                total_feedback += len(c.feedback_records)
                for dr in c.departmental_reviews:
                    if dr.review_status == "completed":
                        reviews_completed_count += 1
                        if dr.outcome == "changes_requested":
                            changes_requested_count += 1

            if not all_completed:
                awaiting_review_count += 1

            # Format cycles
            cycles_data = [
                ReviewCycleResponse.model_validate(c) for c in sub.review_cycles
            ]

            design_groups.append(
                DesignerFeedbackGroup(
                    submission_id=sub.id,
                    title=sub.title,
                    description=sub.description,
                    content_type=sub.content_type,
                    current_version=current_ver,
                    thumbnail_url=thumb_url,
                    file_name=sub.file_name,
                    created_at=sub.created_at,
                    workflow_status=sub.status,
                    active_cycle=cycles_data[0] if cycles_data else None,
                    cycles=cycles_data,
                    versions=revisions_summary,
                    has_changes_requested=has_changes,
                    all_reviews_completed=all_completed,
                )
            )

        return DesignerFeedbackSummaryResponse(
            total_feedback_items=total_feedback,
            changes_requested_count=changes_requested_count,
            reviews_completed_count=reviews_completed_count,
            designs_awaiting_review_count=awaiting_review_count,
            design_groups=design_groups,
        )

    @classmethod
    def grant_final_approval(
        cls,
        db: Session,
        auth: AuthContext,
        cycle_id: str,
        comments: Optional[str] = None,
    ) -> ReviewCycle:
        """
        Manager / Brand Admin final publication approval.
        Can only be granted after all three departments have completed their reviews
        with no changes requested.
        """
        if not auth.has_role(UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Final publication approval requires Brand Admin / Manager authority.",
            )

        cycle = (
            db.query(ReviewCycle)
            .options(
                selectinload(ReviewCycle.departmental_reviews),
                selectinload(ReviewCycle.submission),
            )
            .filter(
                ReviewCycle.id == cycle_id,
                ReviewCycle.organization_id == auth.organization_id,
            )
            .first()
        )
        if not cycle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review cycle '{cycle_id}' not found.",
            )

        # Enforce that all 3 departments have completed review without changes requested
        all_completed = (
            len(cycle.departmental_reviews) == 3
            and all(dr.review_status == "completed" for dr in cycle.departmental_reviews)
        )
        any_changes = any(dr.outcome == "changes_requested" for dr in cycle.departmental_reviews)

        if not all_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot grant final approval: Review cycle is still In Progress with pending departmental reviews.",
            )
        if any_changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot grant final approval: One or more departments requested changes.",
            )

        cycle.final_approval_status = "approved"
        cycle.final_approved_by = auth.user_id or auth.email or "Brand Admin"
        cycle.final_approved_at = datetime.now(timezone.utc)
        cycle.status = "approved"

        submission = cycle.submission
        if submission:
            submission.status = WorkflowState.APPROVED.value

        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="review_cycle",
            entity_id=cycle.id,
            event_type="final_approval_granted",
            details={
                "cycle_id": cycle.id,
                "submission_id": cycle.submission_id,
                "approved_by": cycle.final_approved_by,
                "comments": comments,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(cycle)

        # Real-time event
        broadcaster.publish(
            organization_id=auth.organization_id,
            event_type="final_approval_status_changed",
            data={
                "cycle_id": cycle.id,
                "submission_id": cycle.submission_id,
                "status": "approved",
                "approved_by": cycle.final_approved_by,
            },
        )

        return cycle
