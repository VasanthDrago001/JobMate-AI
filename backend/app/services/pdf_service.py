import logging
import os
import re
import tempfile
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
    """Validate that the uploaded file has a .pdf extension and valid %PDF- magic bytes."""
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
    """Validate that the uploaded file does not exceed the maximum allowed size."""
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        size_mb = len(file_bytes) / (1024 * 1024)
        raise PDFSizeLimitExceededError(
            f"Uploaded file size ({size_mb:.2f} MB) exceeds maximum limit of {settings.MAX_FILE_SIZE_MB} MB."
        )


def detect_sections(text: str) -> List[str]:
    """Identify standard resume sections present in the text."""
    detected = []
    for section_name, pattern in SECTION_PATTERNS.items():
        if pattern.search(text):
            detected.append(section_name)
    return detected


def parse_resume_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse resume PDF with layout awareness, security validations, and ephemeral cleanup.

    Keeps file in temporary storage and strictly cleans up in a finally block.
    Does NOT log resume contents, email addresses or phone numbers.
    """
    start_time = time.perf_counter()

    # 1. Validate signature & size
    validate_pdf_file_signature(file_bytes, filename)
    validate_file_size(file_bytes)

    # 2. Check for encryption or corruption via pypdf before detailed extraction
    temp_file_path: str = ""
    try:
        # Create a NamedTemporaryFile with delete=False for robust cross-platform handle handling
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            temp_file_path = tmp.name

        # Pre-check with pypdf for encryption
        try:
            reader = pypdf.PdfReader(temp_file_path)
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

        # 3. Extract text with pdfplumber for accurate column/layout extraction
        extracted_pages: List[str] = []
        try:
            with pdfplumber.open(temp_file_path) as pdf:
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
            "PDF parsed successfully: filename=%s, size_bytes=%d, pages=%d, words=%d, elapsed_ms=%.1f",
            filename,
            len(file_bytes),
            page_count,
            word_count,
            elapsed_ms,
        )

        return {
            "file_name": filename,
            "file_size_bytes": len(file_bytes),
            "page_count": page_count,
            "character_count": char_count,
            "word_count": word_count,
            "detected_sections": detected,
            "section_character_counts": {
                sec: len(full_text) // max(len(detected), 1) for sec in detected
            },
            "is_text_based": True,
            # Note: Raw full_text is retained in memory for downstream processing, not logged or saved to disk
            "raw_text": full_text,
        }

    finally:
        # 6. Strict cleanup: delete temporary file whether parsing succeeded or failed
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError as err:
                logger.warning("Could not delete temporary PDF file %s: %s", temp_file_path, err)
