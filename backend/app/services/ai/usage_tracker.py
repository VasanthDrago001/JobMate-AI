import logging
import threading
from datetime import datetime, timezone
from typing import Tuple

from app.core.config import settings
from app.core.exceptions import AIQuotaExceededError

logger = logging.getLogger("jobmate.ai.usage_tracker")


class DailyUsageTracker:
    """Thread-safe in-memory daily AI request tracker to control operational costs."""

    def __init__(self, daily_budget: int = 50):
        self._lock = threading.Lock()
        self._daily_budget = daily_budget
        self._current_date = self._get_today_utc()
        self._call_count = 0

    @staticmethod
    def _get_today_utc() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _maybe_reset_for_new_day(self) -> None:
        today = self._get_today_utc()
        if today != self._current_date:
            logger.info(
                "Resetting daily AI usage tracker for new day %s (previous: %s, calls: %d)",
                today,
                self._current_date,
                self._call_count,
            )
            self._current_date = today
            self._call_count = 0

    def check_and_increment(self) -> int:
        """Atomically checks daily limit and increments usage counter.

        Raises:
            AIQuotaExceededError: If daily call limit has been reached.

        Returns:
            int: Remaining calls available today after this invocation.
        """
        budget = settings.AI_DAILY_BUDGET_CALLS

        with self._lock:
            self._maybe_reset_for_new_day()

            if self._call_count >= budget:
                logger.warning(
                    "AI daily budget limit reached: %d / %d calls. Rejecting request.",
                    self._call_count,
                    budget,
                )
                raise AIQuotaExceededError(
                    f"Daily AI usage limit of {budget} requests has been reached to protect server costs. "
                    "Rules-based analysis and bullet guidance are still available."
                )

            self._call_count += 1
            remaining = max(0, budget - self._call_count)
            logger.info(
                "AI call allowed. Current daily usage: %d / %d (remaining: %d)",
                self._call_count,
                budget,
                remaining,
            )
            return remaining

    def get_status(self) -> Tuple[int, int, int]:
        """Returns (used_today, daily_budget, remaining_today)."""
        budget = settings.AI_DAILY_BUDGET_CALLS
        with self._lock:
            self._maybe_reset_for_new_day()
            used = self._call_count
            remaining = max(0, budget - used)
            return used, budget, remaining

    def reset(self) -> None:
        """Reset counter (useful for unit testing)."""
        with self._lock:
            self._current_date = self._get_today_utc()
            self._call_count = 0


# Global singleton instance
usage_tracker = DailyUsageTracker()
