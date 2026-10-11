import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_quiz_topics():
    response = client.get("/api/v1/prep/topics")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    topic_names = [t["display_name"] for t in data]
    assert "Python" in topic_names
    assert "SQL & Databases" in topic_names
    assert "QA Automation" in topic_names


def test_get_quiz_questions():
    response = client.get("/api/v1/prep/quizzes?topic=Python&limit=3")
    assert response.status_code == 200
    questions = response.json()
    assert isinstance(questions, list)
    assert len(questions) <= 3
    for q in questions:
        assert "id" in q
        assert "question_text" in q
        assert len(q["options"]) == 4
        assert "correct_option_index" not in q  # Must not leak answer upfront!
        assert "concept_tested" in q


def test_get_quiz_questions_not_found():
    response = client.get("/api/v1/prep/quizzes?topic=NonExistentSkill123")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_submit_quiz_answers_and_calculate_xp():
    # 1. Fetch questions first
    q_resp = client.get("/api/v1/prep/quizzes?topic=Python&limit=2")
    assert q_resp.status_code == 200
    questions = q_resp.json()
    assert len(questions) >= 2

    # 2. Submit answers (first question option 1, second option 0)
    submission_payload = {
        "topic": "Python",
        "answers": [
            {"question_id": questions[0]["id"], "selected_option_index": 1},
            {"question_id": questions[1]["id"], "selected_option_index": 0},
        ],
    }
    sub_resp = client.post("/api/v1/prep/quizzes/submit", json=submission_payload)
    assert sub_resp.status_code == 200
    result = sub_resp.json()
    assert result["total_questions"] == 2
    assert "score_percentage" in result
    assert "xp_earned" in result
    assert len(result["results"]) == 2
    for r in result["results"]:
        assert "is_correct" in r
        assert "explanation" in r
        assert "concept_tested" in r
    assert "disclaimer" in result


def test_submit_empty_quiz_rejected():
    response = client.post(
        "/api/v1/prep/quizzes/submit",
        json={"topic": "Python", "answers": []},
    )
    assert response.status_code == 422


def test_generate_prep_roadmap():
    payload = {
        "target_role": "Senior Backend Engineer (Python / FastAPI)",
        "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
        "missing_must_have": ["Docker", "Redis"],
        "missing_good_to_have": ["Microservices"],
    }
    response = client.post("/api/v1/prep/roadmap", json=payload)
    assert response.status_code == 200
    roadmap = response.json()

    assert roadmap["target_role"] == "Senior Backend Engineer (Python / FastAPI)"
    assert roadmap["total_estimated_hours"] > 0
    assert len(roadmap["weeks"]) == 4

    # Week 1 should cover verified matched skills
    w1 = roadmap["weeks"][0]
    assert w1["week_number"] == 1
    w1_topics = [t["topic_name"] for t in w1["topics"]]
    assert "Python" in w1_topics or "FastAPI" in w1_topics

    # Week 2 should cover must-haves
    w2 = roadmap["weeks"][1]
    assert w2["week_number"] == 2
    w2_topics = [t["topic_name"] for t in w2["topics"]]
    assert "Docker" in w2_topics or "Redis" in w2_topics

    # Week 4 should cover drills and STAR storytelling
    w4 = roadmap["weeks"][3]
    assert w4["week_number"] == 4
    assert any("STAR" in t["topic_name"] for t in w4["topics"])

    assert "honest_disclaimer" in roadmap


def test_generate_prep_roadmap_fallback_defaults():
    # Test with empty skills lists
    payload = {
        "target_role": "Software Engineer",
        "matched_skills": [],
        "missing_must_have": [],
        "missing_good_to_have": [],
    }
    response = client.post("/api/v1/prep/roadmap", json=payload)
    assert response.status_code == 200
    roadmap = response.json()
    assert len(roadmap["weeks"]) == 4
    assert roadmap["total_estimated_hours"] > 0
