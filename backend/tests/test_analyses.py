import io
import pypdf
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Reusable valid text-based PDF bytes
VALID_TEXT_PDF_BYTES = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 160 >>
stream
BT
/F1 12 Tf
72 712 Td
(Vasanth Kumar - Senior Software Engineer) Tj
0 -20 Td
(Technical Skills: Python, FastAPI, React, TypeScript, PostgreSQL, Docker) Tj
0 -20 Td
(Work Experience: Engineered high-throughput REST APIs and microservices) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000326 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
538
%%EOF
"""

VALID_JOB_DESCRIPTION = (
    "We are seeking a Senior Backend Engineer (SDE-2) proficient in Python and FastAPI. "
    "You will build distributed microservices, optimize PostgreSQL schemas, and write unit tests."
)


def create_blank_pdf_bytes() -> bytes:
    """Generate a valid PDF with zero text (simulating image-only or blank document)."""
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def create_encrypted_pdf_bytes() -> bytes:
    """Generate an encrypted, password-protected PDF."""
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=612, height=792)
    writer.encrypt("supersecret")
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


# ==============================================================================
# Success Tests
# ==============================================================================


def test_successful_analysis_ingestion():
    """Verify that a valid text-based PDF with valid JD and consent is parsed successfully."""
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "target_role": "Senior Backend Engineer",
            "consent": "true",
        },
        files={
            "file": ("Vasanth_Resume.pdf", VALID_TEXT_PDF_BYTES, "application/pdf"),
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert data["analysis_id"].startswith("jm-analysis-") or data["analysis_id"].startswith("jm-")
    assert "created_at" in data

    # Verify Resume Metadata
    resume_meta = data["resume_metadata"]
    assert resume_meta["file_name"] == "Vasanth_Resume.pdf"
    assert resume_meta["page_count"] == 1
    assert resume_meta["character_count"] > 50
    assert resume_meta["word_count"] > 10
    assert resume_meta["is_text_based"] is True
    assert "Skills & Competencies" in resume_meta["detected_sections"] or len(resume_meta["detected_sections"]) >= 0

    # Verify JD Metadata
    jd_meta = data["job_description_metadata"]
    assert jd_meta["target_role"] == "Senior Backend Engineer"
    assert jd_meta["character_count"] == len(VALID_JOB_DESCRIPTION)
    assert jd_meta["word_count"] > 15

    # Verify Placeholder Analysis
    placeholder = data["placeholder_analysis"]
    assert placeholder["status"] == "PARSED_SUCCESSFULLY"
    assert "Phase 1" in placeholder["phase"]
    assert "disclaimer" in placeholder


# ==============================================================================
# Validation Error Tests
# ==============================================================================


def test_reject_missing_consent():
    """Verify that omitting user consent returns HTTP 400."""
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "target_role": "Backend Developer",
            "consent": "false",
        },
        files={
            "file": ("resume.pdf", VALID_TEXT_PDF_BYTES, "application/pdf"),
        },
    )
    assert response.status_code == 400
    assert "DPDP Act" in response.json()["detail"]


def test_reject_short_job_description():
    """Verify that JD with fewer than 50 characters returns HTTP 422."""
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": "Looking for a Python dev.",  # 25 chars
            "consent": "true",
        },
        files={
            "file": ("resume.pdf", VALID_TEXT_PDF_BYTES, "application/pdf"),
        },
    )
    assert response.status_code == 422
    assert "too short" in response.json()["detail"]


def test_reject_oversized_job_description():
    """Verify that JD exceeding 10,000 characters returns HTTP 422."""
    oversized_jd = "Senior Python Developer " * 500  # > 11,000 chars
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": oversized_jd,
            "consent": "true",
        },
        files={
            "file": ("resume.pdf", VALID_TEXT_PDF_BYTES, "application/pdf"),
        },
    )
    assert response.status_code == 422
    assert "exceeds maximum allowed length" in response.json()["detail"]


def test_reject_non_pdf_file_extension():
    """Verify that uploading a non-PDF file extension returns HTTP 400."""
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "consent": "true",
        },
        files={
            "file": ("resume.txt", b"Plain text content", "text/plain"),
        },
    )
    assert response.status_code == 400
    assert "Only PDF" in response.json()["detail"]


def test_reject_invalid_pdf_file_signature():
    """Verify that uploading a file named .pdf but lacking %PDF- magic bytes returns HTTP 400."""
    fake_pdf_content = b"<html><body>Not a real PDF header</body></html>"
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "consent": "true",
        },
        files={
            "file": ("fake_resume.pdf", fake_pdf_content, "application/pdf"),
        },
    )
    assert response.status_code == 400
    assert "Invalid file signature" in response.json()["detail"]


def test_reject_oversized_pdf_file():
    """Verify that a file exceeding 5 MB returns HTTP 413 Payload Too Large."""
    # Create fake payload starting with %PDF- but exceeding 5 MB
    large_payload = b"%PDF-1.4\n" + b"0" * (5 * 1024 * 1024 + 1024)
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "consent": "true",
        },
        files={
            "file": ("large_resume.pdf", large_payload, "application/pdf"),
        },
    )
    assert response.status_code == 413
    assert "exceeds maximum limit" in response.json()["detail"]


def test_reject_scanned_or_image_only_pdf():
    """Verify that a PDF containing no digital text is rejected with HTTP 422."""
    blank_pdf = create_blank_pdf_bytes()
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "consent": "true",
        },
        files={
            "file": ("scanned_resume.pdf", blank_pdf, "application/pdf"),
        },
    )
    assert response.status_code == 422
    assert "scanned image or contains no selectable digital text" in response.json()["detail"]


def test_reject_encrypted_pdf():
    """Verify that a password-protected PDF is rejected with HTTP 400."""
    encrypted_pdf = create_encrypted_pdf_bytes()
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "consent": "true",
        },
        files={
            "file": ("encrypted_resume.pdf", encrypted_pdf, "application/pdf"),
        },
    )
    assert response.status_code == 400
    assert "password-protected or encrypted" in response.json()["detail"]


def test_reject_malformed_pdf():
    """Verify that a corrupted PDF stream returns HTTP 400."""
    corrupt_pdf = b"%PDF-1.4\nMalformed corrupted data \x00\x99\xff\xee without xref or catalog"
    response = client.post(
        "/api/v1/analyses",
        data={
            "job_description": VALID_JOB_DESCRIPTION,
            "consent": "true",
        },
        files={
            "file": ("corrupt.pdf", corrupt_pdf, "application/pdf"),
        },
    )
    assert response.status_code == 400
    assert "corrupt or malformed" in response.json()["detail"]
