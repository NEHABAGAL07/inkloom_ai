"""Content Submissions and Revisions API Routes with Database Persistence."""

import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status, Body
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, get_current_user
from app.database.session import get_db
from app.models.content import ContentSubmission, ContentRevision
from app.models.review import AuditEventModel
from app.models.audit import AuditResultModel
from app.models.organization import Workspace
from app.models.user import User
from app.schemas.content import (
    ContentSubmissionCreate,
    ContentSubmissionResponse,
    ContentRevisionCreate,
    ContentRevisionResponse,
    ContentHistoryResponse,
)
from app.schemas.audit import AuditResultSchema, AuditRunRequest
from app.schemas.common import WorkflowStateEnum
from app.services.media_audit.extractor import sanitize_filename
from app.core.config import settings

router = APIRouter(prefix="/content", tags=["Content"])

# In-memory store maintained for backwards compatibility with tests and fast memory lookups
_SUBMISSION_STORE: Dict[str, ContentSubmissionResponse] = {}


async def _ensure_workspace_and_author_exist(db: AsyncSession, org_id: str, workspace_id: str, user_id: str) -> None:
    """Ensure parent foreign key entities exist to prevent FK integrity errors."""
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        # Also ensure organization exists
        from app.models.organization import Organization
        org = await db.get(Organization, org_id)
        if not org:
            org = Organization(id=org_id, name="Default Organization", slug=f"org-{org_id[:8]}")
            db.add(org)
            await db.flush()
        ws = Workspace(id=workspace_id, organization_id=org_id, name="Main Workspace")
        db.add(ws)
        await db.flush()

    usr = await db.get(User, user_id)
    if not usr:
        usr = User(id=user_id, email=f"{user_id}@inkloom.local", hashed_password="insecure-placeholder", full_name="System User")
        db.add(usr)
        await db.flush()


@router.post("", response_model=ContentSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    payload: ContentSubmissionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit content for brand governance review (JSON payload).
    Initializes version 1 of content submission.
    """
    org_id = payload.organization_id or current_user.organization_id
    workspace_id = payload.workspace_id or "ws-main-001"
    content_id = f"cnt-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:17]}"

    await _ensure_workspace_and_author_exist(db, org_id, workspace_id, current_user.user_id)

    submission = ContentSubmission(
        id=content_id,
        organization_id=org_id,
        workspace_id=workspace_id,
        author_id=current_user.user_id,
        title=payload.title,
        content_type=payload.content_type,
        current_status=WorkflowStateEnum.SUBMITTED.value,
        current_revision_num=1,
    )
    db.add(submission)
    await db.flush()

    revision = ContentRevision(
        id=f"rev-{content_id}-1",
        submission_id=content_id,
        revision_num=1,
        raw_text=payload.raw_text,
        file_path=None,
        file_metadata={},
    )
    db.add(revision)

    event = AuditEventModel(
        organization_id=org_id,
        actor_id=current_user.user_id,
        entity_type="content",
        entity_id=content_id,
        event_type="created",
        details={"revision_num": 1, "title": payload.title},
    )
    db.add(event)

    await db.commit()
    await db.refresh(submission)
    await db.refresh(revision)

    rev_resp = ContentRevisionResponse(
        id=revision.id,
        submission_id=submission.id,
        revision_num=revision.revision_num,
        raw_text=revision.raw_text,
        file_path=revision.file_path,
        file_metadata=revision.file_metadata or {},
        created_at=revision.created_at,
    )

    sub_resp = ContentSubmissionResponse(
        id=submission.id,
        organization_id=submission.organization_id,
        workspace_id=submission.workspace_id,
        author_id=submission.author_id,
        title=submission.title,
        content_type=submission.content_type,
        current_status=WorkflowStateEnum(submission.current_status),
        current_revision_num=submission.current_revision_num,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
        revisions=[rev_resp],
    )

    _SUBMISSION_STORE[content_id] = sub_resp
    return sub_resp


@router.post("/submit", response_model=ContentSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_content(
    title: str = Form(...),
    content_type: str = Form("text"),
    raw_text: Optional[str] = Form(None),
    workspace_id: str = Form("ws-main-001"),
    file: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit text or upload document/media for brand compliance review (Form / Multipart)."""
    content_id = f"cnt-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:17]}"
    now = datetime.now(timezone.utc)

    saved_file_path = None
    file_metadata = {}

    if file:
        sanitized = sanitize_filename(file.filename or "upload.bin")
        tenant_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.organization_id, content_id)
        os.makedirs(tenant_upload_dir, exist_ok=True)
        saved_file_path = os.path.join(tenant_upload_dir, sanitized)
        
        contents = await file.read()
        with open(saved_file_path, "wb") as f:
            f.write(contents)
        file_metadata = {
            "original_filename": file.filename,
            "size_bytes": len(contents),
            "content_type": file.content_type,
        }

    await _ensure_workspace_and_author_exist(db, current_user.organization_id, workspace_id, current_user.user_id)

    submission = ContentSubmission(
        id=content_id,
        organization_id=current_user.organization_id,
        workspace_id=workspace_id,
        author_id=current_user.user_id,
        title=title,
        content_type=content_type,
        current_status=WorkflowStateEnum.SUBMITTED.value,
        current_revision_num=1,
    )
    db.add(submission)
    await db.flush()

    revision = ContentRevision(
        id=f"rev-{content_id}-1",
        submission_id=content_id,
        revision_num=1,
        raw_text=raw_text,
        file_path=saved_file_path,
        file_metadata=file_metadata,
    )
    db.add(revision)

    event = AuditEventModel(
        organization_id=current_user.organization_id,
        actor_id=current_user.user_id,
        entity_type="content",
        entity_id=content_id,
        event_type="submitted",
        details={"revision_num": 1, "title": title},
    )
    db.add(event)

    await db.commit()
    await db.refresh(submission)
    await db.refresh(revision)

    initial_revision = ContentRevisionResponse(
        id=revision.id,
        submission_id=submission.id,
        revision_num=revision.revision_num,
        raw_text=revision.raw_text,
        file_path=revision.file_path,
        file_metadata=revision.file_metadata or {},
        created_at=revision.created_at,
    )

    sub_resp = ContentSubmissionResponse(
        id=submission.id,
        organization_id=submission.organization_id,
        workspace_id=submission.workspace_id,
        author_id=submission.author_id,
        title=submission.title,
        content_type=submission.content_type,
        current_status=WorkflowStateEnum(submission.current_status),
        current_revision_num=submission.current_revision_num,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
        revisions=[initial_revision],
    )

    _SUBMISSION_STORE[content_id] = sub_resp
    return sub_resp


@router.get("", response_model=List[ContentSubmissionResponse])
async def list_content(
    status_filter: Optional[WorkflowStateEnum] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List submitted marketing content for the tenant."""
    query = (
        select(ContentSubmission)
        .options(selectinload(ContentSubmission.revisions))
        .order_by(desc(ContentSubmission.created_at))
        .limit(limit)
        .offset(offset)
    )

    if status_filter:
        query = query.where(ContentSubmission.current_status == status_filter.value)

    result = await db.execute(query)
    submissions = result.scalars().all()

    items = []
    for s in submissions:
        revs = [
            ContentRevisionResponse(
                id=r.id,
                submission_id=r.submission_id,
                revision_num=r.revision_num,
                raw_text=r.raw_text,
                file_path=r.file_path,
                file_metadata=r.file_metadata or {},
                created_at=r.created_at,
            )
            for r in (s.revisions or [])
        ]
        items.append(
            ContentSubmissionResponse(
                id=s.id,
                organization_id=s.organization_id,
                workspace_id=s.workspace_id,
                author_id=s.author_id,
                title=s.title,
                content_type=s.content_type,
                current_status=WorkflowStateEnum(s.current_status),
                current_revision_num=s.current_revision_num,
                created_at=s.created_at,
                updated_at=s.updated_at,
                revisions=revs,
            )
        )
    return items


@router.get("/{content_id}", response_model=ContentSubmissionResponse)
async def get_content(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get submission details and revision history."""
    query = (
        select(ContentSubmission)
        .options(selectinload(ContentSubmission.revisions))
        .where(ContentSubmission.id == content_id)
    )
    result = await db.execute(query)
    submission = result.scalars().first()

    if submission:
        revs = [
            ContentRevisionResponse(
                id=r.id,
                submission_id=r.submission_id,
                revision_num=r.revision_num,
                raw_text=r.raw_text,
                file_path=r.file_path,
                file_metadata=r.file_metadata or {},
                created_at=r.created_at,
            )
            for r in (submission.revisions or [])
        ]
        return ContentSubmissionResponse(
            id=submission.id,
            organization_id=submission.organization_id,
            workspace_id=submission.workspace_id,
            author_id=submission.author_id,
            title=submission.title,
            content_type=submission.content_type,
            current_status=WorkflowStateEnum(submission.current_status),
            current_revision_num=submission.current_revision_num,
            created_at=submission.created_at,
            updated_at=submission.updated_at,
            revisions=revs,
        )

    if content_id in _SUBMISSION_STORE:
        return _SUBMISSION_STORE[content_id]

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Content submission '{content_id}' not found.",
    )


@router.post("/{content_id}/revisions", response_model=ContentSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_revision(
    content_id: str,
    payload: ContentRevisionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a revision (new version) of existing content.
    CRITICAL RULE: Any subsequent content edit creates a new version and
    INVALIDATES any prior approval. The content returns to 'resubmitted' status.
    """
    query = (
        select(ContentSubmission)
        .options(selectinload(ContentSubmission.revisions))
        .where(ContentSubmission.id == content_id)
    )
    result = await db.execute(query)
    submission = result.scalars().first()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content submission '{content_id}' not found.",
        )

    new_revision_num = submission.current_revision_num + 1
    new_rev_id = f"rev-{content_id}-{new_revision_num}"

    new_revision = ContentRevision(
        id=new_rev_id,
        submission_id=content_id,
        revision_num=new_revision_num,
        raw_text=payload.raw_text,
        file_path=None,
        file_metadata=payload.file_metadata or {},
    )
    db.add(new_revision)

    # Invalidate prior approval state: new version requires re-audit and fresh approval!
    submission.current_revision_num = new_revision_num
    submission.current_status = WorkflowStateEnum.RESUBMITTED.value
    submission.updated_at = datetime.now(timezone.utc)

    event = AuditEventModel(
        organization_id=submission.organization_id,
        actor_id=current_user.user_id,
        entity_type="content",
        entity_id=content_id,
        event_type="revision_created",
        details={
            "new_version": new_revision_num,
            "prior_approval_invalidated": True,
            "new_status": WorkflowStateEnum.RESUBMITTED.value,
        },
    )
    db.add(event)

    await db.commit()
    await db.refresh(submission)

    revs = [
        ContentRevisionResponse(
            id=r.id,
            submission_id=r.submission_id,
            revision_num=r.revision_num,
            raw_text=r.raw_text,
            file_path=r.file_path,
            file_metadata=r.file_metadata or {},
            created_at=r.created_at,
        )
        for r in (submission.revisions or [])
    ]

    resp = ContentSubmissionResponse(
        id=submission.id,
        organization_id=submission.organization_id,
        workspace_id=submission.workspace_id,
        author_id=submission.author_id,
        title=submission.title,
        content_type=submission.content_type,
        current_status=WorkflowStateEnum(submission.current_status),
        current_revision_num=submission.current_revision_num,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
        revisions=revs,
    )
    _SUBMISSION_STORE[content_id] = resp
    return resp


@router.get("/{content_id}/history", response_model=ContentHistoryResponse)
async def get_content_history(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full version history and audit log for a content item."""
    query = (
        select(ContentSubmission)
        .options(selectinload(ContentSubmission.revisions))
        .where(ContentSubmission.id == content_id)
    )
    result = await db.execute(query)
    submission = result.scalars().first()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content submission '{content_id}' not found.",
        )

    # Fetch associated audit events
    audit_events_q = (
        select(AuditEventModel)
        .where(AuditEventModel.entity_id == content_id)
        .order_by(desc(AuditEventModel.created_at))
    )
    events_res = await db.execute(audit_events_q)
    events = events_res.scalars().all()

    audit_history = [
        {
            "event_id": e.id,
            "actor_id": e.actor_id,
            "event_type": e.event_type,
            "timestamp": e.created_at.isoformat() if e.created_at else None,
            "details": e.details or {},
        }
        for e in events
    ]

    versions = [
        ContentRevisionResponse(
            id=r.id,
            submission_id=r.submission_id,
            revision_num=r.revision_num,
            raw_text=r.raw_text,
            file_path=r.file_path,
            file_metadata=r.file_metadata or {},
            created_at=r.created_at,
        )
        for r in (submission.revisions or [])
    ]

    return ContentHistoryResponse(
        content_id=submission.id,
        title=submission.title,
        current_version=submission.current_revision_num,
        current_status=WorkflowStateEnum(submission.current_status),
        versions=versions,
        audit_history=audit_history,
    )


@router.post("/{content_id}/audit", response_model=AuditResultSchema, status_code=status.HTTP_200_OK)
async def audit_content_by_path(
    content_id: str,
    payload: Optional[AuditRunRequest] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger brand governance audit for content item (Section 8 endpoint: POST /api/content/{content_id}/audit).
    """
    from app.api.routes.audits import run_audit
    req = payload or AuditRunRequest(content_id=content_id)
    req.content_id = content_id
    return await run_audit(payload=req, current_user=current_user, db=db)


@router.get("/{content_id}/reviews")
async def get_content_reviews_by_path(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all human review decisions recorded for a specific content item (Section 8 endpoint: GET /api/content/{content_id}/reviews).
    """
    from app.api.routes.reviews import list_content_reviews
    return await list_content_reviews(content_id=content_id, current_user=current_user, db=db)
