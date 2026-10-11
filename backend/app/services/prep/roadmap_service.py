import logging
from typing import List, Dict
from app.schemas.prep import (
    RoadmapRequest,
    PreparationRoadmap,
    RoadmapWeek,
    RoadmapTopicItem,
)

logger = logging.getLogger("jobmate.prep.roadmap_service")

# Technology concept catalog for high-fidelity roadmaps
TECH_KNOWLEDGE_BASE: Dict[str, Dict] = {
    "python": {
        "concepts": ["GIL & AsyncIO internals", "Memory management & Garbage Collection", "Generators vs Iterators", "Decorators & Metaclasses"],
        "practice": "Code a thread-safe LRU cache using collections.OrderedDict or custom doubly linked list.",
        "category": "Core Programming Language",
    },
    "fastapi": {
        "concepts": ["Dependency Injection system", "Pydantic V2 validation & serialization", "Starlette middleware & ASGI lifecycle", "Background tasks & WebSockets"],
        "practice": "Build an async REST endpoint with OAuth2 JWT authentication and rate limiting.",
        "category": "Web Frameworks & APIs",
    },
    "postgresql": {
        "concepts": ["B-tree & GIN Indexing internals", "EXPLAIN ANALYZE query plan tuning", "ACID isolation levels & MVCC", "Connection pooling with PgBouncer"],
        "practice": "Analyze slow queries with EXPLAIN ANALYZE and add covering composite indexes.",
        "category": "Databases & Storage",
    },
    "docker": {
        "concepts": ["Multi-stage builds for lean images", "Container networking & port mapping", "Volume persistence & bind mounts", "Docker Compose multi-service orchestration"],
        "practice": "Write a multi-stage Dockerfile packaging a Python app under 100MB using alpine/distroless.",
        "category": "DevOps & Containers",
    },
    "redis": {
        "concepts": ["Key eviction policies (LRU/LFU)", "Redis Data structures (Hashes, Sets, Sorted Sets)", "Distributed locking with Redlock", "Pub/Sub and Redis Streams"],
        "practice": "Implement a distributed rate limiter and session store using Redis sorted sets.",
        "category": "Caching & In-Memory Stores",
    },
    "microservices": {
        "concepts": ["Service-to-service communication (REST vs gRPC)", "API Gateway pattern & Circuit Breaking", "Distributed tracing (OpenTelemetry)", "Event-driven architecture with message queues"],
        "practice": "Design an idempotent event consumer with dead-letter queue handling.",
        "category": "System Architecture",
    },
    "qa automation": {
        "concepts": ["Page Object Model (POM) pattern", "Cross-browser execution with Playwright/Selenium", "CI/CD automated regression gates", "API automation with PyTest and requests"],
        "practice": "Write a parallelized test suite with automated HTML test reports and flaky-test retries.",
        "category": "Quality Engineering",
    },
    "react": {
        "concepts": ["Virtual DOM & React Fiber reconciliation", "Custom hooks & state management", "Server components vs Client components", "Memoization (useMemo, useCallback)"],
        "practice": "Create an accessible virtualized list component handling 10,000 items without DOM lag.",
        "category": "Frontend Frameworks",
    },
}

DEFAULT_TOPIC_DETAILS = {
    "concepts": ["Core syntax & architectural paradigms", "Production trade-offs & memory limits", "Industry debugging & profiling methods", "Common interview pitfalls"],
    "practice": "Build a hands-on proof-of-concept demonstrating production error handling.",
    "category": "Technical Engineering Skill",
}


class RoadmapService:
    @staticmethod
    def generate_roadmap(request: RoadmapRequest) -> PreparationRoadmap:
        """Generate a deterministic 4-week preparation plan grounded in verified resume strengths and gaps.

        Purpose:
            Synthesizes a structured, realistic interview preparation curriculum tailored to the candidate's
            analyzed profile:
            - Week 1: Reinforce verified strengths and language internals.
            - Week 2: Bridge high-priority missing must-have gaps from the job description.
            - Week 3: Master secondary architecture, caching, and scalability patterns.
            - Week 4: Perform timed STAR drills, mock interview storytelling, and project defense rehearsals.

        Args:
            request: RoadmapRequest specifying target role, matched skills, and identified skill gaps.

        Returns:
            PreparationRoadmap with 4 structured weekly plans, concept lists, and hands-on exercises.
        """
        matched = [s.strip() for s in request.matched_skills if s.strip()]
        must_haves = [s.strip() for s in request.missing_must_have if s.strip()]
        good_to_haves = [s.strip() for s in request.missing_good_to_have if s.strip()]

        # Fallback defaults if analysis was conducted with zero extracted skills
        if not matched:
            matched = ["Python", "FastAPI", "SQL"]
        if not must_haves and not good_to_haves:
            must_haves = ["Docker", "Redis"]
            good_to_haves = ["Microservices Architecture"]

        weeks: List[RoadmapWeek] = []

        # ----------------------------------------------------
        # Week 1: Core Foundation & Resume Strengths Refresher
        # ----------------------------------------------------
        w1_topics: List[RoadmapTopicItem] = []
        for skill in matched[:3]:
            info = TECH_KNOWLEDGE_BASE.get(skill.lower(), DEFAULT_TOPIC_DETAILS)
            w1_topics.append(
                RoadmapTopicItem(
                    topic_name=skill,
                    category=info["category"],
                    priority="refresher",
                    estimated_hours=6,
                    key_concepts=info["concepts"][:3],
                    recommended_practice_focus=info["practice"],
                )
            )

        weeks.append(
            RoadmapWeek(
                week_number=1,
                theme="Reinforce Verified Strengths & Deep Fundamentals",
                focus_objective=(
                    f"Consolidate your strongest proven skills ({', '.join(s.topic_name for s in w1_topics)}). "
                    "Master low-level internals, memory lifecycle, and articulation of past project design choices."
                ),
                estimated_weekly_hours=len(w1_topics) * 6,
                topics=w1_topics,
            )
        )

        # ----------------------------------------------------
        # Week 2: High-Priority Gap Closure (Must-Haves)
        # ----------------------------------------------------
        w2_topics: List[RoadmapTopicItem] = []
        target_gaps = must_haves[:3] if must_haves else ["Docker & Containerization", "Database Indexing Tuning"]
        for gap in target_gaps:
            info = TECH_KNOWLEDGE_BASE.get(gap.lower(), DEFAULT_TOPIC_DETAILS)
            w2_topics.append(
                RoadmapTopicItem(
                    topic_name=gap,
                    category=info["category"],
                    priority="high",
                    estimated_hours=8,
                    key_concepts=info["concepts"][:3],
                    recommended_practice_focus=info["practice"],
                )
            )

        weeks.append(
            RoadmapWeek(
                week_number=2,
                theme="High-Priority Gap Closure (Must-Haves in JD)",
                focus_objective=(
                    f"Directly target missing essential tools ({', '.join(s.topic_name for s in w2_topics)}). "
                    "Acquire practical working fluency to answer core technical questions truthfully and confidently."
                ),
                estimated_weekly_hours=len(w2_topics) * 8,
                topics=w2_topics,
            )
        )

        # ----------------------------------------------------
        # Week 3: Secondary Skills & System Design Architecture
        # ----------------------------------------------------
        w3_topics: List[RoadmapTopicItem] = []
        secondary = good_to_haves[:2] if good_to_haves else ["Caching Strategies (Redis)", "Microservices Resiliency"]
        for sec in secondary:
            info = TECH_KNOWLEDGE_BASE.get(sec.lower(), DEFAULT_TOPIC_DETAILS)
            w3_topics.append(
                RoadmapTopicItem(
                    topic_name=sec,
                    category=info["category"],
                    priority="medium",
                    estimated_hours=6,
                    key_concepts=info["concepts"][:3],
                    recommended_practice_focus=info["practice"],
                )
            )
        # Add System Design topic
        w3_topics.append(
            RoadmapTopicItem(
                topic_name=f"System Design for {request.target_role}",
                category="System Architecture & Scalability",
                priority="medium",
                estimated_hours=6,
                key_concepts=[
                    "High Availability & Load Balancing",
                    "Database Sharding vs Read Replicas",
                    "CAP Theorem & Trade-off Evaluation",
                ],
                recommended_practice_focus=(
                    "Sketch an end-to-end architecture diagram on a whiteboard/paper for a typical service at scale."
                ),
            )
        )

        weeks.append(
            RoadmapWeek(
                week_number=3,
                theme="Secondary Tooling & Scalable System Design",
                focus_objective=(
                    "Elevate your candidacy from individual contributor to engineering partner by explaining trade-offs, "
                    "database scaling, and secondary architectural patterns."
                ),
                estimated_weekly_hours=sum(t.estimated_hours for t in w3_topics),
                topics=w3_topics,
            )
        )

        # ----------------------------------------------------
        # Week 4: Speed Quizzing, Behavioral Readiness & STAR Storytelling
        # ----------------------------------------------------
        w4_topics = [
            RoadmapTopicItem(
                topic_name="STAR / Google XYZ Storytelling Drill",
                category="Behavioral & Project Experience",
                priority="high",
                estimated_hours=6,
                key_concepts=[
                    "Explain technical challenges using: Situation, Task, Action, Result",
                    "Quantify operational impact (latency reduction, cost savings, uptime)",
                    "Handling difficult team trade-offs and post-mortem discussions",
                ],
                recommended_practice_focus="Practice speaking through your 3 main resume projects aloud in 2 minutes each.",
            ),
            RoadmapTopicItem(
                topic_name="Timed Topic Quizzes & Speed Drills",
                category="Exam & Assessment Readiness",
                priority="refresher",
                estimated_hours=6,
                key_concepts=[
                    "Rapid code output prediction & debugging",
                    "General aptitude speed math & pattern recognition",
                    "Time management in live technical screens",
                ],
                recommended_practice_focus="Complete at least 5 JobMate AI topic quizzes with score above 80%.",
            ),
        ]

        weeks.append(
            RoadmapWeek(
                week_number=4,
                theme="Mock Drills, Behavioral Stories & Final Polish",
                focus_objective=(
                    "Simulate real interview timing. Rehearse concise project descriptions using the STAR formula "
                    "and polish speed on common technical coding and aptitude questions."
                ),
                estimated_weekly_hours=12,
                topics=w4_topics,
            )
        )

        total_hours = sum(w.estimated_weekly_hours for w in weeks)

        return PreparationRoadmap(
            target_role=request.target_role,
            roadmap_version="v1.0.0-deterministic",
            total_estimated_hours=total_hours,
            weeks=weeks,
            matched_skills_covered=len(w1_topics),
            gaps_targeted=len(w2_topics) + len(w3_topics) - 1,
        )


roadmap_service = RoadmapService()
