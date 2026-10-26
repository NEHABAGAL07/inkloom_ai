"""
Knowledge Documents API Routes
Provides authenticated upload, listing, inspection, and deletion of brand manuals and guideline documents.
Enforces multi-tenant organization isolation and strict role-based access control.
"""
import os
import shutil
import tempfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.database.session import get_db, SessionLocal
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.core.config import settings
from app.models.document import KnowledgeDocument
from app.schemas.document import (
    DocumentResponse,
    DocumentDetailResponse,
    DocumentListResponse,
)
from app.services.media_audit.extractor import MediaExtractor, MediaExtractionError
from app.services.document_intelligence.ingestion import (
    DocumentIngestionService,
    process_document_in_background,
)

router = APIRouter(prefix="/documents", tags=["Document Intelligence"])


def _check_document_management_permission(auth_context: AuthContext):
    """
    Ensures caller has permission to upload or delete brand guideline documents.
    Allowed roles: admin, compliance_officer.
    """
    user_roles = [r.value for r in auth_context.roles]
    is_allowed = (
        auth_context.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
        or "admin" in user_roles
        or "compliance_officer" in user_roles
        or "legal" in user_roles
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only brand administrators and compliance officers can upload or remove brand documents.",
        )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Upload a brand guideline document (PDF, DOCX, or TXT).
    Validates file boundaries, sanitizes filename, and schedules background text extraction and chunk indexing.
    Role required: admin or compliance_officer.
    """
    _check_document_management_permission(auth_context)

    raw_filename = file.filename or "uploaded_document"
    clean_filename = MediaExtractor.sanitize_filename(raw_filename)
    mime_type = file.content_type or "application/octet-stream"

    # Read content to check size and write to secure storage
    content_bytes = await file.read()
    file_size = len(content_bytes)

    try:
        MediaExtractor.validate_file(clean_filename, file_size, mime_type)
    except MediaExtractionError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

    # Create temporary file for processing
    upload_dir = os.path.join(settings.UPLOAD_STORAGE_DIR, "docs")
    os.makedirs(upload_dir, exist_ok=True)
    temp_file = tempfile.NamedTemporaryFile(delete=False, dir=upload_dir, suffix=f"_{clean_filename}")
    try:
        temp_file.write(content_bytes)
        temp_file.flush()
        temp_path = temp_file.name
    finally:
        temp_file.close()

    # Create initial document record with 'processing' status
    doc = KnowledgeDocument(
        organization_id=auth_context.organization_id,
        filename=clean_filename,
        mime_type=mime_type,
        file_size_bytes=file_size,
        status="processing",
        uploaded_by=auth_context.email or auth_context.user_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Dispatch ingestion to background task
    background_tasks.add_task(
        process_document_in_background,
        document_id=doc.id,
        file_path=temp_path,
        session_factory=SessionLocal,
    )

    return doc


@router.get("", response_model=DocumentListResponse)
def list_documents(
    status_filter: Optional[str] = Query(None, alias="status"),
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Lists all brand guideline documents for the caller's organization.
    Multi-tenant isolation: strictly filtered by organization_id.
    """
    query = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.organization_id == auth_context.organization_id
    )
    if status_filter:
        query = query.filter(KnowledgeDocument.status == status_filter)

    docs = query.order_by(KnowledgeDocument.created_at.desc()).all()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Retrieve document details and its indexed chunks.
    Multi-tenant isolation: returns 404 if document belongs to another organization.
    """
    doc = (
        db.query(KnowledgeDocument)
        .filter(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.organization_id == auth_context.organization_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Deletes a document and cascade-deletes all its indexed chunks.
    Role required: admin or compliance_officer.
    Multi-tenant isolation: returns 404 if document belongs to another organization.
    """
    _check_document_management_permission(auth_context)

    doc = (
        db.query(KnowledgeDocument)
        .filter(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.organization_id == auth_context.organization_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    db.delete(doc)
    db.commit()
    return None
