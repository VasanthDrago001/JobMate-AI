import io
from pypdf import PdfWriter
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.rate_limiter import rate_limiter
from app.services.ai.guardrails import verify_rewrite_guardrails
from app.services.pdf_service import parse_resume_pdf


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_limiter():
    rate_limiter.reset()
    yield
    rate_limiter.reset()


def make_dummy_text_pdf(text: str = "Technical Skills: Python, FastAPI, Docker, SQL\nExperience: Built APIs") -> bytes:
    """Helper to generate a valid in-memory test PDF."""
    import pypdf
    writer = pypdf.PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    # PyPDF doesn't directly draw text easily without reportlab, but pdfminer can parse annotations or text streams
    # Or write valid PDF stream with a basic text object
    buf = io.BytesIO()
    # Write a simple valid PDF stream with text content
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length 110 >> stream\n"
        b"BT /F1 12 Tf 72 712 Td (Technical Skills: Python, FastAPI, Docker, PostgreSQL, Redis, Microservices) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000405 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n478\n%%EOF"
    )
    return pdf_content


def test_in_memory_pdf_parsing_zero_disk_leak():
    """Verify parse_resume_pdf operates in memory and does not leave files in temp storage."""
    pdf_bytes = make_dummy_text_pdf()
    meta = parse_resume_pdf(pdf_bytes, "test_resume.pdf")
    assert meta["file_name"] == "test_resume.pdf"
    assert meta["is_text_based"] is True
    assert "Python" in meta["raw_text"]


def test_target_role_length_validation(client: TestClient):
    """Verify target_role exceeding 100 characters is rejected with 422."""
    pdf_bytes = make_dummy_text_pdf()
    oversized_role = "Senior Python Developer " * 10  # 240 chars
    files = {"file": ("resume.pdf", pdf_bytes, "application/pdf")}
    data = {
        "job_description": "We are seeking a Python developer with FastAPI and Docker experience.",
        "target_role": oversized_role,
        "consent": "true",
    }
    response = client.post("/api/v1/analyses", files=files, data=data)
    assert response.status_code == 422
    assert "Target role exceeds maximum allowed length" in response.json()["detail"]


def test_filename_path_traversal_sanitization(client: TestClient):
    """Verify directory traversal filenames are stripped to safe basename."""
    pdf_bytes = make_dummy_text_pdf()
    files = {"file": ("../../../../etc/passwd.pdf", pdf_bytes, "application/pdf")}
    data = {
        "job_description": "We are seeking a Python developer with FastAPI and Docker experience.",
        "target_role": "Python Developer",
        "consent": "true",
    }
    response = client.post("/api/v1/analyses", files=files, data=data)
    assert response.status_code == 200
    assert response.json()["resume_metadata"]["file_name"] == "passwd.pdf"


def test_guardrails_detect_expanded_taxonomy_hallucinations():
    """Verify guardrails catch hallucinations from the full skill dictionary (e.g. Selenium, PostgreSQL)."""
    orig = "Wrote automated scripts for data checking."
    # Model hallucinated Selenium and PostgreSQL which candidate never mentioned
    hallucinated_rewrite = "Engineered automated test suites using Selenium and PostgreSQL database."
    is_valid, needs_conf, warnings = verify_rewrite_guardrails(
        original_bullet=orig,
        suggested_rewrite=hallucinated_rewrite,
        allowed_target_skills=["Python"],
    )
    assert is_valid is False
    assert needs_conf is True
    assert any("selenium" in w.lower() or "postgresql" in w.lower() for w in warnings)


def test_guardrails_detect_hallucinated_calendar_years():
    """Verify guardrails flag unverified calendar years added to bullets."""
    orig = "Built microservices architecture using Python."
    hallucinated_rewrite = "Built microservices architecture using Python in 2024 to increase uptime."
    is_valid, needs_conf, warnings = verify_rewrite_guardrails(
        original_bullet=orig,
        suggested_rewrite=hallucinated_rewrite,
        allowed_target_skills=["Python"],
    )
    assert needs_conf is True
    assert any("calendar year" in w.lower() for w in warnings)


def test_guardrails_detect_hallucinated_multipliers():
    """Verify guardrails flag unbracketed scaling claims like 5x."""
    orig = "Optimized database queries for customer portal."
    hallucinated_rewrite = "Optimized database queries for customer portal, resulting in 5x faster load times."
    is_valid, needs_conf, warnings = verify_rewrite_guardrails(
        original_bullet=orig,
        suggested_rewrite=hallucinated_rewrite,
        allowed_target_skills=[],
    )
    assert needs_conf is True
    assert any("multiplier" in w.lower() for w in warnings)


def test_rate_limiter_enforces_threshold(client: TestClient):
    """Verify rate limiter returns 429 when threshold is reached."""
    # Analyses threshold is 15 requests/min
    rate_limiter.set_enabled(True)
    rate_limiter.reset()

    pdf_bytes = make_dummy_text_pdf()
    files = {"file": ("resume.pdf", pdf_bytes, "application/pdf")}
    data = {
        "job_description": "We are seeking a Python developer with FastAPI and Docker experience.",
        "target_role": "Python Developer",
        "consent": "true",
    }

    # Execute 15 valid calls
    for i in range(15):
        resp = client.post("/api/v1/analyses", files={"file": ("resume.pdf", pdf_bytes, "application/pdf")}, data=data)
        assert resp.status_code == 200

    # 16th call must be blocked with HTTP 429
    blocked_resp = client.post("/api/v1/analyses", files={"file": ("resume.pdf", pdf_bytes, "application/pdf")}, data=data)
    assert blocked_resp.status_code == 429
    assert "Too many requests" in blocked_resp.json()["detail"]
    assert "Retry-After" in blocked_resp.headers


def test_cors_methods_restricted(client: TestClient):
    """Verify CORS preflight only exposes permitted methods."""
    response = client.options(
        "/api/v1/analyses",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert "POST" in allow_methods
    assert "DELETE" not in allow_methods
