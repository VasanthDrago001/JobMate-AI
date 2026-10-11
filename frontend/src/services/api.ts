import type { HealthStatus } from '../types/api';

/**
 * Reusable API Client Configuration
 * Base URL defaults to VITE_API_BASE_URL if set, or local FastAPI server.
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
 * Generic reusable fetch wrapper with timeout, JSON decoding and strict error handling.
 */
export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 10000, headers, ...restOptions } = options;

  // Ensure leading slash consistency
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
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiClientError(
        `API request failed with status ${response.status}`,
        response.status,
        errorBody
      );
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof ApiClientError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiClientError(`Request timeout after ${timeoutMs}ms`);
      }
      throw new ApiClientError(err.message);
    }
    throw new ApiClientError('An unknown network error occurred');
  }
}

/**
 * Specific API Service Endpoints
 */
export const api = {
  /**
   * Health check query to verify backend connectivity.
   */
  async checkHealth(): Promise<HealthStatus> {
    return apiFetch<HealthStatus>('/health');
  },
};
