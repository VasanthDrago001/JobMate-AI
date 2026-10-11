export type WorkModeFilter = 'all' | 'remote' | 'hybrid' | 'on-site';
export type ExperienceLevelFilter = 'all' | 'entry' | 'mid' | 'senior';

export interface JobFilterParams {
  role: string;
  location: string;
  workMode: WorkModeFilter;
  experienceLevel: ExperienceLevelFilter;
  candidateSkills?: string[];
  page: number;
  pageSize?: number;
}

export interface SkillMatchEvidenceUI {
  skill_name: string;
  status: 'matched' | 'missing' | 'partial';
  resume_evidence_snippet?: string | null;
  importance: 'Required' | 'Preferred';
}

export interface JobListingUI {
  id: string;
  source: 'adzuna' | 'greenhouse' | 'lever' | 'verified_curated';
  title: string;
  company_name: string;
  company_logo_url?: string | null;
  location: string;
  work_mode: 'Remote' | 'Hybrid' | 'On-site' | 'Not Specified';
  salary_display: string;
  description_snippet: string;
  posting_date?: string | null;
  last_verified_at: string;
  application_url: string;
  match_score_percentage: number;
  matched_skills_count: number;
  total_required_skills_count: number;
  skills_breakdown: SkillMatchEvidenceUI[];
  match_summary_explanation: string;
  is_expired: boolean;
}

export interface JobSearchResponseUI {
  results: JobListingUI[];
  total_matches_found: number;
  current_page: number;
  has_more: boolean;
  source_attribution: string;
  attribution_logo_url?: string | null;
  cached: boolean;
}
