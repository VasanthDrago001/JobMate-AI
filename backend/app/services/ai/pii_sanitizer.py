import re
from typing import List


# Regex patterns for common PII
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}\b"
)
URL_REGEX = re.compile(r"https?://\S+|www\.\S+|linkedin\.com/\S+|github\.com/\S+", re.IGNORECASE)


def sanitize_bullet_text(text: str, max_length: int = 400) -> str:
    """Sanitize a candidate resume bullet before passing to LLM.

    Purpose:
        Filters out sensitive Personally Identifiable Information (PII) including email addresses,
        Indian/international phone numbers, and personal URLs in accordance with DPDP Act 2023.
        Also strips formatting bullet characters and enforces token length limits.

    Args:
        text: Raw candidate bullet sentence.
        max_length: Maximum allowed character length.

    Returns:
        Sanitized, redacted, and whitespace-normalized bullet string.
    """
    cleaned = text.strip()

    # Strip leading bullet icons or symbols
    cleaned = re.sub(r"^[\s•\-\*\>]+", "", cleaned).strip()

    # Redact PII
    cleaned = EMAIL_REGEX.sub("[REDACTED_EMAIL]", cleaned)
    # Only redact phone numbers if they look like digits sequences (at least 7 digits)
    cleaned = re.sub(r"(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}", "[REDACTED_PHONE]", cleaned)
    cleaned = URL_REGEX.sub("[REDACTED_LINK]", cleaned)

    # Normalize whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Enforce hard length limit
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length].rstrip()

    return cleaned


def sanitize_bullets(bullets: List[str], max_bullets: int = 3, max_length: int = 400) -> List[str]:
    """Sanitize a list of bullets and limit to max_bullets.

    Purpose:
        Batches sanitization across multiple bullets while enforcing input bounds
        to control LLM context size and cloud costs.

    Args:
        bullets: List of candidate bullet strings.
        max_bullets: Maximum bullet count to process (default 3).
        max_length: Maximum character length per bullet.

    Returns:
        List of sanitized, non-empty bullet strings.
    """
    sanitized: List[str] = []
    for b in bullets[:max_bullets]:
        cleaned = sanitize_bullet_text(b, max_length=max_length)
        if cleaned:
            sanitized.append(cleaned)
    return sanitized

