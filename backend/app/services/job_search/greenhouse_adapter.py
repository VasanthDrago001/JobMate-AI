import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.schemas.job_finder import JobSearchFilter
from app.services.job_search.base import BaseJobProviderAdapter

logger = logging.getLogger("jobmate.job_search.greenhouse")

# Top Indian tech companies with official public Greenhouse boards
CURATED_GREENHOUSE_COMPANIES = {
    "razorpay": "Razorpay",
    "postman": "Postman",
    "browserstack": "BrowserStack",
    "meesho": "Meesho",
    "swiggy": "Swiggy",
}


class GreenhouseJobAdapter(BaseJobProviderAdapter):
    """Adapter for official public Greenhouse career boards."""

    def __init__(self, timeout_seconds: Optional[float] = None):
        """Initialize Greenhouse adapter with configurable request timeout.

        Args:
            timeout_seconds: Optional HTTP request timeout duration in seconds.
        """
        self._timeout = timeout_seconds or settings.JOB_SEARCH_REQUEST_TIMEOUT_SECONDS

    def get_source_name(self) -> str:
        """Returns the canonical provider identifier string."""
        return "greenhouse"

    def is_configured(self) -> bool:
        """Indicates whether provider is operational (always True for public Greenhouse boards)."""
        return True  # Public read-only endpoints require no API key

    async def fetch_jobs(self, query: JobSearchFilter) -> List[Dict[str, Any]]:
        """Query official public Greenhouse job boards for active tech positions matching criteria.

        Args:
            query: JobSearchFilter specifying search criteria.

        Returns:
            List of normalized job dictionary records.
        """
        normalized: List[Dict[str, Any]] = []
        role_lower = query.role.lower()
        role_tokens = set(re.findall(r"\w+", role_lower))

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            for board_token, company_name in CURATED_GREENHOUSE_COMPANIES.items():
                url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"
                try:
                    resp = await client.get(url, params={"content": "true"})
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    jobs = data.get("jobs", [])

                    for j in jobs:
                        title = j.get("title", "")
                        title_lower = title.lower()
                        location_obj = j.get("location", {})
                        location_name = location_obj.get("name", "India") if isinstance(location_obj, dict) else str(location_obj)

                        # Filter by role match (e.g. 'python', 'backend', 'developer', 'qa', 'engineer')
                        if not any(token in title_lower for token in role_tokens) and "engineer" not in title_lower and "developer" not in title_lower:
                            continue

                        # Location filter if specified
                        loc_filter = query.location.strip().lower()
                        if loc_filter and loc_filter not in ("all", "all india", "any", "india"):
                            if loc_filter not in location_name.lower() and "remote" not in location_name.lower():
                                continue

                        # Work mode check
                        work_mode = "Remote" if "remote" in location_name.lower() or "remote" in title_lower else "On-site"
                        if query.work_mode == "remote" and work_mode != "Remote":
                            continue

                        # Extract clean text from HTML content if available
                        raw_content = j.get("content", "")
                        clean_content = re.sub(r"<[^>]+>", " ", raw_content)
                        clean_content = re.sub(r"\s+", " ", clean_content).strip()
                        snippet = clean_content[:400] if clean_content else f"Technical position for {title} at {company_name}."

                        updated_at = j.get("updated_at")
                        posting_date: Optional[datetime] = None
                        if updated_at:
                            try:
                                posting_date = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                            except Exception:
                                pass

                        normalized.append({
                            "id": f"gh-{board_token}-{j.get('id')}",
                            "source": "greenhouse",
                            "title": title,
                            "company_name": company_name,
                            "company_logo_url": None,
                            "location": location_name,
                            "work_mode": work_mode,
                            "salary_display": "Competitive Indian IT Standard",
                            "description_snippet": snippet,
                            "posting_date": posting_date,
                            "last_verified_at": datetime.now(timezone.utc),
                            "application_url": j.get("absolute_url", f"https://boards.greenhouse.io/{board_token}"),
                            "is_expired": False,
                        })

                except Exception as err:
                    logger.debug("Could not fetch Greenhouse board for %s: %s", board_token, err)

        return normalized
