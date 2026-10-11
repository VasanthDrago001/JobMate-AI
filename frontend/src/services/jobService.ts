import { apiFetch } from './api';
import type { JobFilterParams, JobSearchResponseUI } from '../types/jobFinder';

export const jobService = {
  /**
   * Search real tech vacancies aligned with candidate skills.
   */
  async searchJobs(
    filter: JobFilterParams,
    candidateSkills: string[] = []
  ): Promise<JobSearchResponseUI> {
    const payload = {
      role: filter.role.trim() || 'Software Engineer',
      location: filter.location.trim() || 'Bengaluru',
      work_mode: filter.workMode,
      experience_level: filter.experienceLevel,
      candidate_skills: candidateSkills,
      page: filter.page || 1,
      page_size: filter.pageSize || 10,
    };

    return apiFetch<JobSearchResponseUI>('/api/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeoutMs: 15000,
    });
  },

  /**
   * Retrieve list of supported Indian IT tech hub locations.
   */
  async getLocations(): Promise<string[]> {
    return apiFetch<string[]>('/api/v1/jobs/locations', {
      timeoutMs: 5000,
    });
  },
};
