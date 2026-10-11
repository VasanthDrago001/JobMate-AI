import type { HealthStatus } from '../types/api';
import type {
  BackendAnalysisResponse,
  BackendBulletImprovementRequest,
  BackendBulletImprovementResponse,
  BackendErrorPayload,
  BackendValidationErrorDetail,
} from '../types/backend';

/**
 * Reusable API Client Configuration
 * Base URL defaults to VITE_API_BASE_URL if set, or local FastAPI server.
 * Backend secrets must NEVER be put in VITE_ variables.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiClientError extends Error {
  statusCode?: number;
  data?: unknown;

  constructor(message: string, statusCode?: number, data?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Extracts a human-readable error message from backend error responses.
 */
export function formatBackendErrorMessage(status?: number, errorBody?: unknown): string {
  if (status === 413) {
    return 'The uploaded resume file exceeds the 5 MB limit. Please upload a smaller PDF.';
  }

  if (typeof errorBody === 'object' && errorBody !== null) {
    const payload = errorBody as BackendErrorPayload;
    if (typeof payload.detail === 'string') {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map((item: BackendValidationErrorDetail) => {
          const field = item.loc ? item.loc[item.loc.length - 1] : 'Field';
          return `${field}: ${item.msg}`;
        })
        .join('; ');
      return messages || 'Validation failed. Please verify your inputs.';
    }
  }

  if (typeof errorBody === 'string' && errorBody.length > 0 && errorBody.length < 300) {
    return errorBody;
  }

  if (status === 400) {
    return 'Invalid request. Please ensure you upload a valid PDF document and accept the processing consent.';
  }
  if (status === 422) {
    return 'Input validation failed. Please check your job description and resume document.';
  }
  if (status === 503 || status === 504) {
    return 'The analysis service is temporarily busy or timed out. Please try again.';
  }
  if (status && status >= 500) {
    return 'The backend server encountered an internal error. Please check server logs and try again.';
  }

  return 'Unable to complete request. Please verify your network connection and backend status.';
}

/**
 * Generic reusable fetch wrapper with timeout, JSON decoding and friendly error handling.
 */
export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 25000, headers, ...restOptions } = options;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: options.signal || controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const friendlyMessage = formatBackendErrorMessage(response.status, errorBody);
      throw new ApiClientError(friendlyMessage, response.status, errorBody);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof ApiClientError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiClientError(
          `Request timed out after ${timeoutMs / 1000} seconds. The backend took too long to respond.`,
          504
        );
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new ApiClientError(
          `Unable to connect to JobMate AI backend at ${API_BASE_URL}. Please ensure the backend server is running on port 8000.`,
          0
        );
      }
      throw new ApiClientError(err.message);
    }
    throw new ApiClientError('An unknown network error occurred');
  }
}

/**
 * Typed API Service for FastAPI backend endpoints
 */
export const api = {
  /**
   * Health check query to verify backend connectivity.
   */
  async checkHealth(): Promise<HealthStatus> {
    return apiFetch<HealthStatus>('/health', { timeoutMs: 4000 });
  },

  /**
   * Ingest resume PDF and Job Description via POST /api/v1/analyses (multipart/form-data)
   */
  async analyzeResume(
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<BackendAnalysisResponse> {
    // Note: Do not pass Content-Type header so browser automatically sets boundary multipart
    return apiFetch<BackendAnalysisResponse>('/api/v1/analyses', {
      method: 'POST',
      body: formData,
      timeoutMs: options.timeoutMs ?? 30000,
      signal: options.signal,
    });
  },

  /**
   * Request AI resume bullet improvements via POST /api/v1/bullets/improve
   */
  async improveBullets(
    request: BackendBulletImprovementRequest,
    options: RequestOptions = {}
  ): Promise<BackendBulletImprovementResponse> {
    return apiFetch<BackendBulletImprovementResponse>('/api/v1/bullets/improve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      timeoutMs: options.timeoutMs ?? 20000,
      signal: options.signal,
    });
  },
};
