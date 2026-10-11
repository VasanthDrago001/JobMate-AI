import uuid
from typing import Any, Dict, List, Optional

from app.core.exceptions import (
    AIConfigurationError,
    AIError,
    AIProviderUnavailableError,
    AIQuotaExceededError,
    AIResponseValidationError,
    AITimeoutError,
)
from app.services.ai.base_adapter import LLMProviderAdapter


class MockProviderAdapter(LLMProviderAdapter):
    """Deterministic mock provider adapter for tests and offline development."""

    def __init__(
        self,
        simulate_error: Optional[str] = None,
        simulate_hallucination: bool = False,
        simulate_malformed_json: bool = False,
    ):
        self.simulate_error = simulate_error
        self.simulate_hallucination = simulate_hallucination
        self.simulate_malformed_json = simulate_malformed_json
        self.model_name = "mock-gemini-1.5-flash"

    def get_model_name(self) -> str:
        return self.model_name

    def is_configured(self) -> bool:
        return True

    async def generate_bullet_improvements(
        self,
        bullets: List[str],
        target_role: Optional[str] = None,
        target_skills: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        if self.simulate_error == "timeout":
            raise AITimeoutError("Simulated Gemini API timeout.")
        elif self.simulate_error == "quota":
            raise AIQuotaExceededError("Simulated Gemini API quota exceeded (HTTP 429).")
        elif self.simulate_error == "outage":
            raise AIProviderUnavailableError("Simulated Gemini API service outage (HTTP 503).")
        elif self.simulate_error == "invalid_key":
            raise AIConfigurationError("Simulated invalid Gemini API key.")
        elif self.simulate_error == "generic":
            raise AIError("Simulated unknown AI provider failure.")

        if self.simulate_malformed_json:
            raise AIResponseValidationError("Simulated malformed JSON response.")

        suggestions: List[Dict[str, Any]] = []
        skills = target_skills or ["Python"]
        skills_str = ", ".join(skills)

        for b in bullets:
            if self.simulate_hallucination:
                # Deliberately inject hallucinated tech (e.g. Rust, Kafka, Kubernetes) and fake metrics
                rewrite = (
                    f"Architected high-throughput Kafka streaming pipelines and Rust microservices "
                    f"deployed on Kubernetes, reducing cloud spend by 78.4% and handling 5M daily users."
                )
                suggestions.append({
                    "id": f"mock-{uuid.uuid4().hex[:8]}",
                    "original_bullet": b,
                    "suggested_rewrite": rewrite,
                    "reason": "Injected strong metrics and modern technologies.",
                    "framework": "Google XYZ Formula",
                    "targeted_skills": ["Rust", "Kafka", "Kubernetes"],
                    "needs_confirmation": False,  # Model falsely set confirmation to false
                    "confirmation_prompt": None,
                })
            else:
                # Truthful rewrite with bracketed placeholder
                rewrite = (
                    f"Engineered and maintained backend REST endpoints using {skills[0]}, "
                    f"improving service reliability [quantify: e.g., X% reduction in slow queries]."
                )
                suggestions.append({
                    "id": f"mock-{uuid.uuid4().hex[:8]}",
                    "original_bullet": b,
                    "suggested_rewrite": rewrite,
                    "reason": f"Structured using Google XYZ Formula to highlight practical {skills[0]} delivery.",
                    "framework": "Google XYZ Formula",
                    "targeted_skills": skills,
                    "needs_confirmation": True,
                    "confirmation_prompt": "Please confirm the query performance improvement percentage or metric achieved.",
                })

        return suggestions
