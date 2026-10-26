"""
Document Intelligence Retrieval Service
Executes multi-tenant BM25 retrieval over uploaded document chunks and published guideline rules.
Ensures strict organization-level isolation and returns grounded citations with page numbers.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.document import KnowledgeDocument, DocumentChunk
from app.models.guideline import BrandGuideline, GuidelineRule
from app.services.document_intelligence.bm25 import BM25Retriever


class DocumentRetrievalService:
    @classmethod
    def get_searchable_corpus(cls, db: Session, organization_id: str) -> List[Dict[str, Any]]:
        """
        Builds the unified searchable passage index for a specific tenant organization:
        1. Processed chunks from uploaded knowledge documents.
        2. Published BrandGuideline rules.
        """
        corpus: List[Dict[str, Any]] = []

        # 1. Document chunks for this organization (only from ready documents)
        chunks = (
            db.query(DocumentChunk, KnowledgeDocument.filename)
            .join(KnowledgeDocument, DocumentChunk.document_id == KnowledgeDocument.id)
            .filter(
                DocumentChunk.organization_id == organization_id,
                KnowledgeDocument.status == "ready",
            )
            .all()
        )

        for chunk, filename in chunks:
            corpus.append(
                {
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "document_name": filename,
                    "source_type": "document",
                    "page": chunk.page_number,
                    "section": f"Page {chunk.page_number}",
                    "text": chunk.text,
                }
            )

        # 2. Published guideline rules for this organization
        active_guidelines = (
            db.query(BrandGuideline)
            .filter(
                BrandGuideline.organization_id == organization_id,
                BrandGuideline.is_active == True,
                BrandGuideline.status.in_(["published", "approved"]),
            )
            .all()
        )

        for g in active_guidelines:
            for rule in g.rules:
                rule_desc = rule.rule_definition.get("description", "") if isinstance(rule.rule_definition, dict) else ""
                rule_details = []
                if isinstance(rule.rule_definition, dict):
                    for k, v in rule.rule_definition.items():
                        if isinstance(v, list):
                            rule_details.append(f"{k}: {', '.join(str(x) for x in v)}")
                        elif isinstance(v, str):
                            rule_details.append(f"{k}: {v}")

                text_repr = (
                    f"Brand Guideline: {g.name}. Rule: {rule.rule_name}. "
                    f"Section: {rule.section or 'General'}. Category: {rule.category}. "
                    f"{rule_desc} {' '.join(rule_details)}"
                ).strip()

                corpus.append(
                    {
                        "chunk_id": f"rule_{rule.id}",
                        "document_id": g.id,
                        "document_name": f"Guideline: {g.name}",
                        "source_type": "guideline_rule",
                        "page": None,
                        "section": rule.section or rule.rule_name,
                        "text": text_repr,
                    }
                )

        return corpus

    @classmethod
    def retrieve_passages(
        cls,
        db: Session,
        organization_id: str,
        query: str,
        top_k: int = 5,
        min_score: float = 0.05,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k relevant passages strictly scoped to the tenant organization.
        Returns:
            List of passage dicts containing:
            - chunk_id
            - document_id
            - document_name
            - page (int or None)
            - section (str)
            - source_type ("document" | "guideline_rule")
            - score (float)
            - snippet (str)
            - text (str)
        """
        corpus = cls.get_searchable_corpus(db, organization_id)
        if not corpus or not query.strip():
            return []

        retriever = BM25Retriever().fit(corpus)
        scored_results = retriever.search(query, top_k=top_k)

        results: List[Dict[str, Any]] = []
        for doc_item, score in scored_results:
            if score < min_score:
                continue

            full_text = doc_item.get("text", "")
            # Generate clean snippet (up to 240 chars)
            if len(full_text) > 240:
                truncated = full_text[:240]
                snippet = (truncated.rsplit(" ", 1)[0] if " " in truncated else truncated) + "..."
            else:
                snippet = full_text

            results.append(
                {
                    "chunk_id": doc_item["chunk_id"],
                    "document_id": doc_item["document_id"],
                    "document_name": doc_item["document_name"],
                    "source_type": doc_item["source_type"],
                    "page": doc_item["page"],
                    "section": doc_item.get("section", f"Page {doc_item['page']}" if doc_item["page"] else "N/A"),
                    "score": round(score, 4),
                    "snippet": snippet,
                    "text": full_text,
                }
            )

        return results
