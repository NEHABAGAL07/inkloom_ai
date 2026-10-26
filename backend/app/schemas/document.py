"""
Schemas for Document Intelligence API
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    organization_id: str
    page_number: int
    chunk_index: int
    text: str
    token_count: int
    created_at: datetime


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    filename: str
    mime_type: str
    file_size_bytes: int
    status: str
    page_count: int
    uploaded_by: Optional[str] = None
    error_message: Optional[str] = None
    has_ocr_warning: bool
    created_at: datetime
    updated_at: datetime


class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkResponse] = []


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class SearchResultPassage(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    source_type: str  # "document" | "guideline_rule"
    page: Optional[int] = None
    section: Optional[str] = None
    score: float
    snippet: str
    text: str
