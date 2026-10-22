"""Inkloom AI - Centralized Brand Governance Workflow State Machine.

States:
- draft: Initial draft authoring.
- submitted: Submitted by creator for automated governance audit.
- auditing: Automated media extraction and AI rule checks actively running.
- changes_requested: Violations detected or human reviewer requested revisions.
- resubmitted: Revisions submitted by author after addressing findings.
- pending_approval: All automated checks passed or reviewer review needed; awaiting human sign-off.
- approved: Formally approved by authorized human reviewer for publication.
- rejected: Formally rejected by reviewer.
"""

from typing import Set, Dict, Optional
from app.schemas.common import WorkflowStateEnum, ReviewActionEnum


class WorkflowTransitionError(ValueError):
    """Raised when an invalid state transition is attempted."""
    pass


# Central state transition matrix: Current State -> Set of Allowed Next States
ALLOWED_TRANSITIONS: Dict[WorkflowStateEnum, Set[WorkflowStateEnum]] = {
    WorkflowStateEnum.DRAFT: {
        WorkflowStateEnum.SUBMITTED,
    },
    WorkflowStateEnum.SUBMITTED: {
        WorkflowStateEnum.AUDITING,
        WorkflowStateEnum.DRAFT,  # Author retracted
    },
    WorkflowStateEnum.AUDITING: {
        WorkflowStateEnum.CHANGES_REQUESTED,  # Audit discovered blockers
        WorkflowStateEnum.PENDING_APPROVAL,   # Audit passed, queued for human reviewer
        WorkflowStateEnum.SUBMITTED,          # Retry on transient engine failure
    },
    WorkflowStateEnum.CHANGES_REQUESTED: {
        WorkflowStateEnum.RESUBMITTED,        # Author uploaded fixes
        WorkflowStateEnum.REJECTED,           # Reviewer closed without fix
    },
    WorkflowStateEnum.RESUBMITTED: {
        WorkflowStateEnum.AUDITING,           # Re-audit new revision
    },
    WorkflowStateEnum.PENDING_APPROVAL: {
        WorkflowStateEnum.APPROVED,           # Human reviewer approval ONLY
        WorkflowStateEnum.CHANGES_REQUESTED,  # Human reviewer asks for changes
        WorkflowStateEnum.REJECTED,           # Human reviewer rejection
    },
    WorkflowStateEnum.APPROVED: set(),         # Terminal state (new version starts in draft)
    WorkflowStateEnum.REJECTED: {
        WorkflowStateEnum.DRAFT,              # Re-opened as draft
    },
}


def can_transition(current_state: WorkflowStateEnum, target_state: WorkflowStateEnum) -> bool:
    """Check if transition between states is permissible."""
    allowed = ALLOWED_TRANSITIONS.get(current_state, set())
    return target_state in allowed


def validate_transition(
    current_state: WorkflowStateEnum,
    target_state: WorkflowStateEnum,
    is_automated_actor: bool = False,
) -> None:
    """
    Centrally validate state transition.
    Enforces that automated AI engines CAN NEVER transition directly to 'approved'.
    """
    if not can_transition(current_state, target_state):
        raise WorkflowTransitionError(
            f"Invalid workflow transition from '{current_state.value}' to '{target_state.value}'. "
            f"Allowed next states: {[s.value for s in ALLOWED_TRANSITIONS.get(current_state, set())]}"
        )

    # Invariant: AI / Automated engine can never grant final approval
    if is_automated_actor and target_state == WorkflowStateEnum.APPROVED:
        raise WorkflowTransitionError(
            "Governance Violation: Automated AI systems cannot grant final publication approval. "
            "A designated human reviewer must approve."
        )


def determine_next_state_from_audit(has_blocking_violations: bool) -> WorkflowStateEnum:
    """
    Determine the next workflow state after an automated audit completes.
    Notice: It transitions to PENDING_APPROVAL even when clean, so a human must sign off.
    """
    if has_blocking_violations:
        return WorkflowStateEnum.CHANGES_REQUESTED
    return WorkflowStateEnum.PENDING_APPROVAL


def resolve_human_review_action(
    current_state: WorkflowStateEnum,
    action: ReviewActionEnum,
) -> WorkflowStateEnum:
    """Map human reviewer decision to the target workflow state."""
    if current_state != WorkflowStateEnum.PENDING_APPROVAL:
        raise WorkflowTransitionError(
            f"Human review decisions can only be made when state is 'pending_approval', "
            f"current state is '{current_state.value}'."
        )

    if action == ReviewActionEnum.APPROVE:
        return WorkflowStateEnum.APPROVED
    elif action == ReviewActionEnum.REJECT:
        return WorkflowStateEnum.REJECTED
    elif action == ReviewActionEnum.REQUEST_CHANGES:
        return WorkflowStateEnum.CHANGES_REQUESTED
    else:
        raise WorkflowTransitionError(f"Unknown review action: {action}")
