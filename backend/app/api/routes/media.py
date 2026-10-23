"""Inkloom AI - Media Audit API Route.

Provides endpoints for direct media asset auditing (documents, images, videos)
with automated visual checks, OCR, layout mapping, and AI brand governance.
"""

import os
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from app.core.security import CurrentUser, get_current_user
from app.core.config import settings
from app.services.media_audit.interfaces import MediaAuditResult, MediaProcessingStatus
from app.services.media_audit.media_orchestrator import MediaAuditOrchestrator
from app.services.media_audit.file_validation import sanitize_filename, SafeTempFile
from app.api.routes.content import _SUBMISSION_STORE
from app.api.routes.audits import _AUDIT_STORE
from app.schemas.common import WorkflowStateEnum

router = APIRouter(prefix="/media", tags=["Media"])
_media_orchestrator = MediaAuditOrchestrator()


@router.post(
    "/audit",
    response_model=MediaAuditResult,
    status_code=status.HTTP_200_OK,
    summary="Audit uploaded media asset for brand compliance",
)
async def audit_media_upload(
    file: UploadFile = File(..., description="Document (PDF/DOCX/TXT), image (PNG/JPEG/WebP), or video (MP4/MOV/WebM)"),
    transcript_text: Optional[str] = Form(None, description="External spoken audio transcript for video media"),
    alt_text: Optional[str] = Form(None, description="Image accessibility alternative text"),
    content_id: Optional[str] = Form(None, description="Optional existing submission ID to attach audit record to"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Execute full brand compliance audit on uploaded media asset:
    - Format and magic-byte safety verification
    - Document parsing (PDF, DOCX, TXT)
    - Visual brand inspection (colors, contrast, resolution)
    - Video container inspection and transcript mapping
    - Integration with AI Audit Engine with physical location mapping
    """
    raw_filename = file.filename or "uploaded_media.bin"
    sanitized = sanitize_filename(raw_filename)
    ext = os.path.splitext(sanitized)[1].lower()

    # Pre-flight extension check
    supported_extensions = (
        ".txt", ".pdf", ".docx",
        ".png", ".jpg", ".jpeg", ".webp",
        ".mp4", ".mov", ".webm",
    )
    if ext not in supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(supported_extensions)}",
        )

    # Use secure temporary file for deterministic processing and cleanup
    with SafeTempFile(suffix=ext) as temp_path:
        # Stream file safely while enforcing maximum size limit
        bytes_read = 0
        chunk_size = 1024 * 1024  # 1 MB chunks
        max_size = settings.MAX_UPLOAD_SIZE_BYTES

        try:
            with open(temp_path, "wb") as f:
                while True:
                    chunk = await file.read(chunk_size)
                    if not chunk:
                        break
                    bytes_read += len(chunk)
                    if bytes_read > max_size:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum upload size limit of {max_size} bytes.",
                        )
                    f.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read and store uploaded file: {str(e)}",
            )

        if bytes_read == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        # Run Media Audit Pipeline
        media_audit_result = _media_orchestrator.audit_media(
            file_path=temp_path,
            filename=sanitized,
            mime_type=file.content_type,
            transcript_text=transcript_text,
            alt_text=alt_text,
            content_id=content_id,
            context={
                "organization_id": current_user.organization_id,
                "user_id": current_user.user_id,
            },
        )

    # If file validation or processing critically failed, return 400 with details
    if media_audit_result.status == MediaProcessingStatus.FAILED:
        error_msg = (
            media_audit_result.errors[0]
            if media_audit_result.errors
            else "Media processing and validation failed."
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    # If linked to an existing submission, associate audit result
    effective_content_id = content_id or (
        media_audit_result.audit_result.content_id if media_audit_result.audit_result else None
    )
    if effective_content_id and effective_content_id in _SUBMISSION_STORE:
        # AI/media checks never auto-approve: transition to PENDING_APPROVAL
        _SUBMISSION_STORE[effective_content_id].current_status = WorkflowStateEnum.PENDING_APPROVAL

    if media_audit_result.audit_result:
        _AUDIT_STORE[media_audit_result.audit_result.audit_id] = media_audit_result.audit_result

    return media_audit_result
