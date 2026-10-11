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
