export type SkillCategory =
  | 'Languages'
  | 'Frameworks & Libraries'
  | 'Databases'
  | 'Cloud & DevOps'
  | 'Architecture & Concepts'
  | 'Tools & Testing';

export interface MatchedSkill {
  name: string;
  category: SkillCategory;
  evidenceSnippet: string;
  section: string;
  pageNumber?: number;
  status?: 'matched' | 'partial';
  matchedTerm?: string;
  explanation?: string;
}

export interface MissingSkill {
  name: string;
  category: SkillCategory;
  importance: 'Must-Have' | 'Good-to-Have';
  recommendation: string;
  explanation?: string;
}

export interface BulletImprovement {
  id: string;
  originalBullet: string;
  suggestedBullet: string;
  framework: 'Google XYZ Formula' | 'STAR Method';
  metricsGuidance: string;
  targetedSkills: string[];
  reason?: string;
  needsConfirmation?: boolean;
  confirmationPrompt?: string | null;
}

export interface KeywordCoverage {
  percentage: number;
  matchedCount: number;
  missingCount: number;
  totalIdentified: number;
  partialCount?: number;
}

export interface AnalysisResult {
  id: string;
  targetRole: string;
  resumeFileName: string;
  analyzedAt: string;
  keywordCoverage: KeywordCoverage;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  partialSkills?: MatchedSkill[];
  bulletImprovements: BulletImprovement[];
  honestDisclaimer: string;
  notFoundDisclaimer?: string;
  isMockDemo?: boolean;
  scoreStatus?: 'completed' | 'unable_to_score';
  scoreMessage?: string;
  scoringFormula?: string;
  scoringVersion?: string;
  detectedSections?: string[];
  pageCount?: number;
  wordCount?: number;
  isFallbackAi?: boolean;
}

export interface AnalysisFormData {
  resumeFile: File | null;
  resumeFileName: string;
  targetRole: string;
  jobDescription: string;
  consentGiven: boolean;
}

export type AnalysisStage =
  | 'idle'
  | 'uploading'
  | 'parsing_pdf'
  | 'matching_keywords'
  | 'evaluating_evidence'
  | 'synthesizing_bullets'
  | 'complete'
  | 'error';

export interface StageInfo {
  stage: AnalysisStage;
  progressPercent: number;
  title: string;
  description: string;
}

export type AppView = 'landing' | 'analyzer' | 'results' | 'jobs' | 'privacy';
