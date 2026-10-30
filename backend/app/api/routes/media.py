"""
Media API Routes
Provides authenticated, multi-tenant physical media upload, retrieval,
streaming, and administration for Designer and Admin workspaces.
"""
import os
import re
import uuid
import logging
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.core.security import (
    get_current_auth_context,
    AuthContext,
    UserRole,
    require_roles,
)
from app.models.media import MediaItem
from app.models.submission import ContentSubmission
from app.models.revision import ContentRevision
from app.models.audit_event import AuditEvent
from app.workflow.state_machine import WorkflowState
from app.schemas.media import (
    MediaItemResponse,
    MediaItemListResponse,
)

logger = logging.getLogger("inkloom.media")

router = APIRouter(tags=["Media Storage & Administration"])


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename removing directory traversal sequences and special characters."""
    base = os.path.basename(filename)
    clean = re.sub(r"[^\w\.\-\_]", "_", base)
    if not clean or clean.startswith("."):
        clean = f"media_{clean}"
    return clean[:200]


def determine_file_type(filename: str, mime_type: str) -> str:
    """Classifies content into image, video, document, or other."""
    lower_fn = filename.lower()
    lower_mime = mime_type.lower()
    if (
        lower_fn.endswith((".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp", ".avif"))
        or lower_mime.startswith("image/")
    ):
        return "image"
    if lower_fn.endswith((".mp4", ".webm", ".mov", ".mkv", ".avi")) or lower_mime.startswith("video/"):
        return "video"
    if (
        lower_fn.endswith((".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt"))
        or "pdf" in lower_mime
        or "word" in lower_mime
        or "text/" in lower_mime
    ):
        return "document"
    return "other"


@router.post(
    "/media/upload",
    response_model=MediaItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload media file with persistent database storage",
)
async def upload_media_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    campaign_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Persistently stores an uploaded media file (image, video, document), validates MIME & size boundaries,
    inserts metadata into the database, links to workflow submissions, and returns the saved database record.
    """
    raw_filename = file.filename or "media_upload"
    clean_filename = sanitize_filename(raw_filename)
    mime_type = file.content_type or "application/octet-stream"

    # 1. Validate file extension and MIME type
    file_type = determine_file_type(clean_filename, mime_type)
    allowed_exts = (
        ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif",
        ".pdf", ".docx", ".txt",
        ".mp4", ".webm", ".mov",
    )
    is_allowed = clean_filename.lower().endswith(allowed_exts) or mime_type in settings.ALLOWED_MEDIA_TYPES
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported media file '{clean_filename}'. Allowed types: PNG, JPEG, WebP, SVG, GIF, PDF, DOCX, TXT, MP4, WebM, MOV.",
        )

    # 2. Prepare persistent physical storage directory
    storage_dir = os.path.join(settings.UPLOAD_STORAGE_DIR, auth.organization_id, "media")
    os.makedirs(storage_dir, exist_ok=True)

    unique_stored_name = f"med_{uuid.uuid4().hex[:12]}_{clean_filename}"
    dest_path = os.path.join(storage_dir, unique_stored_name)

    # 3. Stream file content to disk and enforce max size boundary
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    bytes_written = 0

    try:
        with open(dest_path, "wb") as f_out:
            while chunk := await file.read(1024 * 64):
                bytes_written += len(chunk)
                if bytes_written > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                    )
                f_out.write(chunk)
    except Exception as e:
        if os.path.exists(dest_path):
            try:
                os.remove(dest_path)
            except Exception:
                pass
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist uploaded media file: {str(e)}",
        )

    if bytes_written == 0:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    # 4. Extract image dimensions and metadata if image
    extra_meta = {
        "file_size_bytes": bytes_written,
        "mime_type": mime_type,
        "clean_filename": clean_filename,
    }
    if file_type == "image":
        try:
            from PIL import Image
            with Image.open(dest_path) as img:
                extra_meta["width"] = img.width
                extra_meta["height"] = img.height
                extra_meta["format"] = img.format
                if img.height > 0:
                    extra_meta["aspect_ratio"] = round(img.width / img.height, 2)
        except Exception:
            pass

    # 5. Database transaction: Insert MediaItem + linked ContentSubmission for workflow integration
    try:
        media_item = MediaItem(
            organization_id=auth.organization_id,
            campaign_id=campaign_id if campaign_id else None,
            original_filename=clean_filename,
            stored_filename=unique_stored_name,
            file_path=dest_path,
            file_type=file_type,
            mime_type=mime_type,
            file_size=bytes_written,
            uploaded_by=auth.email or auth.user_id,
            description=description or f"Uploaded {file_type} asset: {clean_filename}",
            status="active",
            extra_metadata=extra_meta,
        )
        db.add(media_item)
        db.flush()

        # Synchronize with ContentSubmission pipeline for full cross-dashboard visibility
        sub_title = (title or "").strip() or f"Design Asset: {clean_filename}"
        submission = ContentSubmission(
            organization_id=auth.organization_id,
            creator_id=auth.user_id,
            campaign_id=campaign_id if campaign_id else None,
            title=sub_title,
            description=description or f"Media upload ({clean_filename}, {file_type})",
            content_type=file_type if file_type in ["image", "video", "document"] else "image",
            status=WorkflowState.SUBMITTED.value,
        )
        db.add(submission)
        db.flush()

        # Connect media_item to submission
        media_item.submission_id = submission.id

        revision = ContentRevision(
            submission_id=submission.id,
            version_number=1,
            raw_text=f"Persistent media asset: {clean_filename}",
            file_name=clean_filename,
            file_path=dest_path,
            file_size_bytes=bytes_written,
            media_metadata=extra_meta,
        )
        db.add(revision)
        db.flush()
        submission.current_revision_id = revision.id

        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="media",
            entity_id=media_item.id,
            event_type="media_uploaded",
            details={
                "media_id": media_item.id,
                "submission_id": submission.id,
                "filename": clean_filename,
                "file_size": bytes_written,
                "file_type": file_type,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(media_item)

        logger.info(
            f"Successfully stored media {media_item.id} ({clean_filename}, {bytes_written} bytes) "
            f"for org {auth.organization_id}"
        )
        return media_item

    except Exception as exc:
        db.rollback()
        if os.path.exists(dest_path):
            try:
                os.remove(dest_path)
            except Exception:
                pass
        logger.error(f"Failed to record media metadata: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database record creation failed: {str(exc)}",
        )


@router.get(
    "/admin/media",
    response_model=MediaItemListResponse,
    summary="Admin media retrieval with filtering and pagination",
)
def get_admin_media_list(
    status: Optional[str] = Query(None, description="Filter by status (e.g. active, submitted, approved)"),
    organization_id: Optional[str] = Query(None, description="Organization ID filter (tenant isolated)"),
    uploaded_by: Optional[str] = Query(None, description="Filter by uploader email or user ID"),
    file_type: Optional[str] = Query(None, description="Filter by file type (image, video, document)"),
    campaign_id: Optional[str] = Query(None, description="Filter by campaign ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Retrieves persistently stored media records directly from the database for the Admin dashboard.
    Enforces multi-tenant organization isolation and supports status/type/uploader filtering.
    """
    # Organization isolation: callers can only view their own organization
    target_org_id = auth.organization_id
    if organization_id and organization_id != auth.organization_id:
        # Check if caller has superadmin rights, otherwise deny access
        if not auth.is_admin():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot query media across different organizations.",
            )
        target_org_id = organization_id

    query = db.query(MediaItem).filter(MediaItem.organization_id == target_org_id)

    if status:
        query = query.filter(MediaItem.status == status)
    if uploaded_by:
        query = query.filter(MediaItem.uploaded_by == uploaded_by)
    if file_type:
        query = query.filter(MediaItem.file_type == file_type)
    if campaign_id:
        query = query.filter(MediaItem.campaign_id == campaign_id)

    total = query.count()
    items = query.order_by(MediaItem.created_at.desc()).offset(offset).limit(limit).all()

    page = (offset // limit) + 1 if limit > 0 else 1
    return MediaItemListResponse(
        items=items,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/media",
    response_model=MediaItemListResponse,
    summary="List media assets for current organization",
)
def list_media(
    status: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Lists media assets belonging to the authenticated tenant."""
    query = db.query(MediaItem).filter(MediaItem.organization_id == auth.organization_id)

    if status:
        query = query.filter(MediaItem.status == status)
    if file_type:
        query = query.filter(MediaItem.file_type == file_type)
    if campaign_id:
        query = query.filter(MediaItem.campaign_id == campaign_id)

    total = query.count()
    items = query.order_by(MediaItem.created_at.desc()).offset(offset).limit(limit).all()

    page = (offset // limit) + 1 if limit > 0 else 1
    return MediaItemListResponse(
        items=items,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/media/{media_id}",
    response_model=MediaItemResponse,
    summary="Get media item metadata by ID",
)
def get_media_detail(
    media_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieves a single media item record from the database with multi-tenant isolation."""
    media = (
        db.query(MediaItem)
        .filter(
            MediaItem.id == media_id,
            MediaItem.organization_id == auth.organization_id,
        )
        .first()
    )
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media item '{media_id}' not found or access denied.",
        )
    return media


@router.get(
    "/media/file/{media_id}",
    summary="Stream persistent media file",
)
def stream_media_file(
    media_id: str,
    db: Session = Depends(get_db),
):
    """
    Streams the physical media file stored on disk for inline browser display or download.
    Provides correct MIME type, content disposition, and cache headers.
    """
    media = db.query(MediaItem).filter(MediaItem.id == media_id).first()
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media asset not found in database.",
        )

    if not os.path.exists(media.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical media file is missing from server storage.",
        )

    # Determine inline vs attachment
    return FileResponse(
        path=media.file_path,
        media_type=media.mime_type,
        filename=media.original_filename,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": f'inline; filename="{media.original_filename}"',
        },
    )


@router.delete(
    "/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete media item and remove physical file",
)
def delete_media_item(
    media_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Deletes media item from database and removes persistent physical file."""
    media = (
        db.query(MediaItem)
        .filter(
            MediaItem.id == media_id,
            MediaItem.organization_id == auth.organization_id,
        )
        .first()
    )
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media item not found or access denied.",
        )

    # Authorization: Admins, Compliance Officers, or original uploader
    is_owner = media.uploaded_by in [auth.email, auth.user_id]
    if not (auth.is_admin() or auth.is_legal_officer() or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators, compliance officers, or the original uploader can delete media.",
        )

    file_path = media.file_path
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.warning(f"Could not remove physical file {file_path}: {e}")

    db.delete(media)
    db.commit()
    return None
