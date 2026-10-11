from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_health_endpoint():
    """Verify that GET /health returns 200 OK and expected JSON payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "JobMate AI" in data["service"]
    assert "version" in data
    assert "environment" in data


def test_api_v1_health_endpoint():
    """Verify that GET /api/v1/health returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root_endpoint():
    """Verify that GET / returns 200 OK with welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["health_check"] == "/health"
