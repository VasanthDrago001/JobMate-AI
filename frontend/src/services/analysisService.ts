import type {
  AnalysisFormData,
  AnalysisResult,
  BulletImprovement,
  MatchedSkill,
  MissingSkill,
  SkillCategory,
  StageInfo,
} from '../types/analysis';
import type { BackendAnalysisResponse } from '../types/backend';
import { api } from './api';

const ANALYSIS_STAGES: StageInfo[] = [
  {
    stage: 'uploading',
    progressPercent: 20,
    title: 'Verifying & Ingesting PDF',
    description: 'Validating PDF headers and ephemeral file structure...',
  },
  {
    stage: 'parsing_pdf',
    progressPercent: 45,
    title: 'Parsing Resume Layout & Digital Text',
    description: 'Extracting experience, projects, and skills without layout interleaving...',
  },
  {
    stage: 'matching_keywords',
    progressPercent: 70,
    title: 'Executing Deterministic Skill Matcher',
    description: 'Cross-referencing technology taxonomy and synonym mappings against job description...',
  },
  {
    stage: 'evaluating_evidence',
    progressPercent: 88,
    title: 'Locating Contextual Evidence & Synthesizing Bullets',
    description: 'Extracting exact sentence snippets and verifying STAR/XYZ bullet rewrites...',
  },
  {
    stage: 'complete',
    progressPercent: 100,
    title: 'Analysis Complete',
    description: 'Your verified alignment report is ready for review.',
  },
];

/**
 * Standardizes backend category strings into frontend SkillCategory values.
 */
function normalizeCategory(cat: string): SkillCategory {
  const c = cat.toLowerCase();
  if (c.includes('lang')) return 'Languages';
  if (c.includes('frame') || c.includes('lib')) return 'Frameworks & Libraries';
  if (c.includes('data') || c.includes('sql') || c.includes('redis') || c.includes('mongo')) return 'Databases';
  if (c.includes('cloud') || c.includes('devops') || c.includes('docker') || c.includes('k8s')) return 'Cloud & DevOps';
  if (c.includes('concept') || c.includes('arch') || c.includes('api') || c.includes('design')) return 'Architecture & Concepts';
  return 'Tools & Testing';
}

/**
 * Creates a valid text-based PDF File in memory if the user clicks 'Load Sample Profile'
 * without selecting a physical file from their desktop.
 */
export function createSampleResumePdfFile(): File {
  const validPdfSource = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 260 >>
stream
BT
/F1 12 Tf
72 712 Td
(Vasanth Kumar - Senior Software Engineer) Tj
0 -20 Td
(Technical Skills: Python, FastAPI, Django, React, TypeScript, PostgreSQL, Docker, Git, REST APIs, Redis) Tj
0 -20 Td
(Work Experience: Engineered high-throughput REST APIs and microservices using FastAPI and Python 3.11.) Tj
0 -20 Td
(Optimized complex database queries on PostgreSQL, reducing slow query latency.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000326 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
638
%%EOF
`;
  const blob = new Blob([validPdfSource], { type: 'application/pdf' });
  return new File([blob], 'Vasanth_Kumar_Senior_Software_Engineer.pdf', {
    type: 'application/pdf',
  });
}

/**
 * Transforms backend response into frontend presentation model.
 */
export function mapBackendResponseToResult(
  data: BackendAnalysisResponse,
  fallbackTargetRole: string
): AnalysisResult {
  const analysis = data.analysis_result;

  const matchedSkills: MatchedSkill[] = analysis.matched_skills.map((s) => ({
    name: s.name,
    category: normalizeCategory(s.category),
    evidenceSnippet: s.evidence_snippet || `Verified in resume text (${s.matched_term || s.name})`,
    section: 'Work Experience & Skills',
    status: 'matched',
    matchedTerm: s.matched_term || undefined,
    explanation: s.explanation || undefined,
  }));

  const partialSkills: MatchedSkill[] = analysis.partial_skills.map((s) => ({
    name: s.name,
    category: normalizeCategory(s.category),
    evidenceSnippet: s.evidence_snippet || `Related skill foundation detected`,
    section: 'Related Qualifications',
    status: 'partial',
    matchedTerm: s.matched_term || undefined,
    explanation: s.explanation || undefined,
  }));

  const missingSkills: MissingSkill[] = analysis.not_found_skills.map((s) => ({
    name: s.name,
    category: normalizeCategory(s.category),
    importance: s.weight >= 1.1 ? 'Must-Have' : 'Good-to-Have',
    recommendation:
      s.explanation ||
      `Keyword '${s.name}' was not detected in the submitted resume. If you possess this experience, consider truthfully adding relevant project accomplishments.`,
    explanation: s.explanation || undefined,
  }));

  const bulletImprovements: BulletImprovement[] = (data.bullet_improvements || []).map((b) => ({
    id: b.id,
    originalBullet: b.original_bullet,
    suggestedBullet: b.suggested_rewrite,
    framework: b.framework,
    metricsGuidance: b.confirmation_prompt || b.reason,
    targetedSkills: b.targeted_skills,
    reason: b.reason,
    needsConfirmation: b.needs_confirmation,
    confirmationPrompt: b.confirmation_prompt,
  }));

  return {
    id: data.analysis_id,
    targetRole:
      data.job_description_metadata.target_role ||
      fallbackTargetRole.trim() ||
      'Software Engineer (Target Role)',
    resumeFileName: data.resume_metadata.file_name,
    analyzedAt: data.created_at,
    keywordCoverage: {
      percentage: analysis.score !== null ? analysis.score : 0,
      matchedCount: analysis.summary.matched_count,
      missingCount: analysis.summary.not_found_count,
      totalIdentified: analysis.summary.total_requirements,
      partialCount: analysis.summary.partial_count,
    },
    matchedSkills,
    partialSkills,
    missingSkills,
    bulletImprovements,
    honestDisclaimer: analysis.disclaimer_honest_scoring,
    notFoundDisclaimer: analysis.disclaimer_not_found_skills,
    scoreStatus: analysis.status,
    scoreMessage: analysis.message,
    scoringFormula: analysis.scoring_formula,
    scoringVersion: analysis.scoring_method_version,
    detectedSections: data.resume_metadata.detected_sections,
    pageCount: data.resume_metadata.page_count,
    wordCount: data.resume_metadata.word_count,
    isMockDemo: false,
  };
}

/**
 * Service orchestrating resume analysis with stage-by-stage progress feedback.
 * Calls real FastAPI backend endpoint POST /api/v1/analyses.
 */
export async function runResumeAnalysis(
  formData: AnalysisFormData,
  onProgress?: (info: StageInfo) => void
): Promise<AnalysisResult> {
  // 1. Validate preconditions
  if (!formData.resumeFileName && !formData.resumeFile) {
    throw new Error('Please select a valid PDF resume file to proceed.');
  }

  const cleanJd = formData.jobDescription.trim();
  if (!cleanJd || cleanJd.length < 50) {
    throw new Error(
      'Job description must be at least 50 characters long for meaningful skill alignment.'
    );
  }

  if (cleanJd.length > 10000) {
    throw new Error('Job description exceeds maximum allowed length of 10,000 characters.');
  }

  if (!formData.consentGiven) {
    throw new Error(
      "Explicit user consent under India's DPDP Act 2023 is required to process your resume."
    );
  }

  // 2. Prepare File: If user loaded sample without uploading a physical file, synthesize a valid text PDF
  const fileToUpload = formData.resumeFile || createSampleResumePdfFile();

  // 3. Construct multipart/form-data payload
  const formPayload = new FormData();
  formPayload.append('file', fileToUpload, fileToUpload.name);
  formPayload.append('job_description', cleanJd);
  if (formData.targetRole && formData.targetRole.trim()) {
    formPayload.append('target_role', formData.targetRole.trim());
  }
  formPayload.append('consent', 'true');

  // 4. Progress stages
  onProgress?.(ANALYSIS_STAGES[0]);

  // Advance to parsing state
  setTimeout(() => onProgress?.(ANALYSIS_STAGES[1]), 350);
  setTimeout(() => onProgress?.(ANALYSIS_STAGES[2]), 800);
  setTimeout(() => onProgress?.(ANALYSIS_STAGES[3]), 1400);

  // 5. Execute API Call
  const backendResponse = await api.analyzeResume(formPayload);

  // 6. Final complete state
  onProgress?.(ANALYSIS_STAGES[4]);

  return mapBackendResponseToResult(backendResponse, formData.targetRole);
}
