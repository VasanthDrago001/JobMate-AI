import json
import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Set, Tuple

logger = logging.getLogger("jobmate.matching_service")

SCORING_METHOD_VERSION = "v1.0.0-deterministic"

DISCLAIMER_HONEST_SCORING = (
    "This score reflects deterministic keyword and synonym coverage between the uploaded resume "
    "and job description. It does not predict automated ATS filtering outcomes, recruiter decisions, "
    "or hiring success."
)

DISCLAIMER_NOT_FOUND_SKILL = (
    "A status of 'not_found_in_resume' indicates only that the specific keyword or alias was not "
    "detected in the uploaded resume document text. It does not imply that you do not possess the skill. "
    "If you have practical experience with this technology, consider truthfully adding relevant project "
    "or work experience."
)


def compile_skill_regex(term: str) -> re.Pattern:
    """Compile a regex pattern with punctuation-safe token boundaries.

    Ensures:
    - Multi-word terms and punctuation terms (e.g., C++, CI/CD, React.js) match accurately.
    - Prevents common false-positives:
      * 'Java' does not match within 'JavaScript'
      * 'C' does not match within 'C++', 'C#', or 'CSS'
      * 'JS' does not match within 'JSON'
      * 'Post' does not match within 'PostgreSQL' or 'Postman'
    """
    clean_term = term.strip()
    escaped = re.escape(clean_term)
    first_char = clean_term[0]
    last_char = clean_term[-1]

    # Prefix boundary: Alphanumeric terms cannot be preceded by alphanumeric/underscore.
    if first_char.isalnum():
        prefix = r"(?<![a-zA-Z0-9_])"
    else:
        prefix = r"(?<!\S)"

    # Suffix boundary: Disallow following word character or special language symbols like '+' or '#'
    # This prevents 'C' matching 'C++' or 'C#', and 'Java' matching 'JavaScript'.
    if last_char.isalnum():
        suffix = r"(?![a-zA-Z0-9_+#])"
    else:
        suffix = r"(?!\S)"

    return re.compile(f"{prefix}{escaped}{suffix}", re.IGNORECASE)


def extract_evidence_snippet(
    text: str,
    match_start: int,
    match_end: int,
    max_length: int = 160,
) -> str:
    """Extract a concise, contextual snippet around the matched keyword.

    Prefers extracting the whole bullet line or sentence containing the match.
    """
    # 1. Locate the containing line boundaries
    line_start = text.rfind("\n", 0, match_start)
    line_start = 0 if line_start == -1 else line_start + 1

    line_end = text.find("\n", match_end)
    line_end = len(text) if line_end == -1 else line_end

    line = text[line_start:line_end].strip()

    # Clean leading bullet characters if present
    line = re.sub(r"^[\s•\-\*\>]+", "", line).strip()
    line = re.sub(r"\s+", " ", line)

    if not line:
        line = text[max(0, match_start - 30) : min(len(text), match_end + 30)].strip()

    # If the line fits within max_length, return it directly
    if len(line) <= max_length:
        return line

    # Otherwise, window around the match
    relative_start = match_start - line_start
    relative_end = match_end - line_start

    half_window = (max_length - (match_end - match_start)) // 2
    window_start = max(0, relative_start - half_window)
    window_end = min(len(line), relative_end + half_window)

    snippet = line[window_start:window_end].strip()
    if window_start > 0:
        snippet = f"...{snippet}"
    if window_end < len(line):
        snippet = f"{snippet}..."

    return snippet


@dataclass
class SkillEntry:
    id: str
    canonical_name: str
    category: str
    roles: List[str]
    aliases: List[str]
    related_skills: List[str]
    weight: float = 1.0
    _compiled_patterns: List[Tuple[str, re.Pattern]] = field(default_factory=list, repr=False)

    def compile_patterns(self) -> None:
        """Compile regex patterns for canonical name and all aliases, longest first."""
        all_terms = [self.canonical_name] + [a for a in self.aliases if a != self.canonical_name]
        # Sort terms by length descending to match longest phrase first
        all_terms.sort(key=lambda x: len(x), reverse=True)
        self._compiled_patterns = [(t, compile_skill_regex(t)) for t in all_terms]

    def find_in_text(self, text: str) -> Optional[Tuple[str, int, int]]:
        """Search text for this skill or its aliases. Returns (matched_term, start, end) or None."""
        for term, pattern in self._compiled_patterns:
            m = pattern.search(text)
            if m:
                return (term, m.start(), m.end())
        return None


class SkillMatchingEngine:
    """Deterministic skill matching and transparent keyword coverage calculation engine."""

    def __init__(self, dictionary_path: Optional[str] = None):
        self.dictionary_path = dictionary_path or self._default_dict_path()
        self.skills: Dict[str, SkillEntry] = {}
        self.skills_by_canonical: Dict[str, SkillEntry] = {}
        self.roles_supported: List[str] = []
        self.load_dictionary()

    @staticmethod
    def _default_dict_path() -> str:
        base_dir = Path(__file__).resolve().parent.parent
        return str(base_dir / "data" / "skill_dictionary.json")

    def load_dictionary(self) -> None:
        """Load and compile the skill dictionary from JSON file."""
        if not os.path.exists(self.dictionary_path):
            logger.warning("Skill dictionary not found at %s. Initializing empty dictionary.", self.dictionary_path)
            return

        try:
            with open(self.dictionary_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.roles_supported = data.get("roles_supported", [])
            self.skills.clear()
            self.skills_by_canonical.clear()

            for item in data.get("skills", []):
                entry = SkillEntry(
                    id=item["id"],
                    canonical_name=item["canonical_name"],
                    category=item.get("category", "General"),
                    roles=item.get("roles", ["General"]),
                    aliases=item.get("aliases", []),
                    related_skills=item.get("related_skills", []),
                    weight=float(item.get("weight", 1.0)),
                )
                entry.compile_patterns()
                self.skills[entry.id] = entry
                self.skills_by_canonical[entry.canonical_name.lower()] = entry

            logger.info("Loaded %d skills from %s", len(self.skills), self.dictionary_path)
        except Exception as e:
            logger.error("Failed to load skill dictionary from %s: %s", self.dictionary_path, e)
            raise

    def extract_requirements(
        self,
        job_description: str,
        target_role: Optional[str] = None,
    ) -> List[SkillEntry]:
        """Extract all technical skills mentioned in the job description.

        Deduplicates canonical skills even if multiple aliases appear in the text.
        Sorts candidates by phrase length descending to prevent substring false positives.
        """
        extracted_skills: Dict[str, SkillEntry] = {}

        # Sort all skill entries by longest canonical/alias term first
        sorted_skills = sorted(
            self.skills.values(),
            key=lambda s: max(len(t) for t, _ in s._compiled_patterns),
            reverse=True,
        )

        for skill in sorted_skills:
            match = skill.find_in_text(job_description)
            if match:
                extracted_skills[skill.id] = skill

        # Return list of extracted requirements sorted alphabetically by canonical name
        return sorted(extracted_skills.values(), key=lambda s: s.canonical_name.lower())

    def evaluate_requirement(
        self,
        requirement: SkillEntry,
        resume_text: str,
    ) -> Dict[str, Any]:
        """Evaluate a single job requirement against the resume text.

        Classification:
        - 'matched': direct match of canonical name or any alias found in resume.
        - 'partial': target skill absent, but a declared related skill is present.
        - 'not_found_in_resume': neither skill nor related skills detected.
        """
        # 1. Direct match check
        direct_match = requirement.find_in_text(resume_text)
        if direct_match:
            matched_term, start, end = direct_match
            snippet = extract_evidence_snippet(resume_text, start, end)
            return {
                "skill_id": requirement.id,
                "name": requirement.canonical_name,
                "category": requirement.category,
                "status": "matched",
                "matched_term": matched_term,
                "evidence_snippet": snippet,
                "weight": requirement.weight,
                "explanation": f"Skill '{requirement.canonical_name}' (matched as '{matched_term}') detected in resume.",
            }

        # 2. Partial match check (related skill evaluation)
        for related_name in requirement.related_skills:
            related_entry = self.skills_by_canonical.get(related_name.lower())
            if related_entry:
                related_match = related_entry.find_in_text(resume_text)
            else:
                # If related skill is not in top-level entries, do ad-hoc pattern match
                pat = compile_skill_regex(related_name)
                m = pat.search(resume_text)
                related_match = (related_name, m.start(), m.end()) if m else None

            if related_match:
                rel_term, rel_start, rel_end = related_match
                snippet = extract_evidence_snippet(resume_text, rel_start, rel_end)
                return {
                    "skill_id": requirement.id,
                    "name": requirement.canonical_name,
                    "category": requirement.category,
                    "status": "partial",
                    "matched_term": rel_term,
                    "evidence_snippet": f"Related skill '{rel_term}' identified in resume: '{snippet}'",
                    "weight": requirement.weight,
                    "explanation": (
                        f"'{requirement.canonical_name}' was not directly detected, but related skill "
                        f"'{rel_term}' was found in your resume."
                    ),
                }

        # 3. Not found in resume
        return {
            "skill_id": requirement.id,
            "name": requirement.canonical_name,
            "category": requirement.category,
            "status": "not_found_in_resume",
            "matched_term": None,
            "evidence_snippet": None,
            "weight": requirement.weight,
            "explanation": (
                f"Keyword '{requirement.canonical_name}' was not detected in the submitted resume document. "
                "This does not imply you lack practical ability in this area."
            ),
        }

    def analyze(
        self,
        resume_text: str,
        job_description: str,
        target_role: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Perform deterministic resume-to-job-description skill matching.

        Returns:
        - Structured evaluation with classifications (matched, partial, not_found_in_resume).
        - Evidence snippets for matched and partial skills.
        - Transparent weighted keyword coverage score or 'unable_to_score' if no requirements extracted.
        """
        requirements = self.extract_requirements(job_description, target_role)

        # Edge Case: If no recognizable technical requirements could be extracted from JD
        if not requirements:
            return {
                "status": "unable_to_score",
                "score": None,
                "scoring_method_version": SCORING_METHOD_VERSION,
                "message": (
                    "Unable to calculate score: No technical skill requirements could be reliably "
                    "identified from the provided job description. Please ensure the job description "
                    "includes technical roles, tools, or framework requirements."
                ),
                "scoring_formula": "N/A - zero requirements extracted",
                "summary": {
                    "total_requirements": 0,
                    "matched_count": 0,
                    "partial_count": 0,
                    "not_found_count": 0,
                },
                "matched_skills": [],
                "partial_skills": [],
                "not_found_skills": [],
                "all_requirements": [],
                "disclaimer_honest_scoring": DISCLAIMER_HONEST_SCORING,
                "disclaimer_not_found_skills": DISCLAIMER_NOT_FOUND_SKILL,
            }

        matched_list: List[Dict[str, Any]] = []
        partial_list: List[Dict[str, Any]] = []
        not_found_list: List[Dict[str, Any]] = []
        all_evaluations: List[Dict[str, Any]] = []

        total_possible_weight = 0.0
        earned_weight = 0.0

        for req in requirements:
            evaluation = self.evaluate_requirement(req, resume_text)
            all_evaluations.append(evaluation)
            total_possible_weight += req.weight

            if evaluation["status"] == "matched":
                matched_list.append(evaluation)
                earned_weight += req.weight * 1.0
            elif evaluation["status"] == "partial":
                partial_list.append(evaluation)
                earned_weight += req.weight * 0.5
            else:
                not_found_list.append(evaluation)

        # Calculate transparent weighted coverage percentage
        if total_possible_weight > 0:
            coverage_percentage = round((earned_weight / total_possible_weight) * 100, 1)
        else:
            coverage_percentage = 0.0

        return {
            "status": "completed",
            "score": coverage_percentage,
            "scoring_method_version": SCORING_METHOD_VERSION,
            "message": (
                f"Extracted {len(requirements)} requirements from job description: "
                f"{len(matched_list)} matched, {len(partial_list)} partial, "
                f"{len(not_found_list)} not found in resume."
            ),
            "scoring_formula": "((matched_weights * 1.0) + (partial_weights * 0.5)) / total_possible_weight * 100",
            "summary": {
                "total_requirements": len(requirements),
                "matched_count": len(matched_list),
                "partial_count": len(partial_list),
                "not_found_count": len(not_found_list),
                "earned_weight": round(earned_weight, 2),
                "total_possible_weight": round(total_possible_weight, 2),
            },
            "matched_skills": matched_list,
            "partial_skills": partial_list,
            "not_found_skills": not_found_list,
            "all_requirements": all_evaluations,
            "disclaimer_honest_scoring": DISCLAIMER_HONEST_SCORING,
            "disclaimer_not_found_skills": DISCLAIMER_NOT_FOUND_SKILL,
        }


# Singleton engine instance for reusable fast in-memory matching
matching_engine = SkillMatchingEngine()
