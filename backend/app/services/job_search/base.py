from abc import ABC, abstractmethod
from typing import Any, Dict, List
from app.schemas.job_finder import JobSearchFilter


class BaseJobProviderAdapter(ABC):
    """Abstract base adapter for legitimate job search data providers."""

    @abstractmethod
    def get_source_name(self) -> str:
        """Returns the canonical name of the provider."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if provider credentials or endpoints are available."""
        pass

    @abstractmethod
    async def fetch_jobs(self, query: JobSearchFilter) -> List[Dict[str, Any]]:
        """Fetch raw job listing dictionaries from the provider."""
        pass
