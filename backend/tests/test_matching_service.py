import pytest
from app.services.matching_service import (
    SCORING_METHOD_VERSION,
    SkillMatchingEngine,
    compile_skill_regex,
    extract_evidence_snippet,
)


@pytest.fixture
def engine():
    """Fixture providing a fresh instance of the SkillMatchingEngine."""
    return SkillMatchingEngine()


# ==============================================================================
# 1. Alias Resolution Tests
# ==============================================================================


def test_alias_javascript_and_js(engine):
    """Verify that 'JS' and 'JavaScript' resolve to the canonical 'JavaScript' skill."""
    # JD mentions 'JS'
    jd = "Seeking a Frontend Developer with experience in JS, HTML, and CSS."
    reqs = engine.extract_requirements(jd)
    js_req = next((r for r in reqs if r.canonical_name == "JavaScript"), None)
    assert js_req is not None

    # Resume mentions 'JavaScript'
    resume = "Developed responsive web applications using JavaScript and TypeScript."
    eval_result = engine.evaluate_requirement(js_req, resume)
    assert eval_result["status"] == "matched"
    assert eval_result["matched_term"].lower() == "javascript"
    assert "JavaScript" in eval_result["evidence_snippet"]


def test_alias_react_and_reactjs(engine):
    """Verify that 'React.js' and 'React' match the canonical 'React' skill."""
    jd = "Must have strong skills in React.js and modern component architecture."
    reqs = engine.extract_requirements(jd)
    react_req = next((r for r in reqs if r.canonical_name == "React"), None)
    assert react_req is not None

    resume = "Built enterprise dashboard views using React and Redux Toolkit."
    eval_result = engine.evaluate_requirement(react_req, resume)
    assert eval_result["status"] == "matched"
    assert "React" in eval_result["evidence_snippet"]


def test_alias_postgresql_and_postgres(engine):
    """Verify that 'Postgres' and 'PostgreSQL' resolve to canonical 'PostgreSQL'."""
    jd = "Database requirements include Postgres, indexing, and connection pooling."
    reqs = engine.extract_requirements(jd)
    pg_req = next((r for r in reqs if r.canonical_name == "PostgreSQL"), None)
    assert pg_req is not None

    resume = "Designed and optimized schema migrations on PostgreSQL clusters."
    eval_result = engine.evaluate_requirement(pg_req, resume)
    assert eval_result["status"] == "matched"
    assert eval_result["matched_term"].lower() == "postgresql"


def test_alias_pytest_variants(engine):
    """Verify that 'pytest' and 'py.test' resolve to canonical 'PyTest'."""
    jd = "Unit testing experience with py.test or pytest is required."
    reqs = engine.extract_requirements(jd)
    pytest_req = next((r for r in reqs if r.canonical_name == "PyTest"), None)
    assert pytest_req is not None

    resume = "Maintained 95% test coverage using PyTest automated test fixtures."
    eval_result = engine.evaluate_requirement(pytest_req, resume)
    assert eval_result["status"] == "matched"


def test_alias_selenium_webdriver(engine):
    """Verify that 'Selenium WebDriver' resolves to canonical 'Selenium'."""
    jd = "We need an engineer experienced with Selenium WebDriver for UI tests."
    reqs = engine.extract_requirements(jd)
    sel_req = next((r for r in reqs if r.canonical_name == "Selenium"), None)
    assert sel_req is not None


# ==============================================================================
# 2. Substring & Word Boundary False Positive Tests
# ==============================================================================


def test_false_positive_java_in_javascript():
    """Verify that 'Java' does NOT match within 'JavaScript'."""
    pat = compile_skill_regex("Java")
    assert pat.search("We are using JavaScript in our web app") is None
    assert pat.search("Experienced Java backend developer") is not None


def test_false_positive_c_in_css_and_cplusplus():
    """Verify that 'C' does NOT match within 'CSS' or 'C++'."""
    pat = compile_skill_regex("C")
    assert pat.search("Skilled in CSS3 and HTML") is None
    assert pat.search("Building games in C++ and DirectX") is None
    assert pat.search("Core systems programming in C language") is not None


def test_false_positive_js_in_json():
    """Verify that 'JS' does NOT match within 'JSON'."""
    pat = compile_skill_regex("JS")
    assert pat.search("All API payloads are formatted as JSON") is None
    assert pat.search("Proficient in JS and modern web standards") is not None


def test_false_positive_post_in_postgresql_and_postman():
    """Verify that 'Post' does NOT match within 'PostgreSQL' or 'Postman'."""
    pat = compile_skill_regex("Post")
    assert pat.search("Maintained PostgreSQL databases and Postman collections") is None
    assert pat.search("Created HTTP POST endpoints for webhook reception") is not None


def test_punctuation_boundary_cicd():
    """Verify that 'CI/CD' matches with slash punctuation cleanly."""
    pat = compile_skill_regex("CI/CD")
    assert pat.search("Established automated CI/CD pipeline using GitHub Actions") is not None
    assert pat.search("Established automated CI-CD pipeline") is None


# ==============================================================================
# 3. Requirement Classification Tests (Matched, Partial, Not Found)
# ==============================================================================


def test_classification_matched(engine):
    """Verify direct match classification with clear evidence snippet."""
    resume_text = (
        "Software Engineer at Acme Corp.\n"
        "• Developed high-speed RESTful services using FastAPI and Python 3.11.\n"
        "• Scaled database throughput on PostgreSQL."
    )
    jd_text = "Looking for an engineer skilled in FastAPI and database design."

    res = engine.analyze(resume_text=resume_text, job_description=jd_text)
    assert res["status"] == "completed"

    fastapi_match = next((s for s in res["matched_skills"] if s["name"] == "FastAPI"), None)
    assert fastapi_match is not None
    assert fastapi_match["status"] == "matched"
    assert "FastAPI" in fastapi_match["evidence_snippet"]
    assert "Acme Corp" not in fastapi_match["evidence_snippet"]


def test_classification_partial_with_related_skill(engine):
    """Verify that an absent skill with a declared related skill in the resume is classified as partial."""
    # JD requires FastAPI, but candidate resume only mentions Python
    resume_text = (
        "Backend Developer\n"
        "• Engineered monolithic systems in Python with raw SQL queries.\n"
        "• Maintained legacy scripts."
    )
    jd_text = "Must have hands-on experience developing microservices with FastAPI."

    res = engine.analyze(resume_text=resume_text, job_description=jd_text)
    assert res["status"] == "completed"

    fastapi_match = next((s for s in res["partial_skills"] if s["name"] == "FastAPI"), None)
    assert fastapi_match is not None
    assert fastapi_match["status"] == "partial"
    assert "Related skill 'Python' identified" in fastapi_match["evidence_snippet"]
    assert "FastAPI" in fastapi_match["explanation"]
    assert "was not directly detected" in fastapi_match["explanation"]


def test_classification_not_found(engine):
    """Verify that an absent skill with no related skill is classified as not_found_in_resume."""
    resume_text = (
        "Frontend Developer\n"
        "• Built responsive interfaces using React and CSS.\n"
        "• Handled client-side state with Redux."
    )
    jd_text = "Must have extensive production experience with Kubernetes (K8s) clusters."

    res = engine.analyze(resume_text=resume_text, job_description=jd_text)
    assert res["status"] == "completed"

    k8s_match = next((s for s in res["not_found_skills"] if s["name"] == "Kubernetes"), None)
    assert k8s_match is not None
    assert k8s_match["status"] == "not_found_in_resume"
    assert k8s_match["evidence_snippet"] is None
    assert "not detected in the submitted resume" in k8s_match["explanation"]


# ==============================================================================
# 4. Role Dictionary Tests (Python Developer, PHP Developer, QA Automation)
# ==============================================================================


def test_python_developer_role_skills(engine):
    """Verify Python Developer role skills are in the dictionary and correctly extracted."""
    jd = (
        "Senior Python Developer needed. Skills: Python, FastAPI, Django, Celery, "
        "SQLAlchemy, PyTest, Docker, and PostgreSQL."
    )
    reqs = engine.extract_requirements(jd)
    names = [r.canonical_name for r in reqs]

    assert "Python" in names
    assert "FastAPI" in names
    assert "Django" in names
    assert "Celery" in names
    assert "SQLAlchemy" in names
    assert "PyTest" in names
    assert "Docker" in names
    assert "PostgreSQL" in names


def test_php_developer_role_skills(engine):
    """Verify PHP Developer role skills are in the dictionary and correctly extracted."""
    jd = (
        "PHP Full Stack Engineer: Requirements include PHP 8, Laravel Framework, "
        "Composer, MySQL, PHPUnit, and WordPress CMS."
    )
    reqs = engine.extract_requirements(jd)
    names = [r.canonical_name for r in reqs]

    assert "PHP" in names
    assert "Laravel" in names
    assert "Composer" in names
    assert "MySQL" in names
    assert "PHPUnit" in names
    assert "WordPress" in names


def test_qa_automation_engineer_role_skills(engine):
    """Verify QA Automation Engineer role skills are in the dictionary and correctly extracted."""
    jd = (
        "QA Automation Engineer: Must have hands-on experience in Selenium WebDriver, "
        "Cypress, Playwright, Postman, RestAssured, Cucumber BDD, and Test Automation."
    )
    reqs = engine.extract_requirements(jd)
    names = [r.canonical_name for r in reqs]

    assert "Selenium" in names
    assert "Cypress" in names
    assert "Playwright" in names
    assert "Postman" in names
    assert "RestAssured" in names
    assert "Cucumber" in names
    assert "Test Automation" in names


# ==============================================================================
# 5. Weighted Scoring & Mathematical Transparency Tests
# ==============================================================================


def test_perfect_score_when_all_skills_matched(engine):
    """Verify 100.0% score when all JD requirements are matched."""
    jd = "Requirements: Python, Docker, and Git."
    resume = (
        "Senior Engineer\n"
        "• Extensive background in Python backend programming.\n"
        "• Containerized microservices using Docker.\n"
        "• Managed repositories using Git."
    )
    res = engine.analyze(resume_text=resume, job_description=jd)
    assert res["status"] == "completed"
    assert res["score"] == 100.0
    assert res["summary"]["matched_count"] == 3
    assert res["summary"]["partial_count"] == 0
    assert res["summary"]["not_found_count"] == 0


def test_weighted_score_formula_calculation(engine):
    """Verify transparent mathematical calculation with weighted partial and matched values."""
    # Custom test with known weights
    jd = "Required: Python, FastAPI, and Kubernetes."
    # Resume has Python (matched), FastAPI absent but Python present (partial), Kubernetes absent (not found)
    resume = "Experienced software developer working primarily in Python."

    res = engine.analyze(resume_text=resume, job_description=jd)
    assert res["status"] == "completed"

    matched = res["summary"]["matched_count"]
    partial = res["summary"]["partial_count"]
    not_found = res["summary"]["not_found_count"]

    assert matched >= 1  # Python
    assert partial >= 1  # FastAPI (partial via Python)
    assert not_found >= 1  # Kubernetes

    # Verify score formula string exists
    assert "matched_weights" in res["scoring_formula"]
    assert 0.0 <= res["score"] <= 100.0


# ==============================================================================
# 6. Edge Cases & 'Unable to Score'
# ==============================================================================


def test_unable_to_score_on_generic_job_description(engine):
    """Verify that JD without recognizable technical skills returns 'unable_to_score' and score=None."""
    generic_jd = (
        "We are looking for a dynamic self-starter with great leadership skills, "
        "excellent communication abilities, and a willingness to learn in a fast-paced environment."
    )
    resume = "Senior Python engineer with 5 years experience in FastAPI and Docker."

    res = engine.analyze(resume_text=resume, job_description=generic_jd)

    assert res["status"] == "unable_to_score"
    assert res["score"] is None
    assert "Unable to calculate score" in res["message"]
    assert res["summary"]["total_requirements"] == 0


def test_scoring_method_version_and_disclaimers(engine):
    """Verify that scoring method is versioned and disclaimers are present."""
    jd = "Requirements: Python and Docker."
    resume = "Python developer."

    res = engine.analyze(resume_text=resume, job_description=jd)

    assert res["scoring_method_version"] == SCORING_METHOD_VERSION
    assert "ATS" in res["disclaimer_honest_scoring"]
    assert "does not imply that you do not possess the skill" in res["disclaimer_not_found_skills"]


def test_snippet_extraction_cleaning():
    """Verify snippet extraction strips bullet marks and excessive line whitespace."""
    raw_text = "Header\n• Developed scalable services using FastAPI and Docker in 2024.\nFooter"
    snippet = extract_evidence_snippet(raw_text, match_start=raw_text.find("FastAPI"), match_end=raw_text.find("FastAPI") + 7)
    assert not snippet.startswith("•")
    assert "FastAPI" in snippet
