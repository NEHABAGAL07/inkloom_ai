"""
Shared Intelligence Package
Provides modular knowledge management, provenance retrieval,
conflict evaluation, typed AI context assembly, tool registry, and intelligent orchestration.
"""
from app.services.shared_intelligence.service import SharedIntelligenceService
from app.services.shared_intelligence.retrieval import KnowledgeRetriever
from app.services.shared_intelligence.conflict_detector import ConflictDetector
from app.services.shared_intelligence.tool_registry import tool_registry, ToolRegistry
from app.services.shared_intelligence.orchestration import SharedIntelligenceEngine
from app.services.shared_intelligence.interfaces import (
    BaseCopilotService,
    ContentAuditEngineInterface,
    MarketingCopilotInterface,
    DesignerCopilotInterface,
    LegalComplianceCopilotInterface,
)

__all__ = [
    "SharedIntelligenceService",
    "KnowledgeRetriever",
    "ConflictDetector",
    "ToolRegistry",
    "tool_registry",
    "SharedIntelligenceEngine",
    "BaseCopilotService",
    "ContentAuditEngineInterface",
    "MarketingCopilotInterface",
    "DesignerCopilotInterface",
    "LegalComplianceCopilotInterface",
]
