import io
import logging
import os
import re
import time
from typing import Any, Dict, List

import pdfplumber
import pypdf
from app.core.config import settings
from app.core.exceptions import (
    PDFEmptyError,
    PDFEncryptedError,
    PDFMalformedError,
    PDFPageLimitExceededError,
    PDFScannedImageError,
    PDFSizeLimitExceededError,
    PDFValidationError,
)

logger = logging.getLogger("jobmate.pdf_service")

# Standard resume section header regex patterns
SECTION_PATTERNS = {
    "Skills & Competencies": re.compile(
        r"(?:^|\n)\s*(?:technical\s+skills|skills|core\s+competencies|tech\s+stack|key\s+skills)\b",
        re.IGNORECASE,
    ),
    "Work Experience": re.compile(
        r"(?:^|\n)\s*(?:work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history)\b",
        re.IGNORECASE,
    ),
    "Projects": re.compile(
        r"(?:^|\n)\s*(?:projects|key\s+projects|academic\s+projects|personal\s+projects)\b",
        re.IGNORECASE,
    ),
    "Education": re.compile(
        r"(?:^|\n)\s*(?:education|academic\s+background|qualifications|academic\s+details)\b",
        re.IGNORECASE,
    ),
    "Certifications": re.compile(
        r"(?:^|\n)\s*(?:certifications|certificates|licenses\s+&\s+certifications)\b",
        re.IGNORECASE,
    ),
}


def validate_pdf_file_signature(file_bytes: bytes, filename: str) -> None:
    """Validate that the uploaded file has a .pdf extension and valid %PDF- magic bytes.

    Purpose:
        Prevents arbitrary file upload attacks by enforcing both file extension
        and binary header signature verification.

    Args:
        file_bytes: Raw binary bytes of uploaded file.
        filename: Original file name string.

    Raises:
        PDFValidationError: If file extension is not .pdf or magic bytes do not start with %PDF-.
    """
    clean_name = filename.strip()
    if not clean_name.lower().endswith(".pdf"):
        raise PDFValidationError(
            f"Invalid file extension for '{clean_name}'. Only PDF (.pdf) documents are accepted."
        )

    # Magic bytes check: Must start with %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if len(file_bytes) < 5 or not file_bytes.startswith(b"%PDF-"):
        raise PDFValidationError(
            "Invalid file signature. The uploaded file does not begin with the standard PDF header (%PDF-)."
        )


def validate_file_size(file_bytes: bytes) -> None:
    """Validate that the uploaded file does not exceed the maximum allowed size.

    Purpose:
        Guards memory limits and prevents denial-of-service through oversized payloads.

    Args:
        file_bytes: Raw binary bytes of uploaded file.

    Raises:
        PDFSizeLimitExceededError: If byte size exceeds configured MAX_FILE_SIZE_MB.
    """
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        size_mb = len(file_bytes) / (1024 * 1024)
        raise PDFSizeLimitExceededError(
            f"Uploaded file size ({size_mb:.2f} MB) exceeds maximum limit of {settings.MAX_FILE_SIZE_MB} MB."
        )


def detect_sections(text: str) -> List[str]:
    """Identify standard resume sections present in the parsed text.

    Purpose:
        Enables structure inspection (Skills, Experience, Projects, Education, Certifications)
        to inform candidates about section organization.

    Args:
        text: Extracted plain text from resume PDF.

    Returns:
        List of detected section name strings.
    """
    detected = []
    for section_name, pattern in SECTION_PATTERNS.items():
        if pattern.search(text):
            detected.append(section_name)
    return detected


def parse_resume_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse resume PDF with layout awareness, security validations, and ephemeral in-memory processing.

    Purpose:
        Extracts digital text from single- and multi-column tech resumes using pdfplumber layout engine.
        Processes PDF strictly in memory via io.BytesIO without writing unencrypted resume text to disk.
        Does NOT log resume contents, email addresses, or phone numbers in compliance with India DPDP Act 2023.

    Args:
        file_bytes: Raw bytes of uploaded resume PDF.
        filename: Uploaded file name string.

    Returns:
        Dict containing document metadata (file name, size, page count, word count, detected sections)
        and ephemeral raw text for downstream skill matching.

    Raises:
        PDFEncryptedError: If PDF has password encryption enabled.
        PDFPageLimitExceededError: If page count exceeds maximum allowable limit.
        PDFScannedImageError: If document contains insufficient digital text (scanned bitmap).
        PDFMalformedError: If PDF syntax is corrupt or cannot be parsed.
    """
    start_time = time.perf_counter()
    clean_filename = os.path.basename(filename.strip())

    # 1. Validate signature & size
    validate_pdf_file_signature(file_bytes, clean_filename)
    validate_file_size(file_bytes)

    # Mask any potential PII in filename for safe logging
    safe_log_name = re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}", "[EMAIL]", clean_filename)
    safe_log_name = re.sub(r"\d{7,}", "[PHONE]", safe_log_name)

    # 2. Check for encryption or corruption via pypdf entirely in memory
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        if reader.is_encrypted:
            raise PDFEncryptedError()
        page_count = len(reader.pages)
    except PDFEncryptedError:
        raise
    except Exception as e:
        raise PDFMalformedError(f"The uploaded PDF is corrupt or malformed: {str(e)}") from e

    # Validate page counts
    if page_count == 0:
        raise PDFEmptyError()

    if page_count > settings.MAX_RESUME_PAGES:
        raise PDFPageLimitExceededError(
            f"Resume contains {page_count} pages, which exceeds the maximum limit of {settings.MAX_RESUME_PAGES} pages."
        )

    # 3. Extract text with pdfplumber in memory for accurate column/layout extraction
    extracted_pages: List[str] = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                # layout=True preserves column separation in multi-column tech resumes
                page_text = page.extract_text(layout=True)
                if not page_text:
                    page_text = page.extract_text() or ""
                extracted_pages.append(page_text)
    except Exception as e:
        raise PDFMalformedError(f"Error parsing PDF layout: {str(e)}") from e

    full_text = "\n\n".join(extracted_pages).strip()

    # 4. Detect scanned or image-only PDFs (insufficient digital text)
    alnum_chars = sum(1 for c in full_text if c.isalnum())
    if alnum_chars < settings.MIN_ALPHANUMERIC_CHARS:
        raise PDFScannedImageError()

    # 5. Extract structural metadata
    detected = detect_sections(full_text)
    word_count = len(full_text.split())
    char_count = len(full_text)

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    # Safe logging: ONLY file metadata, zero text or PII
    logger.info(
        "PDF parsed in-memory: filename=%s, size_bytes=%d, pages=%d, words=%d, elapsed_ms=%.1f",
        safe_log_name,
        len(file_bytes),
        page_count,
        word_count,
        elapsed_ms,
    )

    return {
        "file_name": clean_filename,
        "file_size_bytes": len(file_bytes),
        "page_count": page_count,
        "character_count": char_count,
        "word_count": word_count,
        "detected_sections": detected,
        "section_character_counts": {
            sec: len(full_text) // max(len(detected), 1) for sec in detected
        },
        "is_text_based": True,
        # Note: Raw full_text is retained ephemerally in memory only, not logged or persisted to disk
        "raw_text": full_text,
    }

