import logging
import uuid
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.core.exceptions import (
    AIConfigurationError,
    AIError,
    AIQuotaExceededError,
    AITimeoutError,
)
from app.schemas.bullet import BulletImprovementResponse, BulletSuggestion
from app.services.ai.base_adapter import LLMProviderAdapter
from app.services.ai.gemini_adapter import GeminiProviderAdapter
from app.services.ai.guardrails import verify_rewrite_guardrails
from app.services.ai.pii_sanitizer import sanitize_bullets
from app.services.ai.usage_tracker import usage_tracker

logger = logging.getLogger("jobmate.bullet_rewriter")


class BulletRewriterService:
    """Orchestrates privacy sanitization, rate-limited AI generation, guardrail verification,

    and deterministic rules-based fallbacks.
    """

    def __init__(self, adapter: Optional[LLMProviderAdapter] = None):
        self._adapter = adapter or GeminiProviderAdapter()

    def set_adapter(self, adapter: LLMProviderAdapter) -> None:
        """Dynamically inject an alternate adapter (e.g. for testing)."""
        self._adapter = adapter

    @staticmethod
    def generate_rules_based_fallback(
        bullets: List[str],
        target_role: Optional[str] = None,
        target_skills: Optional[List[str]] = None,
    ) -> List[BulletSuggestion]:
        """Generate deterministic, truthful suggestions using Google XYZ and STAR templates

        without calling any external LLM. Guarantees 100% uptime and zero cost.
        """
        suggestions: List[BulletSuggestion] = []
        skills = target_skills or ["target skill"]
        primary_skill = skills[0] if skills else "technical tool"

        templates = [
            (
                "Google XYZ Formula",
                "Engineered and optimized {original_clean}, utilizing {skill} to achieve [quantify metric: e.g., X% decrease in execution time or latency].",
                "Restructured into Google XYZ formula (Accomplished [X], measured by [Y], by doing [Z]).",
            ),
            (
                "STAR Method",
                "Spearheaded implementation of {original_clean} with {skill}, resolving critical blockers and improving team velocity by [insert measurable outcome].",
                "Rephrased using STAR methodology to highlight Task, Action, and verifiable Result.",
            ),
            (
                "Google XYZ Formula",
                "Designed and deployed {original_clean} leveraging {skill}, ensuring high availability and [quantify impact: e.g., zero defect leakage in release].",
                "Emphasized production delivery impact while leaving metric for truthful candidate confirmation.",
            ),
        ]

        for i, raw_bullet in enumerate(bullets):
            clean = raw_bullet.rstrip(".").strip()
            template_idx = i % len(templates)
            framework, tmpl, reason = templates[template_idx]

            rewrite = tmpl.format(original_clean=clean, skill=primary_skill)

            suggestions.append(
                BulletSuggestion(
                    id=f"rule-{uuid.uuid4().hex[:8]}",
                    original_bullet=raw_bullet,
                    suggested_rewrite=rewrite,
                    reason=reason,
                    framework=framework,  # type: ignore
                    targeted_skills=skills[:3],
                    needs_confirmation=True,
                    confirmation_prompt=(
                        "Please replace the bracketed placeholder with your actual production metric or defect count."
                    ),
                )
            )

        return suggestions

    async def improve_bullets(
        self,
        bullets: List[str],
        target_role: Optional[str] = None,
        target_skills: Optional[List[str]] = None,
        allow_fallback: bool = True,
    ) -> BulletImprovementResponse:
        """Improve candidate resume bullets with strict privacy, rate limiting, and truthfulness.

        Args:
            bullets: Raw candidate bullet points (max 3).
            target_role: Optional target job role.
            target_skills: Optional list of target technical skills.
            allow_fallback: If True, returns rules-based suggestions on any AI failure instead of raising.

        Returns:
            BulletImprovementResponse with validated suggestions.
        """
        # 1. Enforce input bounds and PII sanitization
        max_bullets = settings.AI_MAX_BULLETS_PER_REQUEST
        sanitized = sanitize_bullets(
            bullets,
            max_bullets=max_bullets,
            max_length=settings.AI_MAX_BULLET_CHARS,
        )

        if not sanitized:
            return BulletImprovementResponse(
                suggestions=[],
                model_used="none",
                usage_remaining_today=usage_tracker.get_status()[2],
                is_fallback=True,
            )

        skills = target_skills or []

        # 2. Check if AI is enabled and configured
        if not settings.AI_ENABLED or not self._adapter.is_configured():
            logger.info("AI is disabled or unconfigured. Employing deterministic rules-based fallback.")
            if not allow_fallback:
                raise AIConfigurationError("AI provider is not configured.")
            fallback_suggestions = self.generate_rules_based_fallback(sanitized, target_role, skills)
            return BulletImprovementResponse(
                suggestions=fallback_suggestions,
                model_used="rules-engine-deterministic",
                usage_remaining_today=usage_tracker.get_status()[2],
                is_fallback=True,
            )

        # 3. Check and increment daily usage budget atomically
        try:
            remaining = usage_tracker.check_and_increment()
        except AIQuotaExceededError as q_err:
            logger.warning("Daily AI budget exceeded: %s", q_err)
            if not allow_fallback:
                raise
            fallback_suggestions = self.generate_rules_based_fallback(sanitized, target_role, skills)
            return BulletImprovementResponse(
                suggestions=fallback_suggestions,
                model_used="rules-engine-deterministic",
                usage_remaining_today=0,
                is_fallback=True,
            )

        # 4. Invoke Provider Adapter with finite timeout and error handling
        try:
            raw_results = await self._adapter.generate_bullet_improvements(
                bullets=sanitized,
                target_role=target_role,
                target_skills=skills,
            )

            # 5. Apply Anti-Hallucination Guardrails to every output suggestion
            validated_suggestions: List[BulletSuggestion] = []
            for item in raw_results:
                orig = item["original_bullet"]
                rewrite = item["suggested_rewrite"]

                is_valid, needs_conf, warnings = verify_rewrite_guardrails(
                    original_bullet=orig,
                    suggested_rewrite=rewrite,
                    allowed_target_skills=skills,
                )

                # If rewrite injected unauthorized tech stacks, trigger clean fallback for that bullet
                if not is_valid:
                    logger.warning("Guardrail flagged hallucination in rewrite: %s. Using safe template.", warnings)
                    safe_replacement = self.generate_rules_based_fallback([orig], target_role, skills)[0]
                    validated_suggestions.append(safe_replacement)
                    continue

                # Ensure confirmation is required if warnings were detected
                final_needs_conf = item["needs_confirmation"] or needs_conf
                conf_prompt = item.get("confirmation_prompt")
                if final_needs_conf and not conf_prompt:
                    conf_prompt = "Please verify that all mentioned metrics and achievements reflect your actual work."

                validated_suggestions.append(
                    BulletSuggestion(
                        id=item.get("id", f"sug-{uuid.uuid4().hex[:8]}"),
                        original_bullet=orig,
                        suggested_rewrite=rewrite,
                        reason=item.get("reason", "Clarified technical action verbs and impact structure."),
                        framework=item.get("framework", "Google XYZ Formula"),
                        targeted_skills=item.get("targeted_skills", skills),
                        needs_confirmation=final_needs_conf,
                        confirmation_prompt=conf_prompt,
                    )
                )

            return BulletImprovementResponse(
                suggestions=validated_suggestions,
                model_used=self._adapter.get_model_name(),
                usage_remaining_today=remaining,
                is_fallback=False,
            )

        except (AIError, Exception) as err:
            logger.error("AI Provider failed: %s. Fallback allowed: %s", err, allow_fallback)
            if not allow_fallback:
                raise

            fallback_suggestions = self.generate_rules_based_fallback(sanitized, target_role, skills)
            return BulletImprovementResponse(
                suggestions=fallback_suggestions,
                model_used="rules-engine-deterministic",
                usage_remaining_today=remaining,
                is_fallback=True,
            )


# Global service singleton
bullet_rewriter_service = BulletRewriterService()
