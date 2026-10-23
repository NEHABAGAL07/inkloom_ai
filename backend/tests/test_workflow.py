"""Test Centralized Approval Workflow State Transitions."""

import pytest
from app.schemas.common import WorkflowStateEnum, ReviewActionEnum
from app.workflow.state_machine import (
    can_transition,
    validate_transition,
    determine_next_state_from_audit,
    resolve_human_review_action,
    WorkflowTransitionError,
)


def test_valid_forward_workflow():
    """Verify standard happy-path progression through the governance pipeline."""
    # draft -> submitted
    assert can_transition(WorkflowStateEnum.DRAFT, WorkflowStateEnum.SUBMITTED)
    validate_transition(WorkflowStateEnum.DRAFT, WorkflowStateEnum.SUBMITTED)

    # submitted -> auditing
    assert can_transition(WorkflowStateEnum.SUBMITTED, WorkflowStateEnum.AUDITING)
    validate_transition(WorkflowStateEnum.SUBMITTED, WorkflowStateEnum.AUDITING)

    # auditing -> pending_approval
    assert can_transition(WorkflowStateEnum.AUDITING, WorkflowStateEnum.PENDING_APPROVAL)
    validate_transition(WorkflowStateEnum.AUDITING, WorkflowStateEnum.PENDING_APPROVAL)

    # pending_approval -> approved (by human reviewer)
    assert can_transition(WorkflowStateEnum.PENDING_APPROVAL, WorkflowStateEnum.APPROVED)
    validate_transition(WorkflowStateEnum.PENDING_APPROVAL, WorkflowStateEnum.APPROVED, is_automated_actor=False)


def test_ai_actor_cannot_auto_approve():
    """CRITICAL INVARIANT: Automated AI engine cannot transition to 'approved'."""
    with pytest.raises(WorkflowTransitionError) as exc_info:
        validate_transition(
            WorkflowStateEnum.PENDING_APPROVAL,
            WorkflowStateEnum.APPROVED,
            is_automated_actor=True,
        )
    assert "Automated AI systems cannot grant final publication approval" in str(exc_info.value)


def test_invalid_transitions():
    """Verify illegal jumps across workflow stages are blocked."""
    # Cannot jump directly from draft to approved
    assert not can_transition(WorkflowStateEnum.DRAFT, WorkflowStateEnum.APPROVED)
    with pytest.raises(WorkflowTransitionError):
        validate_transition(WorkflowStateEnum.DRAFT, WorkflowStateEnum.APPROVED)

    # Cannot jump from submitted to approved
    assert not can_transition(WorkflowStateEnum.SUBMITTED, WorkflowStateEnum.APPROVED)
    with pytest.raises(WorkflowTransitionError):
        validate_transition(WorkflowStateEnum.SUBMITTED, WorkflowStateEnum.APPROVED)

    # Approved is a terminal state (cannot jump back to submitted directly)
    assert not can_transition(WorkflowStateEnum.APPROVED, WorkflowStateEnum.SUBMITTED)
    with pytest.raises(WorkflowTransitionError):
        validate_transition(WorkflowStateEnum.APPROVED, WorkflowStateEnum.SUBMITTED)


def test_changes_requested_and_resubmission_cycle():
    """Test remediation loop when violations are detected."""
    # Audit found blockers
    next_state = determine_next_state_from_audit(has_blocking_violations=True)
    assert next_state == WorkflowStateEnum.CHANGES_REQUESTED

    # Author resubmits revision
    assert can_transition(WorkflowStateEnum.CHANGES_REQUESTED, WorkflowStateEnum.RESUBMITTED)
    validate_transition(WorkflowStateEnum.CHANGES_REQUESTED, WorkflowStateEnum.RESUBMITTED)

    # Resubmitted content enters re-audit
    assert can_transition(WorkflowStateEnum.RESUBMITTED, WorkflowStateEnum.AUDITING)
    validate_transition(WorkflowStateEnum.RESUBMITTED, WorkflowStateEnum.AUDITING)

    # Clean audit queues for human approval
    clean_next_state = determine_next_state_from_audit(has_blocking_violations=False)
    assert clean_next_state == WorkflowStateEnum.PENDING_APPROVAL


def test_human_reviewer_actions():
    """Verify human reviewer decision mappings."""
    # Human approves
    res = resolve_human_review_action(
        current_state=WorkflowStateEnum.PENDING_APPROVAL,
        action=ReviewActionEnum.APPROVE,
    )
    assert res == WorkflowStateEnum.APPROVED

    # Human rejects
    res = resolve_human_review_action(
        current_state=WorkflowStateEnum.PENDING_APPROVAL,
        action=ReviewActionEnum.REJECT,
    )
    assert res == WorkflowStateEnum.REJECTED

    # Human requests changes
    res = resolve_human_review_action(
        current_state=WorkflowStateEnum.PENDING_APPROVAL,
        action=ReviewActionEnum.REQUEST_CHANGES,
    )
    assert res == WorkflowStateEnum.CHANGES_REQUESTED

    # Illegal action when state is not pending_approval
    with pytest.raises(WorkflowTransitionError):
        resolve_human_review_action(
            current_state=WorkflowStateEnum.DRAFT,
            action=ReviewActionEnum.APPROVE,
        )
