import pytest
from app.workflow.state_machine import (
    WorkflowState,
    WorkflowStateMachine,
    WorkflowTransitionError,
)


def test_valid_transitions():
    assert WorkflowStateMachine.can_transition("draft", "submitted") is True
    assert WorkflowStateMachine.can_transition("submitted", "auditing") is True
    assert WorkflowStateMachine.can_transition("auditing", "pending_approval") is True
    assert WorkflowStateMachine.can_transition("pending_approval", "approved") is True
    assert WorkflowStateMachine.can_transition("changes_requested", "resubmitted") is True


def test_invalid_transitions():
    # Direct jump from draft to approved is forbidden
    assert WorkflowStateMachine.can_transition("draft", "approved") is False
    with pytest.raises(WorkflowTransitionError):
        WorkflowStateMachine.validate_transition(current="draft", target="approved")


def test_ai_cannot_approve_publication():
    # Even if in pending_approval, an AI action must NEVER be allowed to approve
    with pytest.raises(WorkflowTransitionError) as exc_info:
        WorkflowStateMachine.validate_transition(
            current="pending_approval",
            target="approved",
            actor_role="reviewer",
            is_ai_action=True,
        )
    assert "AI engines cannot authorize publication" in str(exc_info.value)


def test_role_restricted_approval():
    # Creator role cannot approve
    with pytest.raises(WorkflowTransitionError) as exc_info:
        WorkflowStateMachine.validate_transition(
            current="pending_approval",
            target="approved",
            actor_role="creator",
            is_ai_action=False,
        )
    assert "does not have authority" in str(exc_info.value)

    # Reviewer role can approve
    validated = WorkflowStateMachine.validate_transition(
        current="pending_approval",
        target="approved",
        actor_role="reviewer",
        is_ai_action=False,
    )
    assert validated == WorkflowState.APPROVED
