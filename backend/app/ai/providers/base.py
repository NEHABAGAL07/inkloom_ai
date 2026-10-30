"""
Abstract base class for all AI model providers.
"""
from abc import ABC, abstractmethod
from app.ai.schemas import AIRequest, AIResponse


class ProviderError(Exception):
    """Raised when an online provider encounters an unrecoverable transport or API error."""
    pass


class BaseAIProvider(ABC):
    """Base provider interface."""

    @abstractmethod
    def generate(self, request: AIRequest) -> AIResponse:
        """
        Executes generation against the target model provider.
        Raises ProviderError if the provider call fails, allowing the client to fall back.
        """
        pass

