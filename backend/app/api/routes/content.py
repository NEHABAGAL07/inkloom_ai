"""Content Submissions and Revisions API Routes."""

import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from app.core.security import CurrentUser, get_current_user
from app.schemas.content import (
    ContentSubmissionCreate,
    ContentSubmissionResponse,
    ContentRevisionResponse,
)
from app.schemas.common import WorkflowStateEnum
from app.services.media_audit.extractor import sanitize_filename
from app.core.config import settings

router = APIRouter(prefix="/content", tags=["Content"])

# In-memory storage scaffold for immediate testing without live Postgres
_SUBMISSION_STORE = {}


@router.post("/submit", response_model=ContentSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_content(
    title: str = Form(...),
    content_type: str = Form("text"),
    raw_text: Optional[str] = Form(None),
    workspace_id: str = Form("ws-main-001"),
    file: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit text or upload document/media for brand compliance review."""
    content_id = f"cnt-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    now = datetime.now(timezone.utc)

    saved_file_path = None
    file_metadata = {}

    if file:
        sanitized = sanitize_filename(file.filename or "upload.bin")
        tenant_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.organization_id, content_id)
        os.makedirs(tenant_upload_dir, exist_ok=True)
        saved_file_path = os.path.join(tenant_upload_dir, sanitized)
        
        # Save uploaded file
        contents = await file.read()
        with open(saved_file_path, "wb") as f:
            f.write(contents)
        file_metadata = {
            "original_filename": file.filename,
            "size_bytes": len(contents),
            "content_type": file.content_type,
        }

    initial_revision = ContentRevisionResponse(
        id=f"rev-{content_id}-1",
        submission_id=content_id,
        revision_num=1,
        raw_text=raw_text,
        file_path=saved_file_path,
        file_metadata=file_metadata,
        created_at=now,
    )

    submission = ContentSubmissionResponse(
        id=content_id,
        organization_id=current_user.organization_id,
        workspace_id=workspace_id,
        author_id=current_user.user_id,
        title=title,
        content_type=content_type,
        current_status=WorkflowStateEnum.SUBMITTED,
        current_revision_num=1,
        created_at=now,
        updated_at=now,
        revisions=[initial_revision],
    )

    _SUBMISSION_STORE[content_id] = submission
    return submission


@router.get("/{content_id}", response_model=ContentSubmissionResponse)
async def get_content(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get submission details and revision history."""
    if content_id in _SUBMISSION_STORE:
        sub = _SUBMISSION_STORE[content_id]
        if sub.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cross-tenant access forbidden.")
        return sub

    # Return starter mock submission if not in ephemeral store
    now = datetime.now(timezone.utc)
    return ContentSubmissionResponse(
        id=content_id,
        organization_id=current_user.organization_id,
        workspace_id="ws-main-001",
        author_id=current_user.user_id,
        title="Q4 Enterprise Launch Collateral",
        content_type="text",
        current_status=WorkflowStateEnum.PENDING_APPROVAL,
        current_revision_num=1,
        created_at=now,
        updated_at=now,
        revisions=[
            ContentRevisionResponse(
                id=f"rev-{content_id}-1",
                submission_id=content_id,
                revision_num=1,
                raw_text="Try inkloom today for best-in-class workflows. Our system delivers a 100% error-free guarantee across all media.",
                file_metadata={},
                created_at=now,
            )
        ],
    )
