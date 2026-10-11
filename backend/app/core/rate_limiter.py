import time
import threading
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import HTTPException, Request, Response


class InMemoryRateLimiter:
    """Thread-safe sliding-window in-memory rate limiter per client IP address.

    Protects CPU and memory from denial-of-service and brute-force traffic.
    """

    def __init__(self, enabled: bool = True):
        self._enabled = enabled
        self._lock = threading.Lock()
        # Maps "ip:endpoint" -> list of monotonic timestamps
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_enabled(self) -> bool:
        return self._enabled

    def set_enabled(self, enabled: bool) -> None:
        self._enabled = enabled

    def check_rate_limit(
        self,
        request: Request,
        key: str,
        max_requests: int = 15,
        window_seconds: float = 60.0,
    ) -> None:
        """Enforce rate limit for client IP. Raises HTTPException(429) if exceeded."""
        if not self._enabled:
            return

        client_ip = request.client.host if request.client else "127.0.0.1"
        lookup_key = f"{client_ip}:{key}"
        now = time.monotonic()

        with self._lock:
            timestamps = self._requests[lookup_key]
            # Discard timestamps outside the current window
            cutoff = now - window_seconds
            valid_timestamps = [t for t in timestamps if t > cutoff]
            self._requests[lookup_key] = valid_timestamps

            if len(valid_timestamps) >= max_requests:
                retry_after = int(window_seconds - (now - valid_timestamps[0])) + 1
                raise HTTPException(
                    status_code=429,
                    detail=(
                        f"Too many requests from your IP address for '{key}'. "
                        f"Rate limit is {max_requests} requests per {int(window_seconds)} seconds. "
                        f"Please retry after {retry_after} seconds."
                    ),
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            valid_timestamps.append(now)

    def reset(self) -> None:
        """Clear all rate limiting entries (for testing)."""
        with self._lock:
            self._requests.clear()


# Global rate limiter instance
rate_limiter = InMemoryRateLimiter(enabled=True)
