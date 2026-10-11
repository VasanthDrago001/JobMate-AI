from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class LLMProviderAdapter(ABC):
    """Abstract adapter interface decoupling AI provider implementations from business logic."""

    @abstractmethod
    async def generate_bullet_improvements(
        self,
        bullets: List[str],
        target_role: Optional[str] = None,
        target_skills: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Generate structured truthful bullet rewrites for candidate bullets.

        Args:
            bullets: List of sanitized candidate bullet strings (max 3).
            target_role: Optional target role or job title.
            target_skills: Optional list of target technical skills.

        Returns:
            List of dictionaries matching the BulletSuggestion schema.

        Raises:
            AITimeoutError: On request timeout.
            AIQuotaExceededError: On provider HTTP 429 quota exhaustion.
            AIProviderUnavailableError: On provider outage or 5xx response.
            AIResponseValidationError: If provider returns non-JSON or invalid schema.
        """
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Return the name or identifier of the active model."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if required API credentials and settings are present."""
        pass
