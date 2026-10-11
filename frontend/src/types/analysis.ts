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
}

export interface MissingSkill {
  name: string;
  category: SkillCategory;
  importance: 'Must-Have' | 'Good-to-Have';
  recommendation: string;
}

export interface BulletImprovement {
  id: string;
  originalBullet: string;
  suggestedBullet: string;
  framework: 'Google XYZ Formula' | 'STAR Method';
  metricsGuidance: string;
  targetedSkills: string[];
}

export interface KeywordCoverage {
  percentage: number;
  matchedCount: number;
  missingCount: number;
  totalIdentified: number;
}

export interface AnalysisResult {
  id: string;
  targetRole: string;
  resumeFileName: string;
  analyzedAt: string;
  keywordCoverage: KeywordCoverage;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  bulletImprovements: BulletImprovement[];
  honestDisclaimer: string;
  isMockDemo?: boolean;
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

export type AppView = 'landing' | 'analyzer' | 'results' | 'privacy';
