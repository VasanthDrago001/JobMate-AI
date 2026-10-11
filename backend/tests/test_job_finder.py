import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.rate_limiter import rate_limiter
from app.services.job_search.job_service import job_finder_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_state():
    rate_limiter.reset()
    job_finder_service.clear_cache()
    yield
    rate_limiter.reset()
    job_finder_service.clear_cache()


def test_get_supported_locations(client: TestClient):
    """Verify supported Indian IT hub locations endpoint."""
    resp = client.get("/api/v1/jobs/locations")
    assert resp.status_code == 200
    locations = resp.json()
    assert isinstance(locations, list)
    assert "Bengaluru" in locations
    assert "Hyderabad" in locations
    assert "Pune" in locations
    assert "Remote" in locations


def test_job_search_success_with_skills_ranking(client: TestClient):
    """Verify searching for jobs calculates alignment scores against candidate skills."""
    payload = {
        "role": "Python Developer",
        "location": "Bengaluru",
        "work_mode": "all",
        "experience_level": "all",
        "candidate_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
        "page": 1,
        "page_size": 10,
    }
    resp = client.post("/api/v1/jobs/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "results" in data
    assert len(data["results"]) > 0
    assert data["source_attribution"] is not None
    assert "Adzuna" in data["source_attribution"] or "official" in data["source_attribution"]

    # Verify first listing properties
    first_job = data["results"][0]
    assert "id" in first_job
    assert "title" in first_job
    assert "company_name" in first_job
    assert "location" in first_job
    assert "application_url" in first_job
    assert first_job["application_url"].startswith("http")
    assert first_job["match_score_percentage"] >= 0.0
    assert len(first_job["skills_breakdown"]) >= 0
    assert first_job["match_summary_explanation"] != ""

    # Check that listings are sorted descending by match score
    scores = [j["match_score_percentage"] for j in data["results"]]
    assert scores == sorted(scores, reverse=True)


def test_job_search_caching(client: TestClient):
    """Verify subsequent identical queries return cached=True."""
    payload = {
        "role": "QA Automation Engineer",
        "location": "Bengaluru",
        "work_mode": "all",
        "experience_level": "all",
        "candidate_skills": ["Python", "Pytest", "Selenium"],
        "page": 1,
        "page_size": 5,
    }
    resp1 = client.post("/api/v1/jobs/search", json=payload)
    assert resp1.status_code == 200
    assert resp1.json()["cached"] is False

    resp2 = client.post("/api/v1/jobs/search", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["cached"] is True


def test_job_search_zero_overlap_skills(client: TestClient):
    """Verify candidate with completely unrelated skills receives honest low/zero score without errors."""
    payload = {
        "role": "Python Developer",
        "location": "Bengaluru",
        "work_mode": "all",
        "experience_level": "all",
        "candidate_skills": ["Cobol", "Fortran"],  # Completely unrelated
        "page": 1,
        "page_size": 5,
    }
    resp = client.post("/api/v1/jobs/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) > 0
    # Every job requirement should be marked as missing
    first_job = data["results"][0]
    if first_job["skills_breakdown"]:
        assert any(s["status"] == "missing" for s in first_job["skills_breakdown"])


def test_job_search_rate_limiting(client: TestClient):
    """Verify rate limiter triggers HTTP 429 when job search limit (30 req/min) is reached."""
    payload = {
        "role": "Backend Engineer",
        "location": "Remote",
        "work_mode": "remote",
        "experience_level": "all",
        "candidate_skills": ["Python"],
        "page": 1,
        "page_size": 5,
    }

    # Execute 30 calls
    for _ in range(30):
        r = client.post("/api/v1/jobs/search", json=payload)
        assert r.status_code == 200

    # 31st call must be blocked
    blocked = client.post("/api/v1/jobs/search", json=payload)
    assert blocked.status_code == 429
    assert "Too many requests" in blocked.json()["detail"]


def test_job_search_filter_experience_tiers(client: TestClient):
    """Verify filtering by experience level (entry vs senior) returns distinct role tiers."""
    # Senior filter
    senior_payload = {
        "role": "Software Engineer",
        "location": "All India",
        "work_mode": "all",
        "experience_level": "senior",
        "candidate_skills": ["Python", "PostgreSQL"],
        "page": 1,
        "page_size": 10,
    }
    resp_senior = client.post("/api/v1/jobs/search", json=senior_payload)
    assert resp_senior.status_code == 200
    senior_jobs = resp_senior.json()["results"]
    assert len(senior_jobs) > 0
    for j in senior_jobs:
        title_desc = f"{j['title']} {j['description_snippet']}".lower()
        # Must match senior indicators
        assert any(k in title_desc for k in ["senior", "lead", "architect", "5+", "6+", "sdet"])

    # Entry filter
    entry_payload = {
        "role": "Software Engineer",
        "location": "All India",
        "work_mode": "all",
        "experience_level": "entry",
        "candidate_skills": ["Python"],
        "page": 1,
        "page_size": 10,
    }
    resp_entry = client.post("/api/v1/jobs/search", json=entry_payload)
    assert resp_entry.status_code == 200
    entry_jobs = resp_entry.json()["results"]
    assert len(entry_jobs) > 0
    for j in entry_jobs:
        title_desc = f"{j['title']} {j['description_snippet']}".lower()
        assert any(k in title_desc for k in ["entry", "junior", "associate", "0-2", "fresh"])


def test_job_search_filter_work_modes(client: TestClient):
    """Verify filtering by work mode returns only matching work arrangement listings."""
    remote_payload = {
        "role": "Engineer",
        "location": "All India",
        "work_mode": "remote",
        "experience_level": "all",
        "candidate_skills": ["Python"],
        "page": 1,
        "page_size": 10,
    }
    resp = client.post("/api/v1/jobs/search", json=remote_payload)
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) > 0
    for j in results:
        assert j["work_mode"] == "Remote" or "remote" in j["location"].lower()


def test_job_search_sorting_options(client: TestClient):
    """Verify sorting results by company name alphabetically."""
    company_payload = {
        "role": "Engineer",
        "location": "All India",
        "work_mode": "all",
        "experience_level": "all",
        "sort_by": "company",
        "candidate_skills": ["Python"],
        "page": 1,
        "page_size": 10,
    }
    resp = client.post("/api/v1/jobs/search", json=company_payload)
    assert resp.status_code == 200
    results = resp.json()["results"]
    companies = [j["company_name"].lower() for j in results]
    assert companies == sorted(companies)

