import logging
import threading
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.schemas.job_finder import (
    JobListing,
    JobSearchFilter,
    JobSearchResponse,
    SkillMatchEvidence,
)
from app.services.job_search.adzuna_adapter import AdzunaJobAdapter
from app.services.job_search.curated_provider import CuratedIndianTechJobProvider
from app.services.job_search.greenhouse_adapter import GreenhouseJobAdapter
from app.services.matching_service import matching_engine

logger = logging.getLogger("jobmate.job_service")


class JobFinderService:
    """Orchestrates job discovery from authorized sources, evaluates skill alignment

    against candidate resume evidence, and caches results.
    """

    def __init__(self):
        self._adzuna = AdzunaJobAdapter()
        self._greenhouse = GreenhouseJobAdapter()
        self._curated = CuratedIndianTechJobProvider()

        # Thread-safe in-memory cache: key -> (timestamp, List[Dict[str, Any]])
        self._cache_lock = threading.Lock()
        self._cache: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}

    def _get_cache_key(self, query: JobSearchFilter) -> str:
        return f"{query.role.strip().lower()}:{query.location.strip().lower()}:{query.work_mode}:{query.experience_level}"

    def _get_from_cache(self, key: str) -> Optional[List[Dict[str, Any]]]:
        ttl = settings.JOB_CACHE_TTL_SECONDS
        now = time.monotonic()
        with self._cache_lock:
            if key in self._cache:
                timestamp, items = self._cache[key]
                if now - timestamp < ttl:
                    return items
                else:
                    del self._cache[key]
        return None

    def _save_to_cache(self, key: str, items: List[Dict[str, Any]]) -> None:
        with self._cache_lock:
            self._cache[key] = (time.monotonic(), items)

    def clear_cache(self) -> None:
        """Clear cache entries (useful in unit testing)."""
        with self._cache_lock:
            self._cache.clear()

    async def _fetch_raw_listings(self, query: JobSearchFilter) -> Tuple[List[Dict[str, Any]], bool]:
        """Fetch raw listings from configured providers or cache."""
        cache_key = self._get_cache_key(query)
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached, True

        raw_items: List[Dict[str, Any]] = []

        # 1. Try Adzuna if configured
        if self._adzuna.is_configured():
            adzuna_jobs = await self._adzuna.fetch_jobs(query)
            raw_items.extend(adzuna_jobs)

        # 2. Query public Greenhouse boards for tech positions
        gh_jobs = await self._greenhouse.fetch_jobs(query)
        raw_items.extend(gh_jobs)

        # 3. If live aggregators returned empty (e.g. dev mode or rate limit), use curated Indian IT listings
        if not raw_items:
            curated_jobs = await self._curated.fetch_jobs(query)
            raw_items.extend(curated_jobs)

        self._save_to_cache(cache_key, raw_items)
        return raw_items, False

    def _compare_skills_for_job(
        self,
        job_snippet: str,
        candidate_skills: List[str],
    ) -> Tuple[float, int, int, List[SkillMatchEvidence], str]:
        """Compare technical requirements in job snippet with candidate's analyzed skills.

        Returns:
            (match_score, matched_count, total_count, breakdown, summary_explanation)
        """
        # Extract requirements from job snippet using deterministic engine
        requirements = matching_engine.extract_requirements(job_snippet)

        if not requirements:
            # Fallback if snippet was very brief
            return (
                50.0,
                0,
                0,
                [],
                "General tech role: Detailed framework requirements not stated in preview snippet.",
            )

        candidate_skills_lower = {s.strip().lower() for s in candidate_skills}
        breakdown: List[SkillMatchEvidence] = []
        matched_count = 0
        total_count = len(requirements)
        matched_names: List[str] = []
        missing_names: List[str] = []

        for req in requirements:
            req_name = req.canonical_name
            # Check direct match or aliases
            is_matched = False
            for term in [req.canonical_name] + req.aliases:
                if term.lower() in candidate_skills_lower:
                    is_matched = True
                    break

            if is_matched:
                matched_count += 1
                matched_names.append(req_name)
                breakdown.append(
                    SkillMatchEvidence(
                        skill_name=req_name,
                        status="matched",
                        resume_evidence_snippet=f"Verified skill '{req_name}' present in your analyzed resume profile.",
                        importance="Required",
                    )
                )
            else:
                # Check related skills
                is_partial = any(rel.lower() in candidate_skills_lower for rel in req.related_skills)
                if is_partial:
                    breakdown.append(
                        SkillMatchEvidence(
                            skill_name=req_name,
                            status="partial",
                            resume_evidence_snippet=f"Related foundation present in your resume.",
                            importance="Preferred",
                        )
                    )
                else:
                    missing_names.append(req_name)
                    breakdown.append(
                        SkillMatchEvidence(
                            skill_name=req_name,
                            status="missing",
                            resume_evidence_snippet=None,
                            importance="Required",
                        )
                    )

        # Transparent percentage calculation
        match_score = round((matched_count / total_count) * 100, 1) if total_count > 0 else 0.0

        if match_score >= 80:
            summary = (
                f"High Skill Alignment ({int(match_score)}%): You match {matched_count} of {total_count} "
                f"detected requirements ({', '.join(matched_names[:4])})."
            )
        elif match_score >= 50:
            summary = (
                f"Moderate Alignment ({int(match_score)}%): Matches {matched_count} requirements ({', '.join(matched_names[:3])}). "
                f"Missing: {', '.join(missing_names[:3])}."
            )
        else:
            summary = (
                f"Partial Overlap ({int(match_score)}%): Matches {matched_count} of {total_count} requirements. "
                f"Consider gaining experience in {', '.join(missing_names[:3])}."
            )

        return match_score, matched_count, total_count, breakdown, summary

    async def search_jobs(self, query: JobSearchFilter) -> JobSearchResponse:
        """Search legitimate job sources, evaluate candidate skill fit, and return ranked results."""
        raw_items, is_cached = await self._fetch_raw_listings(query)

        # Filter out expired listings (e.g. posted > 60 days ago if date available)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=60)
        active_items: List[Dict[str, Any]] = []

        for item in raw_items:
            p_date = item.get("posting_date")
            if p_date and p_date < cutoff_date:
                continue
            active_items.append(item)

        # Evaluate skill alignment for each active listing
        evaluated_listings: List[JobListing] = []

        for item in active_items:
            score, matched_c, total_c, breakdown, explanation = self._compare_skills_for_job(
                job_snippet=item.get("description_snippet", ""),
                candidate_skills=query.candidate_skills,
            )

            evaluated_listings.append(
                JobListing(
                    id=item["id"],
                    source=item["source"],
                    title=item["title"],
                    company_name=item["company_name"],
                    company_logo_url=item.get("company_logo_url"),
                    location=item["location"],
                    work_mode=item.get("work_mode", "Not Specified"),
                    salary_display=item.get("salary_display", "Salary not disclosed"),
                    description_snippet=item["description_snippet"],
                    posting_date=item.get("posting_date"),
                    last_verified_at=item.get("last_verified_at", datetime.now(timezone.utc)),
                    application_url=item["application_url"],
                    match_score_percentage=score,
                    matched_skills_count=matched_c,
                    total_required_skills_count=total_c,
                    skills_breakdown=breakdown,
                    match_summary_explanation=explanation,
                    is_expired=False,
                )
            )

        # Rank by match score percentage descending (highest alignment first)
        evaluated_listings.sort(key=lambda j: j.match_score_percentage, reverse=True)

        # Pagination slice
        total_found = len(evaluated_listings)
        start_idx = (query.page - 1) * query.page_size
        end_idx = start_idx + query.page_size
        paged_results = evaluated_listings[start_idx:end_idx]
        has_more = end_idx < total_found

        return JobSearchResponse(
            results=paged_results,
            total_matches_found=total_found,
            current_page=query.page,
            has_more=has_more,
            source_attribution="Job listings powered by Adzuna API and verified official career boards.",
            attribution_logo_url="https://static.adzuna.com/badges/adzuna-logo.png",
            cached=is_cached,
        )


# Global singleton service
job_finder_service = JobFinderService()
