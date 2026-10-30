"""
Legacy state_machine re-export.
Centralized workflow state logic now resides in app.services.workflow.state_machine.
"""
from app.services.workflow.state_machine import (
    WorkflowState,
    WorkflowTransitionError,
    ALLOWED_TRANSITIONS,
    WorkflowStateMachine,
)

__all__ = [
    "WorkflowState",
    "WorkflowStateMachine",
    "WorkflowTransitionError",
    "ALLOWED_TRANSITIONS",
]
