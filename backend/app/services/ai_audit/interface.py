"""AI Brand Governance Audit Service Interface.

Defines the core contract for text auditing across deterministic rules and LLM adapters.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.audit import AuditResultSchema, BrandAuditFinding


class BaseAuditService(ABC):
    """Abstract base class for brand compliance auditing."""

    @abstractmethod
    def audit_text(
        self,
        content: str,
        guidelines: Optional[List[Dict[str, Any]]] = None,
        verified_facts: Optional[List[Dict[str, Any]]] = None,
        content_id: Optional[str] = None,
        audit_id: Optional[str] = None,
    ) -> AuditResultSchema:
        """
        Audit textual content against configured brand guidelines and verified facts.
        
        Args:
            content: Raw textual content to inspect.
            guidelines: List of brand guidelines and rules to enforce.
            verified_facts: Approved factual claims and knowledge sources.
            content_id: Identifier of the content item.
            audit_id: Optional explicit audit run ID.
            
        Returns:
            Validated AuditResultSchema conforming to brand governance standards.
        """
        pass
