"""Workspaces and Organizations API Routes."""

from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


class WorkspaceSchema(BaseModel):
    id: str
    organization_id: str
    name: str
    description: str


@router.get("", response_model=List[WorkspaceSchema])
async def list_workspaces(current_user: CurrentUser = Depends(get_current_user)):
    """List workspaces accessible to current tenant."""
    # Scaffold starter data scoped to user's organization
    return [
        WorkspaceSchema(
            id="ws-main-001",
            organization_id=current_user.organization_id,
            name="Global Brand Marketing",
            description="Primary brand assets, product launches, and social campaigns.",
        ),
        WorkspaceSchema(
            id="ws-sales-002",
            organization_id=current_user.organization_id,
            name="Enterprise Sales Enablement",
            description="Pitch decks, one-pagers, and partner collateral.",
        ),
    ]
