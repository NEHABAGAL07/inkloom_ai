from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ReviewCycle(TimestampedModel):
    """
    Shared Review Cycle for Centralized Governance.
    Tracks independent departmental reviews across Manager, Marketing, and Legal & Compliance.
    A cycle is complete ONLY when all 3 departments have submitted their review.
    """
    __tablename__ = "review_cycles"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(36), ForeignKey("content_revisions.id", ondelete="SET NULL"), nullable=True, index=True)
    cycle_number = Column(Integer, default=1, nullable=False)

    # Workflow cycle statuses: in_progress, changes_requested, review_complete, approved
    status = Column(String(50), default="in_progress", nullable=False, index=True)
    
    # Final approval status (distinct from departmental review completion)
    final_approval_status = Column(String(50), default="pending_approval", nullable=False)
    final_approved_by = Column(String(255), nullable=True)
    final_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("submission_id", "cycle_number", name="uq_submission_cycle_number"),
    )

    submission = relationship("ContentSubmission", back_populates="review_cycles")
    revision = relationship("ContentRevision")
    departmental_reviews = relationship(
        "DepartmentReview",
        back_populates="review_cycle",
        cascade="all, delete-orphan",
        order_by="DepartmentReview.department",
    )
    feedback_records = relationship(
        "DepartmentFeedback",
        back_populates="review_cycle",
        cascade="all, delete-orphan",
        order_by="DepartmentFeedback.created_at.desc()",
    )


class DepartmentReview(TimestampedModel):
    """
    Independent departmental review sign-off.
    Each of Manager, Marketing, and Legal submits their review independently.
    """
    __tablename__ = "department_reviews"

    cycle_id = Column(String(36), ForeignKey("review_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(36), ForeignKey("content_revisions.id", ondelete="SET NULL"), nullable=True, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Department identifier: manager, marketing, legal
    department = Column(String(50), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewer_name = Column(String(255), nullable=True)
    
    # Review status: pending, in_progress, completed
    review_status = Column(String(50), default="pending", nullable=False, index=True)
    
    # Outcome: no_changes_required, changes_requested
    outcome = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("cycle_id", "department", name="uq_cycle_department"),
    )

    review_cycle = relationship("ReviewCycle", back_populates="departmental_reviews")
    reviewer = relationship("User")
    feedback_items = relationship(
        "DepartmentFeedback",
        back_populates="department_review",
        cascade="all, delete-orphan",
    )


class DepartmentFeedback(TimestampedModel):
    """
    Persistent feedback record created when a reviewer submits feedback.
    Enforces that reviewer-authored feedback is immutable by designers,
    linked to the exact design version, and surfaced in real-time.
    """
    __tablename__ = "department_feedback"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(36), ForeignKey("content_revisions.id", ondelete="SET NULL"), nullable=True, index=True)
    cycle_id = Column(String(36), ForeignKey("review_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    department_review_id = Column(String(36), ForeignKey("department_reviews.id", ondelete="SET NULL"), nullable=True, index=True)
    
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewer_name = Column(String(255), nullable=False)
    reviewer_department = Column(String(50), nullable=False, index=True)  # manager, marketing, legal
    
    # Category: visual_design, copy_tone, legal_compliance, claim_verification, brand_rules, general
    feedback_category = Column(String(50), default="general", nullable=False)
    feedback_description = Column(Text, nullable=False)
    requested_correction = Column(Text, nullable=True)
    
    # Review outcome: changes_requested, no_changes_required
    review_outcome = Column(String(50), default="no_changes_required", nullable=False)
    
    # Feedback status: open, resolved, acknowledged
    status = Column(String(50), default="open", nullable=False, index=True)
    
    relevant_audit_evidence = Column(JSON, nullable=True, default=dict)

    review_cycle = relationship("ReviewCycle", back_populates="feedback_records")
    department_review = relationship("DepartmentReview", back_populates="feedback_items")
    submission = relationship("ContentSubmission")
    revision = relationship("ContentRevision")

