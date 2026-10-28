"""
Centralized Brand Governance Workflow State Machine (Phase 6 Unified Workflow)

Governs campaign and submission lifecycles across creative ideation, multi-track AI reviews,
revision iterations, and mandatory human review before publication.

Crucial Governance Principles:
1. AI review engines NEVER automatically grant 'approved' status.
2. Only authorized human reviewers (compliance officers, legal counsel, admins) can approve publication.
3. Separation of duties: Creators cannot approve their own submissions unless explicitly administrative.
4. Content revisions invalidate prior readiness until re-audited and re-approved.
"""
from enum import Enum
from typing import Dict, Set, Optional


class WorkflowState(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AI_REVIEW_PENDING = "ai_review_pending"
    AUDITING = "auditing"
    AI_REVIEW_IN_PROGRESS = "ai_review_in_progress"
    PENDING_APPROVAL = "pending_approval"
    HUMAN_REVIEW_PENDING = "human_review_pending"
    CHANGES_REQUESTED = "changes_requested"
    RESUBMITTED = "resubmitted"
    RE_REVIEW_PENDING = "re_review_pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class WorkflowTransitionError(Exception):
    def __init__(self, current_state: str, target_state: str, reason: str = ""):
        self.current_state = current_state
        self.target_state = target_state
        self.reason = reason
        super().__init__(
            f"Invalid workflow transition from '{current_state}' to '{target_state}'. {reason}".strip()
        )


# Mapping of current state -> set of permissible next states
ALLOWED_TRANSITIONS: Dict[WorkflowState, Set[WorkflowState]] = {
    WorkflowState.DRAFT: {
        WorkflowState.IN_PROGRESS,
        WorkflowState.SUBMITTED,
        WorkflowState.AI_REVIEW_PENDING,
        WorkflowState.AUDITING,
        WorkflowState.AI_REVIEW_IN_PROGRESS,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.IN_PROGRESS: {
        WorkflowState.SUBMITTED,
        WorkflowState.AI_REVIEW_PENDING,
        WorkflowState.AUDITING,
        WorkflowState.AI_REVIEW_IN_PROGRESS,
        WorkflowState.DRAFT,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.SUBMITTED: {
        WorkflowState.AUDITING,
        WorkflowState.AI_REVIEW_IN_PROGRESS,
        WorkflowState.PENDING_APPROVAL,
        WorkflowState.HUMAN_REVIEW_PENDING,
        WorkflowState.DRAFT,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.AI_REVIEW_PENDING: {
        WorkflowState.AI_REVIEW_IN_PROGRESS,
        WorkflowState.AUDITING,
        WorkflowState.DRAFT,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.AUDITING: {
        # Audit engine outcomes
        WorkflowState.PENDING_APPROVAL,
        WorkflowState.HUMAN_REVIEW_PENDING,
        WorkflowState.CHANGES_REQUESTED,
        WorkflowState.DRAFT,
    },
    WorkflowState.AI_REVIEW_IN_PROGRESS: {
        WorkflowState.HUMAN_REVIEW_PENDING,
        WorkflowState.PENDING_APPROVAL,
        WorkflowState.CHANGES_REQUESTED,
        WorkflowState.DRAFT,
    },
    WorkflowState.CHANGES_REQUESTED: {
        WorkflowState.RESUBMITTED,
        WorkflowState.RE_REVIEW_PENDING,
        WorkflowState.IN_PROGRESS,
        WorkflowState.DRAFT,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.RESUBMITTED: {
        WorkflowState.AUDITING,
        WorkflowState.AI_REVIEW_IN_PROGRESS,
        WorkflowState.PENDING_APPROVAL,
        WorkflowState.HUMAN_REVIEW_PENDING,
    },
    WorkflowState.RE_REVIEW_PENDING: {
        WorkflowState.AI_REVIEW_IN_PROGRESS,
        WorkflowState.AUDITING,
        WorkflowState.HUMAN_REVIEW_PENDING,
        WorkflowState.PENDING_APPROVAL,
    },
    WorkflowState.PENDING_APPROVAL: {
        # Human reviewer actions only
        WorkflowState.APPROVED,
        WorkflowState.REJECTED,
        WorkflowState.CHANGES_REQUESTED,
        WorkflowState.DRAFT,
    },
    WorkflowState.HUMAN_REVIEW_PENDING: {
        WorkflowState.APPROVED,
        WorkflowState.REJECTED,
        WorkflowState.CHANGES_REQUESTED,
        WorkflowState.DRAFT,
    },
    WorkflowState.APPROVED: {
        # Content approved is terminal unless a new revision is explicitly initiated or archived
        WorkflowState.DRAFT,
        WorkflowState.IN_PROGRESS,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.REJECTED: {
        # Rejected content can be reopened as draft for major rework or archived
        WorkflowState.DRAFT,
        WorkflowState.ARCHIVED,
    },
    WorkflowState.ARCHIVED: {
        WorkflowState.DRAFT,
    },
}


class WorkflowStateMachine:
    AUTHORIZED_REVIEWER_ROLES = {"admin", "compliance_officer", "reviewer", "legal"}

    @staticmethod
    def can_transition(current: str, target: str) -> bool:
        try:
            curr_enum = WorkflowState(current.lower())
            target_enum = WorkflowState(target.lower())
        except ValueError:
            return False

        return target_enum in ALLOWED_TRANSITIONS.get(curr_enum, set())

    @staticmethod
    def validate_transition(
        current: str,
        target: str,
        actor_role: Optional[str] = None,
        is_ai_action: bool = False,
    ) -> WorkflowState:
        """
        Validates transition and enforces role guards.
        Raises WorkflowTransitionError if invalid or unauthorized.
        """
        try:
            curr_enum = WorkflowState(current.lower())
        except ValueError:
            raise WorkflowTransitionError(current, target, f"'{current}' is not a valid workflow state.")

        try:
            target_enum = WorkflowState(target.lower())
        except ValueError:
            raise WorkflowTransitionError(current, target, f"'{target}' is not a valid workflow state.")

        allowed = ALLOWED_TRANSITIONS.get(curr_enum, set())
        if target_enum not in allowed:
            allowed_names = [s.value for s in allowed]
            raise WorkflowTransitionError(
                current,
                target,
                f"Permissible target states from '{current}' are: {allowed_names}",
            )

        # Invariant: AI engines may NEVER transition directly to APPROVED
        if is_ai_action and target_enum in {WorkflowState.APPROVED}:
            raise WorkflowTransitionError(
                current,
                target,
                "Governance policy violation: AI engines cannot authorize publication. Human sign-off is mandatory.",
            )

        # Invariant: Approving or rejecting requires authorized reviewer or admin privileges
        if target_enum in {WorkflowState.APPROVED, WorkflowState.REJECTED}:
            if actor_role and actor_role not in WorkflowStateMachine.AUTHORIZED_REVIEWER_ROLES:
                raise WorkflowTransitionError(
                    current,
                    target,
                    f"Role '{actor_role}' does not have authority to approve or reject submissions/campaigns.",
                )

        return target_enum
