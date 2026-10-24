"""
Abstract Copilot Service Interfaces
Defines abstract contracts for future implementation of:
1. Advanced Content Audit Engine
2. Marketing Copilot
3. Designer Copilot
4. Legal Research & Compliance Copilot

Core Security Rule:
None of these copilot services automatically approve content or bypass backend RBAC.
Human sign-off and server authorization remain authoritative.
"""
from abc import ABC, abstractmethod
from app.schemas.ai_context import SharedAIContext
from app.schemas.copilot_contracts import (
    AuditExecutionRequest,
    AuditExecutionResponse,
    MarketingCopilotRequest,
    MarketingCopilotResponse,
    DesignerCopilotRequest,
    DesignerCopilotResponse,
    LegalCopilotRequest,
    LegalCopilotResponse,
)


class BaseAuditEngine(ABC):
    """Abstract interface for advanced content audit execution using SharedAIContext."""

    @abstractmethod
    def execute_audit(
        self, request: AuditExecutionRequest, context: SharedAIContext
    ) -> AuditExecutionResponse:
        """Executes full multi-modal and textual governance audit against unified knowledge context."""
        pass


class BaseMarketingCopilot(ABC):
    """Abstract interface for marketing content generation grounded in verified facts and brand voice."""

    @abstractmethod
    def generate_marketing_suggestion(
        self, request: MarketingCopilotRequest, context: SharedAIContext
    ) -> MarketingCopilotResponse:
        """Generates brand-compliant copy referencing only verified facts and registered benchmarks."""
        pass


class BaseDesignerCopilot(ABC):
    """Abstract interface for designer guidance on typography, palettes, assets, and contrast."""

    @abstractmethod
    def generate_design_guidance(
        self, request: DesignerCopilotRequest, context: SharedAIContext
    ) -> DesignerCopilotResponse:
        """Evaluates visual hierarchy, color systems, and mandatory WCAG 2.1 AA accessibility ratios."""
        pass


class BaseLegalCopilot(ABC):
    """Abstract interface for legal compliance research, statute citations, and conflict detection."""

    @abstractmethod
    def conduct_compliance_research(
        self, request: LegalCopilotRequest, context: SharedAIContext
    ) -> LegalCopilotResponse:
        """Surfaces applicable statutes, regulatory circulars, and potential priority hierarchy conflicts."""
        pass
