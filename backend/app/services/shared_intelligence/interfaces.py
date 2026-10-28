"""
Copilot Service Interfaces (Phase 1 Foundation)
Defines abstract service protocols for future AI assistants:
1. Advanced Content Audit Engine
2. Marketing Copilot
3. Designer Copilot
4. Legal Research & Compliance Copilot

All interfaces require a verified SharedAIContext and forbid autonomous approvals.
"""
from abc import ABC, abstractmethod
from typing import Optional

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


class BaseCopilotService(ABC):
    """
    Common base class for all AI copilot services.
    Enforces that copilot operations operate strictly within an authenticated,
    tenant-isolated SharedAIContext and never bypass human authority.
    """

    @abstractmethod
    def get_capability_name(self) -> str:
        """Return the unique name of this copilot capability."""
        pass


class ContentAuditEngineInterface(BaseCopilotService):
    """
    Interface for the Advanced Content Audit Engine (Phase 2+).
    Responsible for executing deep multimodal and textual audits against
    active brand rules, verified product facts, and legal requirements.
    """

    def get_capability_name(self) -> str:
        return "content_audit_engine"

    @abstractmethod
    async def execute_audit(
        self,
        request: AuditExecutionRequest,
        context: SharedAIContext,
    ) -> AuditExecutionResponse:
        """
        Execute an automated audit run.
        Must respect human-in-the-loop requirements and never mark content approved automatically.
        """
        pass


class MarketingCopilotInterface(BaseCopilotService):
    """
    Interface for the Marketing Copilot (Phase 2+).
    Assists copywriters and marketing teams in generating high-performing,
    tone-aligned copy strictly grounded in verified facts and brand voice rules.
    """

    def get_capability_name(self) -> str:
        return "marketing_copilot"

    @abstractmethod
    async def generate_marketing_copy(
        self,
        request: MarketingCopilotRequest,
        context: SharedAIContext,
    ) -> MarketingCopilotResponse:
        """
        Generate on-brand copy grounded strictly in verified product claims.
        Flags any unverified claims and requires human review.
        """
        pass


class DesignerCopilotInterface(BaseCopilotService):
    """
    Interface for the Designer Copilot (Phase 2+).
    Assists graphic, web, and product designers with color contrast (WCAG),
    logo safe-space zones, typography hierarchy, and approved asset metadata.
    """

    def get_capability_name(self) -> str:
        return "designer_copilot"

    @abstractmethod
    async def provide_design_guidance(
        self,
        request: DesignerCopilotRequest,
        context: SharedAIContext,
    ) -> DesignerCopilotResponse:
        """
        Evaluate design visual context against brand guidelines and statutory accessibility standards.
        """
        pass


class LegalComplianceCopilotInterface(BaseCopilotService):
    """
    Interface for the Legal Research & Compliance Copilot (Phase 2+).
    Surfaces relevant statutory provisions, regulatory guidance, and company policies.
    Identifies conflicting requirements and generates structured advisory summaries with mandatory disclaimers.
    """

    def get_capability_name(self) -> str:
        return "legal_compliance_copilot"

    @abstractmethod
    async def conduct_compliance_research(
        self,
        request: LegalCopilotRequest,
        context: SharedAIContext,
    ) -> LegalCopilotResponse:
        """
        Analyze proposed marketing claims or content excerpts against applicable legal sources.
        Never resolves legal conflicts autonomously; flags them for human legal counsel review.
        """
        pass
