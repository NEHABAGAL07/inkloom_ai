"""
Shared Intelligence Package
Provides modular knowledge management, provenance retrieval,
conflict evaluation, and typed AI context assembly.
"""
from app.services.shared_intelligence.service import SharedIntelligenceService
from app.services.shared_intelligence.retrieval import KnowledgeRetriever
from app.services.shared_intelligence.conflict_detector import ConflictDetector

__all__ = [
    "SharedIntelligenceService",
    "KnowledgeRetriever",
    "ConflictDetector",
]
