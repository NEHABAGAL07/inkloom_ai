"""
Centralized Brand Governance Workflow State Machine

Governs submission lifecycle across content creation, AI audit passes,
revisions, and mandatory human review before publication.

Crucial Rule:
AI findings NEVER automatically grant 'approved' status.
Only human reviewers (with designated roles) can transition content to 'approved'.
"""
from enum import Enum
from typing import Dict, Set, Optional


class WorkflowState(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    AUDITING = "auditing"
    CHANGES_REQUESTED = "changes_requested"
    RESUBMITTED = "resubmitted"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


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
        WorkflowState.SUBMITTED,
    },
    WorkflowState.SUBMITTED: {
        WorkflowState.AUDITING,
        WorkflowState.DRAFT,
    },
    WorkflowState.AUDITING: {
        # Audit engine outcomes
        WorkflowState.PENDING_APPROVAL,   # Passed or flagged for human review
        WorkflowState.CHANGES_REQUESTED,  # Critical flaws detected by policy
    },
    WorkflowState.CHANGES_REQUESTED: {
        WorkflowState.RESUBMITTED,
        WorkflowState.DRAFT,
    },
    WorkflowState.RESUBMITTED: {
        WorkflowState.AUDITING,
    },
    WorkflowState.PENDING_APPROVAL: {
        # Human reviewer actions only
        WorkflowState.APPROVED,
        WorkflowState.REJECTED,
        WorkflowState.CHANGES_REQUESTED,
    },
    WorkflowState.APPROVED: {
        # Content approved is terminal unless a new revision is explicitly initiated
        WorkflowState.DRAFT,
    },
    WorkflowState.REJECTED: {
        # Rejected content can be reopened as draft for major rework
        WorkflowState.DRAFT,
    },
}


class WorkflowStateMachine:
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
        is_ai_action: bool = False
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
                f"Permissible target states from '{current}' are: {allowed_names}"
            )

        # Invariant: AI engines may NEVER transition directly to APPROVED
        if is_ai_action and target_enum == WorkflowState.APPROVED:
            raise WorkflowTransitionError(
                current,
                target,
                "Governance policy violation: AI engines cannot authorize publication. Human sign-off is mandatory."
            )

        # Invariant: Approving or rejecting requires reviewer or admin privileges
        if target_enum in {WorkflowState.APPROVED, WorkflowState.REJECTED}:
            if actor_role and actor_role not in {"admin", "compliance_officer", "reviewer"}:
                raise WorkflowTransitionError(
                    current,
                    target,
                    f"Role '{actor_role}' does not have authority to approve or reject submissions."
                )

        return target_enum
