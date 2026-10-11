import re
from typing import List, Set, Tuple

# Regex to detect unbracketed percentages or currency figures
FABRICATED_PERCENT_REGEX = re.compile(r"(?<!\[)\b\d+(?:\.\d+)?%(?!\])")
FABRICATED_CURRENCY_REGEX = re.compile(r"(?<!\[)[\$₹€£]\s*\d+(?:,\d+)*(?:\.\d+)?(?!\])")

# High-profile technical terms commonly hallucinated
COMMON_TECH_TOKENS = {
    "kubernetes", "k8s", "kafka", "rust", "golang", "go", "spark", "hadoop",
    "graphql", "snowflake", "databricks", "terraform", "ansible", "jenkins",
    "aws", "gcp", "azure", "docker", "redis", "elasticsearch"
}


def extract_tech_words(text: str) -> Set[str]:
    """Extract lowercased tech candidate tokens from text."""
    words = re.findall(r"[A-Za-z0-9+#]+", text.lower())
    return set(words)


def verify_rewrite_guardrails(
    original_bullet: str,
    suggested_rewrite: str,
    allowed_target_skills: List[str],
) -> Tuple[bool, bool, List[str]]:
    """Verify that a suggested rewrite does not inject fabricated facts or technologies.

    Returns:
        (is_valid, needs_confirmation, warnings)
        - is_valid: False if severe hallucination (e.g. invented unrelated tech stacks)
        - needs_confirmation: True if rewrite contains placeholder metrics or new unverified figures
        - warnings: Human-readable list of detected modifications
    """
    warnings: List[str] = []
    needs_confirmation = False

    orig_tokens = extract_tech_words(original_bullet)
    target_tokens = set()
    for s in allowed_target_skills:
        target_tokens.update(extract_tech_words(s))

    allowed_tokens = orig_tokens.union(target_tokens)
    rewrite_tokens = extract_tech_words(suggested_rewrite)

    # 1. Check for injected tech tools not in original or allowed target skills
    injected_tech = (rewrite_tokens.intersection(COMMON_TECH_TOKENS)) - allowed_tokens
    if injected_tech:
        # Severe hallucination: LLM injected technologies candidate never had
        warnings.append(
            f"Detected unverified technologies not in original bullet or target skills: {', '.join(sorted(injected_tech))}"
        )
        needs_confirmation = True

    # 2. Check for bracketed placeholders like [quantify...] or [insert...]
    if "[" in suggested_rewrite and "]" in suggested_rewrite:
        needs_confirmation = True
        warnings.append("Rewrite contains bracketed placeholder metrics requiring candidate confirmation.")

    # 3. Check for invented concrete numbers where original had none
    orig_has_percent = "%" in original_bullet
    rewrite_has_unbracketed_percent = bool(FABRICATED_PERCENT_REGEX.search(suggested_rewrite))
    if rewrite_has_unbracketed_percent and not orig_has_percent:
        needs_confirmation = True
        warnings.append("Rewrite contains an unbracketed percentage metric not present in the original bullet.")

    orig_has_currency = bool(re.search(r"[\$₹€£]", original_bullet))
    rewrite_has_currency = bool(FABRICATED_CURRENCY_REGEX.search(suggested_rewrite))
    if rewrite_has_currency and not orig_has_currency:
        needs_confirmation = True
        warnings.append("Rewrite contains an unbracketed currency metric not present in the original bullet.")

    # If injected tech is found, is_valid is False if candidate didn't know the tool
    is_valid = len(injected_tech) == 0

    return is_valid, needs_confirmation, warnings
