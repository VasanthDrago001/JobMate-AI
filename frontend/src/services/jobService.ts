import { apiFetch } from './api';
import type { JobFilterParams, JobSearchResponseUI } from '../types/jobFinder';

export const jobService = {
  /**
   * Searches real tech vacancies from authorized sources and evaluates alignment.
   *
   * Sends role keyword, target location, work mode, experience tier, sorting mode,
   * pagination page/size, and verified candidate skills.
   *
   * @param filter Filter criteria selected by candidate.
   * @param candidateSkills Verified technical skills from candidate resume.
   * @returns JobSearchResponseUI containing ranked vacancies, match scores, and pagination.
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
      sort_by: filter.sortBy || 'match',
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
   * Retrieves list of supported Indian IT tech hub locations from the backend.
   *
   * @returns Array of supported city strings (e.g. Bengaluru, Hyderabad, Pune, etc.).
   */
  async getLocations(): Promise<string[]> {
    return apiFetch<string[]>('/api/v1/jobs/locations', {
      timeoutMs: 5000,
    });
  },
};
