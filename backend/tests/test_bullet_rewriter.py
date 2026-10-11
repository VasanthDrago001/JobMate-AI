import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.exceptions import (
    AIConfigurationError,
    AIProviderUnavailableError,
    AIQuotaExceededError,
    AITimeoutError,
)
from app.main import app
from app.schemas.bullet import BulletImprovementRequest
from app.services.ai.guardrails import verify_rewrite_guardrails
from app.services.ai.mock_adapter import MockProviderAdapter
from app.services.ai.pii_sanitizer import sanitize_bullet_text, sanitize_bullets
from app.services.ai.usage_tracker import usage_tracker
from app.services.bullet_rewriter_service import BulletRewriterService

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_daily_tracker():
    """Ensure daily tracker is reset before each test."""
    usage_tracker.reset()
    yield
    usage_tracker.reset()


# ==============================================================================
# 1. PII Sanitization & Untrusted Data Tests
# ==============================================================================


def test_pii_sanitizer_redacts_sensitive_info():
    """Verify that email addresses, phone numbers, and URLs are stripped from bullet text."""
    raw_bullet = (
        "Contact me at vasanth@example.com or +91 9876543210. "
        "Built internal tools on https://github.com/myrepo using Python."
    )
    sanitized = sanitize_bullet_text(raw_bullet, max_length=400)

    assert "[REDACTED_EMAIL]" in sanitized
    assert "vasanth@example.com" not in sanitized
    assert "[REDACTED_PHONE]" in sanitized
    assert "9876543210" not in sanitized
    assert "[REDACTED_LINK]" in sanitized
    assert "https://github.com" not in sanitized


def test_pii_sanitizer_enforces_length_bound():
    """Verify that bullets exceeding max_length are truncated."""
    long_bullet = "A" * 600
    sanitized = sanitize_bullet_text(long_bullet, max_length=400)
    assert len(sanitized) == 400


def test_sanitize_bullets_limits_count():
    """Verify that list is limited to max_bullets."""
    bullets = ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"]
    result = sanitize_bullets(bullets, max_bullets=3)
    assert len(result) == 3


# ==============================================================================
# 2. Anti-Hallucination & Fabricated Facts Guardrail Tests
# ==============================================================================


def test_guardrail_catches_unauthorized_injected_technologies():
    """Verify that guardrail rejects rewrites that inject unmentioned technologies."""
    original = "Developed API services in Python."
    # Hallucinated rewrite injecting Kafka and Rust
    hallucinated_rewrite = "Architected high-throughput Kafka streaming pipelines and Rust microservices."

    is_valid, needs_conf, warnings = verify_rewrite_guardrails(
        original_bullet=original,
        suggested_rewrite=hallucinated_rewrite,
        allowed_target_skills=["Python", "FastAPI"],
    )

    assert is_valid is False
    assert needs_conf is True
    assert any("kafka" in w.lower() or "rust" in w.lower() for w in warnings)


def test_guardrail_requires_confirmation_for_bracketed_placeholders():
    """Verify that bracketed placeholder metrics properly set needs_confirmation=True."""
    original = "Optimized database queries."
    rewrite = "Optimized relational database queries, reducing latency by [quantify: e.g., 25%]."

    is_valid, needs_conf, warnings = verify_rewrite_guardrails(
        original_bullet=original,
        suggested_rewrite=rewrite,
        allowed_target_skills=["PostgreSQL"],
    )

    assert is_valid is True
    assert needs_conf is True
    assert any("bracketed placeholder" in w.lower() for w in warnings)


def test_guardrail_requires_confirmation_for_invented_percentages():
    """Verify that unbracketed concrete percentages where original had none require confirmation."""
    original = "Worked on website speed."
    # Hallucinated percentage 42%
    rewrite = "Enhanced caching layers, accelerating page load speeds by 42%."

    is_valid, needs_conf, warnings = verify_rewrite_guardrails(
        original_bullet=original,
        suggested_rewrite=rewrite,
        allowed_target_skills=["Redis"],
    )

    assert needs_conf is True
    assert any("unbracketed percentage" in w.lower() for w in warnings)


# ==============================================================================
# 3. Provider Error Handling & Graceful Fallback Tests
# ==============================================================================


@pytest.mark.asyncio
async def test_fallback_on_provider_quota_error():
    """Verify that provider 429 quota error gracefully returns rules-based suggestions."""
    mock_adapter = MockProviderAdapter(simulate_error="quota")
    service = BulletRewriterService(adapter=mock_adapter)

    response = await service.improve_bullets(
        bullets=["Built microservices using Python."],
        target_skills=["Python", "FastAPI"],
        allow_fallback=True,
    )

    assert response.is_fallback is True
    assert response.model_used == "rules-engine-deterministic"
    assert len(response.suggestions) == 1
    assert response.suggestions[0].needs_confirmation is True
    assert "Google XYZ" in response.suggestions[0].framework or "STAR" in response.suggestions[0].framework


@pytest.mark.asyncio
async def test_fallback_on_provider_timeout_error():
    """Verify that provider timeout gracefully returns rules-based suggestions without crashing."""
    mock_adapter = MockProviderAdapter(simulate_error="timeout")
    service = BulletRewriterService(adapter=mock_adapter)

    response = await service.improve_bullets(
        bullets=["Automated regression testing using Selenium."],
        target_skills=["Selenium", "Test Automation"],
        allow_fallback=True,
    )

    assert response.is_fallback is True
    assert response.model_used == "rules-engine-deterministic"
    assert len(response.suggestions) == 1


@pytest.mark.asyncio
async def test_fallback_on_provider_outage_error():
    """Verify that provider 503 outage gracefully returns rules-based suggestions."""
    mock_adapter = MockProviderAdapter(simulate_error="outage")
    service = BulletRewriterService(adapter=mock_adapter)

    response = await service.improve_bullets(
        bullets=["Built web applications in PHP and Laravel."],
        target_skills=["PHP", "Laravel"],
        allow_fallback=True,
    )

    assert response.is_fallback is True
    assert response.model_used == "rules-engine-deterministic"
    assert len(response.suggestions) == 1


@pytest.mark.asyncio
async def test_fallback_on_malformed_json_response():
    """Verify that unparseable JSON from provider triggers safe fallback."""
    mock_adapter = MockProviderAdapter(simulate_malformed_json=True)
    service = BulletRewriterService(adapter=mock_adapter)

    response = await service.improve_bullets(
        bullets=["Integrated third-party payment gateways."],
        target_skills=["Python"],
        allow_fallback=True,
    )

    assert response.is_fallback is True
    assert len(response.suggestions) == 1


# ==============================================================================
# 4. Daily AI Usage Budget & Cost Control Tests
# ==============================================================================


@pytest.mark.asyncio
async def test_daily_ai_budget_limit_enforcement():
    """Verify that reaching the daily usage budget prevents further LLM calls and activates fallback."""
    mock_adapter = MockProviderAdapter()
    service = BulletRewriterService(adapter=mock_adapter)

    # Exhaust the configured budget
    budget = settings.AI_DAILY_BUDGET_CALLS
    for _ in range(budget):
        usage_tracker.check_and_increment()

    # Next call should be refused and fall back to rules-based engine
    response = await service.improve_bullets(
        bullets=["Developed REST APIs in Python."],
        target_skills=["Python"],
        allow_fallback=True,
    )

    assert response.is_fallback is True
    assert response.model_used == "rules-engine-deterministic"
    assert response.usage_remaining_today == 0


# ==============================================================================
# 5. API Endpoint Tests (POST /api/v1/bullets/improve)
# ==============================================================================


def test_api_bullets_improve_success():
    """Verify successful response from POST /api/v1/bullets/improve."""
    payload = {
        "bullets": [
            "Developed REST APIs in Python using FastAPI.",
            "Optimized query performance on PostgreSQL.",
        ],
        "target_role": "Senior Python Engineer",
        "target_skills": ["Python", "FastAPI", "PostgreSQL"],
    }
    response = client.post("/api/v1/bullets/improve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "suggestions" in data
    assert len(data["suggestions"]) == 2
    for item in data["suggestions"]:
        assert "original_bullet" in item
        assert "suggested_rewrite" in item
        assert "reason" in item
        assert "framework" in item
        assert "needs_confirmation" in item
    assert "disclaimer" in data
    assert "guarantee" not in data["disclaimer"].lower() or "not guarantee" in data["disclaimer"].lower()


def test_api_bullets_reject_more_than_three_bullets():
    """Verify that sending more than 3 bullets returns HTTP 422."""
    payload = {
        "bullets": [
            "Bullet 1",
            "Bullet 2",
            "Bullet 3",
            "Bullet 4",
        ],
        "target_role": "Python Developer",
    }
    response = client.post("/api/v1/bullets/improve", json=payload)
    assert response.status_code == 422


def test_api_bullets_reject_empty_bullets_list():
    """Verify that sending empty bullets list returns HTTP 422."""
    payload = {
        "bullets": [],
        "target_role": "Python Developer",
    }
    response = client.post("/api/v1/bullets/improve", json=payload)
    assert response.status_code == 422
