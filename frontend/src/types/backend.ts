/**
 * TypeScript interfaces strictly mirroring FastAPI / Pydantic backend models.
 */

export interface HealthStatus {
  status: 'ok' | 'error';
  service: string;
  version: string;
  environment: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface BackendResumeMetadata {
  file_name: string;
  file_size_bytes: number;
  page_count: number;
  character_count: number;
  word_count: number;
  detected_sections: string[];
  is_text_based: boolean;
}

export interface BackendJobDescriptionMetadata {
  target_role: string | null;
  character_count: number;
  word_count: number;
}

export interface BackendEvaluatedSkill {
  skill_id: string;
  name: string;
  category: string;
  status: 'matched' | 'partial' | 'not_found_in_resume';
  matched_term: string | null;
  evidence_snippet: string | null;
  weight: number;
  explanation: string | null;
}

export interface BackendMatchSummary {
  total_requirements: number;
  matched_count: number;
  partial_count: number;
  not_found_count: number;
  earned_weight?: number;
  total_possible_weight?: number;
}

export interface BackendDeterministicSkillAnalysis {
  status: 'completed' | 'unable_to_score';
  score: number | null;
  scoring_method_version: string;
  message: string;
  scoring_formula: string;
  summary: BackendMatchSummary;
  matched_skills: BackendEvaluatedSkill[];
  partial_skills: BackendEvaluatedSkill[];
  not_found_skills: BackendEvaluatedSkill[];
  all_requirements: BackendEvaluatedSkill[];
  disclaimer_honest_scoring: string;
  disclaimer_not_found_skills: string;
}

export interface BackendBulletSuggestion {
  id: string;
  original_bullet: string;
  suggested_rewrite: string;
  reason: string;
  framework: 'Google XYZ Formula' | 'STAR Method';
  targeted_skills: string[];
  needs_confirmation: boolean;
  confirmation_prompt: string | null;
}

export interface BackendAnalysisResponse {
  analysis_id: string;
  status: string;
  created_at: string;
  resume_metadata: BackendResumeMetadata;
  job_description_metadata: BackendJobDescriptionMetadata;
  analysis_result: BackendDeterministicSkillAnalysis;
  bullet_improvements: BackendBulletSuggestion[];
  placeholder_analysis?: {
    phase: string;
    status: string;
    message: string;
    disclaimer: string;
    section_character_counts?: Record<string, number>;
  };
}

export interface BackendBulletImprovementRequest {
  bullets: string[];
  target_role?: string;
  target_skills?: string[];
}

export interface BackendBulletImprovementResponse {
  suggestions: BackendBulletSuggestion[];
  model_used: string;
  usage_remaining_today?: number;
  is_fallback: boolean;
  disclaimer: string;
}

export interface BackendValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface BackendErrorPayload {
  detail?: string | BackendValidationErrorDetail[];
}
