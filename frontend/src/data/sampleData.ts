import type { AnalysisResult } from '../types/analysis';

/**
 * Sample job description representing a Senior Backend / Full-Stack Engineer role
 * at high-growth Indian IT product/startup standard (Bengaluru, Pune, or Remote).
 */
export const SAMPLE_JOB_DESCRIPTION = `Job Title: Senior Backend / Full-Stack Engineer (SDE-2)
Location: Bengaluru / Pune / Remote (India)

About the Role:
We are looking for an experienced Software Engineer with 2-5 years of experience to design, build, and scale our core payment and workflow microservices. You will work in a fast-paced environment handling millions of transactions per day.

Key Responsibilities:
- Design, build, and deploy robust, high-performance RESTful APIs and background workers using Python (FastAPI/Django) and Node.js/TypeScript.
- Build responsive frontend dashboards using React and TypeScript.
- Architect scalable database schemas, optimize queries, and maintain transactional integrity in PostgreSQL and Redis.
- Deploy, monitor, and scale containerized services using Docker and Kubernetes (EKS) on AWS.
- Collaborate with product managers and follow Agile/Scrum engineering practices with automated CI/CD pipelines (GitHub Actions).

Requirements:
- 2+ years of professional backend engineering experience in Python (FastAPI or Django) or TypeScript.
- Strong knowledge of relational databases (PostgreSQL preferred) including indexing, query optimization, and transactions.
- Hands-on experience with frontend frameworks, preferably React with TypeScript.
- Working knowledge of Docker containerization and CI/CD pipelines.
- Experience with Redis caching and asynchronous queues (Celery/RabbitMQ) is preferred.
- Familiarity with Kubernetes cluster deployment and AWS cloud infrastructure is a major plus.
- Bachelor's degree in Computer Science, Information Technology, or equivalent practical experience.`;

/**
 * Standard synthetic candidate resume file name for demo analysis preview.
 */
export const SAMPLE_RESUME_FILENAME = 'Vasanth_Kumar_Resume_Backend_2026.pdf';

/**
 * Verified sample analysis result demonstrating alignment scoring,
 * evidence extraction, gap categorization, and truthful STAR/XYZ bullet rewrites.
 */
export const SAMPLE_ANALYSIS_RESULT: AnalysisResult = {
  id: 'jm-analysis-9482f710',
  targetRole: 'Senior Backend / Full-Stack Engineer (SDE-2)',
  resumeFileName: SAMPLE_RESUME_FILENAME,
  analyzedAt: new Date().toISOString(),
  keywordCoverage: {
    percentage: 72,
    matchedCount: 13,
    missingCount: 5,
    totalIdentified: 18,
  },
  honestDisclaimer:
    'This score reflects keyword alignment and contextual evidence overlap with your submitted Job Description. Hiring decisions are made by human technical interviewers based on verified experience.',
  isMockDemo: true,
  matchedSkills: [
    {
      name: 'Python',
      category: 'Languages',
      evidenceSnippet:
        'Architected and deployed asynchronous backend microservices in Python 3.11 handling 15,000 daily transaction webhooks.',
      section: 'Work Experience — Software Engineer',
      pageNumber: 1,
    },
    {
      name: 'FastAPI',
      category: 'Frameworks & Libraries',
      evidenceSnippet:
        'Migrated legacy monolith endpoints to FastAPI with Pydantic v2 validation, decreasing average API response latency by 32%.',
      section: 'Work Experience — Software Engineer',
      pageNumber: 1,
    },
    {
      name: 'React',
      category: 'Frameworks & Libraries',
      evidenceSnippet:
        'Built dynamic administrative portals using React 18, TypeScript, and TanStack Query with reusable modular components.',
      section: 'Work Experience — Software Engineer',
      pageNumber: 1,
    },
    {
      name: 'TypeScript',
      category: 'Languages',
      evidenceSnippet:
        'Maintained strict TypeScript codebase with zero runtime any types across 4 internal enterprise tools.',
      section: 'Projects & Work Experience',
      pageNumber: 1,
    },
    {
      name: 'PostgreSQL',
      category: 'Databases',
      evidenceSnippet:
        'Engineered PostgreSQL schema migrations, indexed high-cardinality foreign keys, and resolved N+1 ORM query bottlenecks.',
      section: 'Work Experience — Software Engineer',
      pageNumber: 1,
    },
    {
      name: 'Redis',
      category: 'Databases',
      evidenceSnippet:
        'Implemented distributed token bucket rate limiting and session caching layer with Redis clusters.',
      section: 'Technical Achievements',
      pageNumber: 2,
    },
    {
      name: 'RESTful APIs',
      category: 'Architecture & Concepts',
      evidenceSnippet:
        'Authored OpenAPI 3.0 compliant RESTful API specifications with comprehensive swagger documentation for banking partner integrations.',
      section: 'Work Experience — Software Engineer',
      pageNumber: 1,
    },
    {
      name: 'Docker',
      category: 'Cloud & DevOps',
      evidenceSnippet:
        'Containerized 6 standalone services using multi-stage Docker builds, reducing base image sizes by 65%.',
      section: 'DevOps & Tooling',
      pageNumber: 2,
    },
    {
      name: 'CI/CD & GitHub Actions',
      category: 'Cloud & DevOps',
      evidenceSnippet:
        'Configured GitHub Actions CI workflows executing automated pytest test suites and linting on every pull request.',
      section: 'DevOps & Tooling',
      pageNumber: 2,
    },
    {
      name: 'Agile & Scrum',
      category: 'Architecture & Concepts',
      evidenceSnippet:
        'Participated in bi-weekly sprint planning, backlog refinement, and engineering peer reviews following Agile practices.',
      section: 'Work Experience — Software Engineer',
      pageNumber: 2,
    },
    {
      name: 'Query Optimization',
      category: 'Architecture & Concepts',
      evidenceSnippet:
        'Analyzed EXPLAIN ANALYZE execution plans to rewrite slow SQL queries, reducing p99 response times.',
      section: 'Technical Achievements',
      pageNumber: 1,
    },
    {
      name: 'Git',
      category: 'Tools & Testing',
      evidenceSnippet:
        'Managed feature branch workflows, code reviews, and semantic release tagging using Git.',
      section: 'Core Competencies',
      pageNumber: 2,
    },
    {
      name: 'Unit Testing & Pytest',
      category: 'Tools & Testing',
      evidenceSnippet:
        'Achieved 88% test coverage across core billing domain logic using pytest and mock fixtures.',
      section: 'Quality Assurance',
      pageNumber: 2,
    },
  ],
  missingSkills: [
    {
      name: 'Kubernetes (K8s)',
      category: 'Cloud & DevOps',
      importance: 'Must-Have',
      recommendation:
        'The JD explicitly seeks experience deploying workloads on Kubernetes (EKS). If you have created Helm charts, pod manifests, or managed deployments with kubectl, add a bullet point highlighting this in your projects or experience section.',
    },
    {
      name: 'AWS Cloud (EKS / EC2)',
      category: 'Cloud & DevOps',
      importance: 'Must-Have',
      recommendation:
        'AWS infrastructure is listed as a primary hosting platform. If you have utilized services like S3, RDS, CloudWatch, or EC2 in your previous roles, clarify your hands-on cloud experience.',
    },
    {
      name: 'Celery / RabbitMQ',
      category: 'Architecture & Concepts',
      importance: 'Good-to-Have',
      recommendation:
        'Asynchronous queueing is requested for transaction processing. If you have handled asynchronous job queues or message brokers, specify the library and use case.',
    },
    {
      name: 'Node.js',
      category: 'Languages',
      importance: 'Good-to-Have',
      recommendation:
        'The JD mentions Node.js as an alternate backend language option. Since you have strong TypeScript experience, noting any full-stack Node.js utilities could strengthen your profile.',
    },
    {
      name: 'Microservices Architecture',
      category: 'Architecture & Concepts',
      importance: 'Good-to-Have',
      recommendation:
        'While your resume notes standalone services, explicitly mentioning distributed service communication, RPC, or circuit breaker patterns will align better with senior-level expectations.',
    },
  ],
  bulletImprovements: [
    {
      id: 'bullet-1',
      originalBullet: 'Worked on backend bug fixes and built APIs for the user dashboard.',
      suggestedBullet:
        'Architected and deployed 12+ RESTful FastAPI endpoints for the core user dashboard, eliminating 40+ production defects and accelerating data ingestion throughput [Insert known metric or volume if applicable].',
      framework: 'Google XYZ Formula',
      metricsGuidance:
        'Quantify with real data if available: e.g., number of endpoints built, requests served per second, or percentage latency reduction.',
      targetedSkills: ['FastAPI', 'RESTful APIs', 'Python'],
    },
    {
      id: 'bullet-2',
      originalBullet: 'Wrote database queries and optimized tables in PostgreSQL.',
      suggestedBullet:
        'Optimized critical PostgreSQL database schemas and complex analytical queries using B-tree indexing and query refactoring, reducing slow query execution frequency by [Insert actual % or ms improvement].',
      framework: 'Google XYZ Formula',
      metricsGuidance:
        'Never invent a false latency metric. If you know the original vs. improved query time from PostgreSQL EXPLAIN ANALYZE, insert it truthfully here.',
      targetedSkills: ['PostgreSQL', 'Query Optimization', 'Database Indexing'],
    },
    {
      id: 'bullet-3',
      originalBullet: 'Used Docker to run applications in staging environment.',
      suggestedBullet:
        'Standardized multi-stage Docker containerization across 6 microservices, reducing container deployment cold-start times and streamlining CI/CD testing reproducibility.',
      framework: 'STAR Method',
      metricsGuidance:
        'Highlight the specific tools used (e.g., Docker Compose, multi-stage Dockerfiles) and any tangible reduction in build time or image footprint.',
      targetedSkills: ['Docker', 'CI/CD & GitHub Actions', 'Containerization'],
    },
  ],
};
