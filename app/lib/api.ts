import { Platform } from 'react-native';

const DEFAULT_BASE_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

let baseUrl = DEFAULT_BASE_URL;

export function setApiBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  return baseUrl;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    duration?: number;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers = {}, signal } = options;

  let url = `${baseUrl}/api${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const fetchHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined && { 'Content-Type': 'application/json' }),
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new ApiClientError(
      'PARSE_ERROR',
      `Failed to parse response as JSON (status ${response.status})`,
      response.status,
    );
  }

  if (!response.ok || json.success === false) {
    const err = json as ApiError;
    throw new ApiClientError(
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? 'Request failed',
      response.status,
      err.error?.details,
    );
  }

  return (json as ApiResponse<T>).data ?? json;
}

export const api = {
  health: {
    check: () => request<{ status: string; version: string }>('/health'),
    metrics: () => request('/health/metrics'),
    dependencies: () => request('/health/dependencies'),
  },

  sessions: {
    list: (params?: { page?: number; limit?: number }) =>
      request('/sessions', { params }),
    get: (id: string) => request(`/sessions/${id}`),
    replay: (id: string, body: { speed?: number }) =>
      request(`/sessions/${id}/replay`, { method: 'POST', body }),
  },

  providers: {
    list: (params?: { page?: number; limit?: number }) =>
      request('/providers', { params }),
    get: (id: string) => request(`/providers/${id}`),
    validate: (body: { providerId: string; apiKey: string }) =>
      request('/providers/validate', { method: 'POST', body }),
  },

  models: {
    list: (params?: { page?: number; limit?: number }) =>
      request('/models', { params }),
    compare: (body: { modelIds: string[] }) =>
      request('/models/compare', { method: 'POST', body }),
  },

  stats: {
    list: (params?: { page?: number; limit?: number }) =>
      request('/stats', { params }),
    get: (id: string) => request(`/stats/${id}`),
  },

  users: {
    profile: () => request('/users/profile'),
    preferences: () => request('/users/preferences'),
    updatePreferences: (body: Record<string, unknown>) =>
      request('/users/preferences', { method: 'PUT', body }),
    history: (params?: { page?: number; limit?: number }) =>
      request('/users/history', { params }),
  },

  webhooks: {
    list: (params?: { page?: number; limit?: number }) =>
      request('/webhooks', { params }),
    create: (body: { url: string; events: string[] }) =>
      request('/webhooks', { method: 'POST', body }),
    delete: (id: string) =>
      request(`/webhooks/${id}`, { method: 'DELETE' }),
    test: (id: string) =>
      request(`/webhooks/${id}/test`, { method: 'POST' }),
  },

  analytics: {
    daily: (params?: { startDate?: string; endDate?: string }) =>
      request('/analytics/daily', { params }),
    weekly: (params?: { startDate?: string; endDate?: string }) =>
      request('/analytics/weekly', { params }),
    monthly: (params?: { startDate?: string; endDate?: string }) =>
      request('/analytics/monthly', { params }),
    byLanguage: () => request('/analytics/by-language'),
    byModel: () => request('/analytics/by-model'),
    trends: () => request('/analytics/trends'),
  },

  configs: {
    generate: (body: { providerId: string; modelId: string; preset?: string }) =>
      request('/configs/generate', { method: 'POST', body }),
    validate: (body: { config: Record<string, unknown> }) =>
      request('/configs/validate', { method: 'POST', body }),
    parse: (body: { content: string; format: string }) =>
      request('/configs/parse', { method: 'POST', body }),
  },

  commands: {
    execute: (body: { command: string; args?: string[] }) =>
      request('/commands/execute', { method: 'POST', body }),
    status: (id: string) => request(`/commands/${id}/status`),
    logs: (id: string) => request(`/commands/${id}/logs`),
  },
};

export { ApiClientError };
export type { ApiResponse, ApiError };
