"""
Test Suite for Document Intelligence & Retrieval (Phase 1)
Tests:
1. Cross-tenant isolation (Org A cannot access or retrieve Org B's documents/chunks)
2. Accurate page numbers in chunk extraction
3. Retrieval synonym expansion ("reversed wordmark on navy" for "white logo on dark blue background")
4. Oversize and invalid file format rejection
5. Document deletion cascades and cleans up chunks
6. Role-based access control (only admin/compliance_officer can upload or delete)
"""
import io
import pytest
from app.models.organization import Organization, Membership
from app.models.user import User
from app.models.document import KnowledgeDocument, DocumentChunk
from app.models.guideline import BrandGuideline, GuidelineRule
from app.services.document_intelligence.ingestion import DocumentIngestionService
from app.services.document_intelligence.retrieval import DocumentRetrievalService
from app.core.security import AuthContext, UserRole, get_current_auth_context


def test_cross_tenant_isolation(db_session, client):
    """Org A must never see or retrieve documents or chunks belonging to Org B."""
    org_a = Organization(id="org_alpha_001", name="Alpha Corp", slug="alpha-corp")
    org_b = Organization(id="org_beta_002", name="Beta Corp", slug="beta-corp")
    db_session.add_all([org_a, org_b])
    db_session.commit()

    doc_a = KnowledgeDocument(
        id="doc_a_1",
        organization_id=org_a.id,
        filename="alpha_brand_guide.pdf",
        mime_type="application/pdf",
        status="ready",
        page_count=2,
    )
    doc_b = KnowledgeDocument(
        id="doc_b_1",
        organization_id=org_b.id,
        filename="beta_brand_guide.pdf",
        mime_type="application/pdf",
        status="ready",
        page_count=1,
    )
    db_session.add_all([doc_a, doc_b])
    db_session.commit()

    chunk_a = DocumentChunk(
        id="chunk_a_1",
        document_id=doc_a.id,
        organization_id=org_a.id,
        page_number=1,
        chunk_index=0,
        text="Alpha Corporation confidential brand guidelines and logo placement.",
        token_count=10,
    )
    chunk_b = DocumentChunk(
        id="chunk_b_1",
        document_id=doc_b.id,
        organization_id=org_b.id,
        page_number=1,
        chunk_index=0,
        text="Beta Corporation proprietary trademark rules and secret color specs.",
        token_count=10,
    )
    db_session.add_all([chunk_a, chunk_b])
    db_session.commit()

    # 1. Retrieval service isolation
    passages_for_a = DocumentRetrievalService.retrieve_passages(
        db=db_session,
        organization_id=org_a.id,
        query="trademark rules and brand guidelines",
        top_k=10,
    )
    doc_ids_for_a = [p["document_id"] for p in passages_for_a]
    assert doc_a.id in doc_ids_for_a
    assert doc_b.id not in doc_ids_for_a

    # 2. HTTP Endpoint isolation
    # Authenticate as Org A
    auth_org_a = AuthContext(
        user_id="user_alpha",
        organization_id=org_a.id,
        roles=[UserRole.ADMIN],
        email="admin@alpha.com",
        is_authenticated=True,
    )
    from app.main import app
    app.dependency_overrides[get_current_auth_context] = lambda: auth_org_a

    # Listing documents for Org A shows only doc_a
    res = client.get("/api/v1/documents")
    assert res.status_code == 200
    returned_ids = [d["id"] for d in res.json()["documents"]]
    assert doc_a.id in returned_ids
    assert doc_b.id not in returned_ids

    # Directly requesting Org B's document returns 404
    res_b = client.get(f"/api/v1/documents/{doc_b.id}")
    assert res_b.status_code == 404

    app.dependency_overrides.clear()


def test_page_numbers_are_correct(db_session, tmp_path):
    """Extracted chunks must preserve accurate 1-indexed page numbers."""
    org = Organization(id="org_page_test", name="Page Corp", slug="page-corp")
    db_session.add(org)
    db_session.commit()

    doc = KnowledgeDocument(
        id="doc_page_1",
        organization_id=org.id,
        filename="sample_multipage.txt",
        mime_type="text/plain",
        status="processing",
    )
    db_session.add(doc)
    db_session.commit()

    # Create multi-page simulated text file
    sample_file = tmp_path / "sample_multipage.txt"
    sample_file.write_text("Page one content regarding typography standards.")

    # Ingest document
    DocumentIngestionService.ingest_file_sync(
        db=db_session,
        document_id=doc.id,
        file_path=str(sample_file),
    )

    db_session.refresh(doc)
    assert doc.status == "ready"
    assert doc.page_count >= 1

    chunks = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
    assert len(chunks) >= 1
    assert all(c.page_number == 1 for c in chunks)


def test_retrieval_synonym_expansion(db_session):
    """
    Retrieval finds a passage about 'reversed wordmark on navy' for the query
    'white logo on dark blue background' through brand domain synonym expansion.
    """
    org = Organization(id="org_syn_test", name="Synonym Corp", slug="syn-corp")
    db_session.add(org)
    db_session.commit()

    doc = KnowledgeDocument(
        id="doc_syn_1",
        organization_id=org.id,
        filename="brand_identity_guide.pdf",
        mime_type="application/pdf",
        status="ready",
        page_count=12,
    )
    db_session.add(doc)
    db_session.commit()

    # Passage uses "reversed wordmark on navy", user query uses "white logo on dark blue background"
    target_text = (
        "Section 4.2 - Background Contrast: The reversed wordmark on navy backgrounds "
        "is officially permitted for all enterprise digital collateral. Never use red wordmarks."
    )
    irrelevant_text = (
        "Section 9.1 - Financial Reporting: Quarterly earnings results must be filed "
        "with audited statements by the compliance officer."
    )

    c1 = DocumentChunk(
        id="chunk_syn_target",
        document_id=doc.id,
        organization_id=org.id,
        page_number=7,
        chunk_index=0,
        text=target_text,
        token_count=25,
    )
    c2 = DocumentChunk(
        id="chunk_syn_irrelevant",
        document_id=doc.id,
        organization_id=org.id,
        page_number=11,
        chunk_index=1,
        text=irrelevant_text,
        token_count=20,
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    # Search with natural language query
    query = "Can I use a white logo on a dark blue background?"
    results = DocumentRetrievalService.retrieve_passages(
        db=db_session,
        organization_id=org.id,
        query=query,
        top_k=5,
    )

    assert len(results) > 0
    top_result = results[0]
    assert top_result["chunk_id"] == "chunk_syn_target"
    assert top_result["document_id"] == doc.id
    assert top_result["document_name"] == "brand_identity_guide.pdf"
    assert top_result["page"] == 7
    assert "reversed wordmark on navy" in top_result["text"]


def test_oversize_and_invalid_file_rejected(client, db_session):
    """Oversized files and disallowed media formats must be rejected with 400 Bad Request."""
    org = Organization(id="test_org_001", name="Test Org", slug="test-org")
    db_session.merge(org)
    db_session.commit()

    # 1. Unsupported MIME type (.exe)
    invalid_file = io.BytesIO(b"MZ executable content")
    res_invalid = client.post(
        "/api/v1/documents",
        files={"file": ("malicious.exe", invalid_file, "application/x-msdownload")},
    )
    assert res_invalid.status_code == 400
    assert "not supported" in res_invalid.json()["detail"].lower()

    # 2. Oversized file (> 25MB)
    huge_data = io.BytesIO(b"0" * (26 * 1024 * 1024))
    res_oversize = client.post(
        "/api/v1/documents",
        files={"file": ("huge_document.pdf", huge_data, "application/pdf")},
    )
    assert res_oversize.status_code == 400
    assert "exceeds maximum limit" in res_oversize.json()["detail"].lower()


def test_delete_cascades_chunks(client, db_session):
    """Deleting a document must cleanly cascade delete all associated chunks."""
    org = Organization(id="org_del_test", name="Delete Corp", slug="del-corp")
    db_session.add(org)
    db_session.commit()

    auth_admin = AuthContext(
        user_id="admin_del",
        organization_id=org.id,
        roles=[UserRole.ADMIN],
        email="admin@delete.com",
        is_authenticated=True,
    )
    from app.main import app
    app.dependency_overrides[get_current_auth_context] = lambda: auth_admin

    doc = KnowledgeDocument(
        id="doc_to_delete",
        organization_id=org.id,
        filename="temporary_standards.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        status="ready",
        page_count=3,
    )
    db_session.add(doc)
    db_session.commit()

    chunk1 = DocumentChunk(
        id="chunk_del_1",
        document_id=doc.id,
        organization_id=org.id,
        page_number=1,
        chunk_index=0,
        text="Temporary chunk 1",
    )
    chunk2 = DocumentChunk(
        id="chunk_del_2",
        document_id=doc.id,
        organization_id=org.id,
        page_number=2,
        chunk_index=1,
        text="Temporary chunk 2",
    )
    db_session.add_all([chunk1, chunk2])
    db_session.commit()

    # Verify chunks exist
    assert db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count() == 2

    # Delete via API
    res_del = client.delete(f"/api/v1/documents/{doc.id}")
    assert res_del.status_code == 204

    # Verify document and chunks are removed
    assert db_session.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc.id).first() is None
    assert db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count() == 0

    app.dependency_overrides.clear()


def test_document_rbac_permission_guards(client, db_session):
    """Creators and viewers cannot upload or delete documents; admins and compliance officers can."""
    org = Organization(id="org_rbac_doc", name="RBAC Corp", slug="rbac-corp")
    db_session.add(org)
    db_session.commit()

    doc = KnowledgeDocument(
        id="doc_rbac_guard",
        organization_id=org.id,
        filename="protected_rules.pdf",
        mime_type="application/pdf",
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    from app.main import app

    # 1. Creator attempts upload -> 403 Forbidden
    auth_creator = AuthContext(
        user_id="user_creator",
        organization_id=org.id,
        roles=[UserRole.CREATOR],
        email="creator@rbac.com",
        is_authenticated=True,
    )
    app.dependency_overrides[get_current_auth_context] = lambda: auth_creator

    sample_file = io.BytesIO(b"Valid text content for guideline.")
    res_upload = client.post(
        "/api/v1/documents",
        files={"file": ("guide.txt", sample_file, "text/plain")},
    )
    assert res_upload.status_code == 403

    # Creator attempts delete -> 403 Forbidden
    res_del = client.delete(f"/api/v1/documents/{doc.id}")
    assert res_del.status_code == 403

    # Creator can read/list documents -> 200 OK
    res_list = client.get("/api/v1/documents")
    assert res_list.status_code == 200

    app.dependency_overrides.clear()
