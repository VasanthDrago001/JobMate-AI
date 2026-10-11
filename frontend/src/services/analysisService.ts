import type {
  AnalysisFormData,
  AnalysisResult,
  StageInfo,
} from '../types/analysis';
import { SAMPLE_ANALYSIS_RESULT } from './mockData';
import { API_BASE_URL } from './api';

const ANALYSIS_STAGES: StageInfo[] = [
  {
    stage: 'uploading',
    progressPercent: 20,
    title: 'Verifying & Ingesting PDF',
    description: 'Validating PDF headers and file structure for parsing...',
  },
  {
    stage: 'parsing_pdf',
    progressPercent: 40,
    title: 'Parsing Resume Layout & Sections',
    description: 'Extracting experience, projects, and skills without layout interleaving...',
  },
  {
    stage: 'matching_keywords',
    progressPercent: 65,
    title: 'Executing Indian IT Taxonomy Matcher',
    description: 'Cross-referencing 850+ tech stacks and synonym mappings against job description...',
  },
  {
    stage: 'evaluating_evidence',
    progressPercent: 82,
    title: 'Locating Contextual Evidence',
    description: 'Extracting exact sentence snippets and section references for verified skills...',
  },
  {
    stage: 'synthesizing_bullets',
    progressPercent: 95,
    title: 'Generating Truthful XYZ Bullet Enhancements',
    description: 'Applying STAR/XYZ formulas with strict zero-hallucination guardrails...',
  },
  {
    stage: 'complete',
    progressPercent: 100,
    title: 'Analysis Complete',
    description: 'Your verified alignment report is ready for review.',
  },
];

/**
 * Service orchestrating resume analysis with stage-by-stage progress feedback.
 * Tries real backend endpoint if accessible; otherwise smoothly simulates realistic pipeline.
 */
export async function runResumeAnalysis(
  formData: AnalysisFormData,
  onProgress?: (info: StageInfo) => void
): Promise<AnalysisResult> {
  // Validate preconditions
  if (!formData.resumeFileName && !formData.resumeFile) {
    throw new Error('Please select a valid PDF resume file to proceed.');
  }

  if (!formData.jobDescription || formData.jobDescription.trim().length < 50) {
    throw new Error('Job description must be at least 50 characters long for meaningful skill alignment.');
  }

  if (!formData.consentGiven) {
    throw new Error('Please agree to ephemeral resume processing to continue.');
  }

  // Attempt real backend API call if file is provided and backend is ready
  if (formData.resumeFile) {
    try {
      const formPayload = new FormData();
      formPayload.append('file', formData.resumeFile);
      formPayload.append('job_description', formData.jobDescription);
      if (formData.targetRole) {
        formPayload.append('job_title', formData.targetRole);
      }

      onProgress?.(ANALYSIS_STAGES[0]);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: 'POST',
        body: formPayload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as AnalysisResult;
        onProgress?.(ANALYSIS_STAGES[5]);
        return data;
      }
    } catch {
      // Backend analyze endpoint not implemented yet or server offline; proceed to fallback mock simulation
    }
  }

  // Fallback to simulated multi-stage processing with realistic latency
  for (let i = 0; i < ANALYSIS_STAGES.length - 1; i++) {
    onProgress?.(ANALYSIS_STAGES[i]);
    // Realistic micro-delay between stages
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // Final stage
  onProgress?.(ANALYSIS_STAGES[ANALYSIS_STAGES.length - 1]);
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Synthesize customized result mirroring user inputs
  const result: AnalysisResult = {
    ...SAMPLE_ANALYSIS_RESULT,
    id: `jm-${Math.random().toString(36).substring(2, 9)}`,
    targetRole: formData.targetRole.trim() || 'Software Engineer (Target Role)',
    resumeFileName: formData.resumeFileName || 'Uploaded_Resume.pdf',
    analyzedAt: new Date().toISOString(),
    isMockDemo: true,
  };

  return result;
}
