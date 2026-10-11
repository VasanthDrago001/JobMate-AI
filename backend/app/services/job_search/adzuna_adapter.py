import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.schemas.job_finder import JobSearchFilter
from app.services.job_search.base import BaseJobProviderAdapter

logger = logging.getLogger("jobmate.job_search.adzuna")

ADZUNA_API_BASE = "https://api.adzuna.com/v1/api/jobs/in/search"


class AdzunaJobAdapter(BaseJobProviderAdapter):
    """Adapter for official Adzuna India Developer API."""

    def __init__(
        self,
        app_id: Optional[str] = None,
        app_key: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self._app_id = app_id or settings.ADZUNA_APP_ID.strip()
        self._app_key = app_key or settings.ADZUNA_APP_KEY.strip()
        self._timeout = timeout_seconds or settings.JOB_SEARCH_REQUEST_TIMEOUT_SECONDS

    def get_source_name(self) -> str:
        return "adzuna"

    def is_configured(self) -> bool:
        return bool(self._app_id and self._app_key)

    async def fetch_jobs(self, query: JobSearchFilter) -> List[Dict[str, Any]]:
        """Query Adzuna India endpoint for real IT job vacancies."""
        if not self.is_configured():
            logger.info("Adzuna API credentials not configured in backend environment.")
            return []

        # Adzuna uses 1-indexed page path
        page = max(1, query.page)
        url = f"{ADZUNA_API_BASE}/{page}"

        # Construct query params
        params: Dict[str, Any] = {
            "app_id": self._app_id,
            "app_key": self._app_key,
            "results_per_page": query.page_size,
            "what": query.role,
            "category": "it-jobs",
            "content-type": "application/json",
        }

        # Handle location
        loc = query.location.strip()
        if loc and loc.lower() not in ("all", "all india", "any", "india"):
            params["where"] = loc

        # Handle work mode
        if query.work_mode == "remote":
            params["what"] = f"{query.role} remote"

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(url, params=params)

            if response.status_code == 429:
                logger.warning("Adzuna API rate limit exceeded (HTTP 429).")
                return []
            elif response.status_code != 200:
                logger.warning(
                    "Adzuna API error response: HTTP %s - %s",
                    response.status_code,
                    response.text[:120],
                )
                return []

            data = response.json()
            raw_results = data.get("results", [])
            normalized: List[Dict[str, Any]] = []

            for item in raw_results:
                salary_min = item.get("salary_min")
                salary_max = item.get("salary_max")
                if salary_min and salary_max:
                    salary_display = f"₹{int(salary_min):,} - ₹{int(salary_max):,} / yr"
                elif salary_min:
                    salary_display = f"From ₹{int(salary_min):,} / yr"
                else:
                    salary_display = "Salary not disclosed"

                # Parse created timestamp
                created_str = item.get("created")
                posting_date: Optional[datetime] = None
                if created_str:
                    try:
                        posting_date = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                    except Exception:
                        pass

                # Work mode detection
                title_desc = f"{item.get('title', '')} {item.get('description', '')}".lower()
                if "remote" in title_desc or "work from home" in title_desc:
                    work_mode = "Remote"
                elif "hybrid" in title_desc:
                    work_mode = "Hybrid"
                else:
                    work_mode = "On-site"

                location_name = item.get("location", {}).get("display_name", loc or "India")

                normalized.append({
                    "id": f"adzuna-{item.get('id', '')}",
                    "source": "adzuna",
                    "title": item.get("title", query.role),
                    "company_name": item.get("company", {}).get("display_name", "Technology Employer"),
                    "company_logo_url": None,
                    "location": location_name,
                    "work_mode": work_mode,
                    "salary_display": salary_display,
                    "description_snippet": item.get("description", ""),
                    "posting_date": posting_date,
                    "last_verified_at": datetime.now(timezone.utc),
                    "application_url": item.get("redirect_url", "https://www.adzuna.in"),
                    "is_expired": False,
                })

            return normalized

        except httpx.TimeoutException:
            logger.warning("Adzuna API request timed out after %ss", self._timeout)
            return []
        except Exception as e:
            logger.error("Failed to query Adzuna API: %s", e)
            return []
