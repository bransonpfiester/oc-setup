import type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  Stat,
  StatCreate,
  StatUpdate,
  StatCategory,
  Provider,
  ProviderDetailResponse,
  ProviderValidateRequest,
  ProviderValidateResponse,
  Model,
  ModelCompareRequest,
  ModelCompareResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
  ConfigValidateRequest,
  ConfigValidateResponse,
  ConfigParseRequest,
  ConfigParseResponse,
  HealthStatus,
  HealthMetrics,
  HealthDependenciesResponse,
  UserProfile,
  UserPreferences,
  UserPreferencesUpdate,
  UserHistoryEntry,
  Session,
  SessionDetailResponse,
  SessionReplayRequest,
  SessionReplayResponse,
  CommandExecuteRequest,
  CommandExecuteResponse,
  CommandStatusResponse,
  CommandLogsResponse,
  Webhook,
  WebhookRegisterRequest,
  WebhookTestResponse,
  AnalyticsDailyResponse,
  AnalyticsWeeklyResponse,
  AnalyticsMonthlyResponse,
  AnalyticsByLanguageResponse,
  AnalyticsByModelResponse,
  AnalyticsTrendsResponse,
} from "@/types/api";

/**
 * Filter parameters shared across all analytics endpoints.
 */
export interface AnalyticsFilterParams {
  /** ISO 8601 start date for the analytics period. */
  from?: string;
  /** ISO 8601 end date for the analytics period. */
  to?: string;
  /** Restrict results to specific provider identifiers. */
  providers?: string[];
  /** Restrict results to specific channel types (telegram, discord, slack, web, api). */
  channels?: string[];
  /** Restrict results to specific model identifiers. */
  models?: string[];
  /** Maximum number of data points to return. */
  limit?: number;
}

/**
 * Error thrown by the API client when the server returns a non-2xx response.
 * Extends the native Error with structured fields extracted from the API error body.
 */
export class ApiClientError extends Error {
  /** Machine-readable error code from the API or a derived HTTP status code. */
  public readonly code: string;
  /** HTTP status code of the failed response. */
  public readonly status: number;
  /** Additional structured error details returned by the API, if any. */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Fully typed, framework-agnostic HTTP client for the OpenClaw API.
 * Uses the Fetch API and works in both browser and Node.js environments.
 */
export class OpenClawApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    headers?: Record<string, string>;
  }) {
    this.baseUrl = (options?.baseUrl ?? "").replace(/\/+$/, "");
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    };
    if (options?.apiKey) {
      this.headers["Authorization"] = `Bearer ${options.apiKey}`;
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /**
   * Build a URL query string from a parameter object, stripping `undefined`
   * and `null` values. Arrays are serialised as comma-separated values.
   */
  private buildQuery(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length > 0) {
          searchParams.set(key, value.join(","));
        }
      } else {
        searchParams.set(key, String(value));
      }
    }

    const qs = searchParams.toString();
    return qs ? `?${qs}` : "";
  }

  /**
   * Central request dispatcher. Builds the full URL, serialises the body,
   * sends the request, and returns the parsed JSON envelope. Throws
   * {@link ApiClientError} for any non-2xx response.
   */
  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, unknown>;
    },
  ): Promise<ApiResponse<T>> {
    const query = options?.params
      ? this.buildQuery(options.params)
      : "";
    const url = `${this.baseUrl}${path}${query}`;

    const init: RequestInit = {
      method,
      headers: { ...this.headers },
    };

    if (options?.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      let errorBody: ApiError | undefined;
      try {
        errorBody = (await response.json()) as ApiError;
      } catch {
        /* non-JSON error body */
      }
      throw new ApiClientError(
        errorBody?.error?.message ?? response.statusText,
        errorBody?.error?.code ?? `HTTP_${response.status}`,
        response.status,
        errorBody?.error?.details,
      );
    }

    if (response.status === 204) {
      return { success: true, data: undefined as T };
    }

    return (await response.json()) as ApiResponse<T>;
  }

  // ──────────────────────────────────────────────
  // Stats
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve a paginated list of stats, optionally filtered by category, tags, or date range.
   * @param params - Optional filter and pagination parameters.
   * @param params.page - Page number for pagination (1-indexed).
   * @param params.limit - Maximum number of items per page.
   * @param params.category - Filter stats by category (performance, usage, cost, error, custom).
   * @param params.tags - Filter stats that contain any of the specified tags.
   * @param params.from - ISO 8601 start date for the date range filter.
   * @param params.to - ISO 8601 end date for the date range filter.
   * @returns A paginated list of Stat objects wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async listStats(params?: {
    page?: number;
    limit?: number;
    category?: StatCategory;
    tags?: string[];
    from?: string;
    to?: string;
  }): Promise<ApiResponse<PaginatedResponse<Stat>>> {
    return this.request<PaginatedResponse<Stat>>(
      "GET",
      "/api/stats",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Create a new stat entry with the given name, value, unit, and category.
   * @param data - The stat creation payload containing required fields.
   * @returns The newly created Stat object wrapped in an ApiResponse.
   * @throws {ApiClientError} When validation fails or the API returns a non-2xx status code.
   */
  async createStat(data: StatCreate): Promise<ApiResponse<Stat>> {
    return this.request<Stat>("POST", "/api/stats", { body: data });
  }

  /**
   * @description Retrieve a single stat by its unique identifier.
   * @param id - The unique identifier of the stat to retrieve.
   * @returns The requested Stat object wrapped in an ApiResponse.
   * @throws {ApiClientError} When the stat is not found or the API returns a non-2xx status code.
   */
  async getStat(id: string): Promise<ApiResponse<Stat>> {
    return this.request<Stat>(
      "GET",
      `/api/stats/${encodeURIComponent(id)}`,
    );
  }

  /**
   * @description Update an existing stat entry with partial data. Only provided fields are modified.
   * @param id - The unique identifier of the stat to update.
   * @param data - Partial update payload with fields to modify.
   * @returns The updated Stat object wrapped in an ApiResponse.
   * @throws {ApiClientError} When the stat is not found or the API returns a non-2xx status code.
   */
  async updateStat(
    id: string,
    data: StatUpdate,
  ): Promise<ApiResponse<Stat>> {
    return this.request<Stat>(
      "PUT",
      `/api/stats/${encodeURIComponent(id)}`,
      { body: data },
    );
  }

  /**
   * @description Permanently delete a stat entry by its unique identifier.
   * @param id - The unique identifier of the stat to delete.
   * @throws {ApiClientError} When the stat is not found or the API returns a non-2xx status code.
   */
  async deleteStat(id: string): Promise<void> {
    await this.request(
      "DELETE",
      `/api/stats/${encodeURIComponent(id)}`,
    );
  }

  // ──────────────────────────────────────────────
  // Providers
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve the full list of available AI providers.
   * @returns An array of Provider objects wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async listProviders(): Promise<ApiResponse<Provider[]>> {
    return this.request<Provider[]>("GET", "/api/providers");
  }

  /**
   * @description Retrieve detailed information for a specific provider, including real-time health and usage data.
   * @param id - The unique identifier of the provider.
   * @returns Provider detail with health and usage information wrapped in an ApiResponse.
   * @throws {ApiClientError} When the provider is not found or the API returns a non-2xx status code.
   */
  async getProvider(
    id: string,
  ): Promise<ApiResponse<ProviderDetailResponse>> {
    return this.request<ProviderDetailResponse>(
      "GET",
      `/api/providers/${encodeURIComponent(id)}`,
    );
  }

  /**
   * @description Validate an API key against a specific provider to verify permissions and remaining quota.
   * @param data - The validation payload containing the provider identifier and API key.
   * @returns Validation result including key validity, granted permissions, remaining quota, and expiry date.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async validateProvider(
    data: ProviderValidateRequest,
  ): Promise<ApiResponse<ProviderValidateResponse>> {
    return this.request<ProviderValidateResponse>(
      "POST",
      "/api/providers/validate",
      { body: data },
    );
  }

  // ──────────────────────────────────────────────
  // Models
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve the list of all available models, optionally filtered by provider.
   * @param params - Optional filter parameters.
   * @param params.provider - Filter models belonging to a specific provider identifier.
   * @returns An array of Model objects wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async listModels(params?: {
    provider?: string;
  }): Promise<ApiResponse<Model[]>> {
    return this.request<Model[]>(
      "GET",
      "/api/models",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Compare multiple models side-by-side across selected performance and cost metrics.
   * @param data - The comparison request containing at least two model IDs and optional metrics to evaluate.
   * @returns Comparison results with per-model scores, benchmarks, and an optional best-fit recommendation.
   * @throws {ApiClientError} When fewer than two model IDs are provided or the API returns a non-2xx status code.
   */
  async compareModels(
    data: ModelCompareRequest,
  ): Promise<ApiResponse<ModelCompareResponse>> {
    return this.request<ModelCompareResponse>(
      "POST",
      "/api/models/compare",
      { body: data },
    );
  }

  // ──────────────────────────────────────────────
  // Configs
  // ──────────────────────────────────────────────

  /**
   * @description Generate a complete configuration for a given provider and model combination, with optional preset and parameter overrides.
   * @param data - The generation request containing provider ID, model ID, optional preset name, and parameter overrides.
   * @returns The generated Config object along with any warnings wrapped in an ApiResponse.
   * @throws {ApiClientError} When the provider or model is invalid or the API returns a non-2xx status code.
   */
  async generateConfig(
    data: ConfigGenerateRequest,
  ): Promise<ApiResponse<ConfigGenerateResponse>> {
    return this.request<ConfigGenerateResponse>(
      "POST",
      "/api/configs/generate",
      { body: data },
    );
  }

  /**
   * @description Validate a configuration object for correctness, completeness, and best practices.
   * @param data - The validation request containing a partial config and an optional strict mode flag.
   * @returns Validation result with errors, warnings, and actionable improvement suggestions.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async validateConfig(
    data: ConfigValidateRequest,
  ): Promise<ApiResponse<ConfigValidateResponse>> {
    return this.request<ConfigValidateResponse>(
      "POST",
      "/api/configs/validate",
      { body: data },
    );
  }

  /**
   * @description Parse a raw configuration string into a structured Config object.
   * @param data - The parse request containing the raw content string and its format (yaml, json, toml, env).
   * @returns The parsed Config, any parse warnings, and the detected original format.
   * @throws {ApiClientError} When the content cannot be parsed or the API returns a non-2xx status code.
   */
  async parseConfig(
    data: ConfigParseRequest,
  ): Promise<ApiResponse<ConfigParseResponse>> {
    return this.request<ConfigParseResponse>(
      "POST",
      "/api/configs/parse",
      { body: data },
    );
  }

  // ──────────────────────────────────────────────
  // Health
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve the overall health status of the OpenClaw API service.
   * @returns Service status, version, uptime, environment, and individual health checks.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    return this.request<HealthStatus>("GET", "/api/health");
  }

  /**
   * @description Retrieve detailed system metrics including CPU utilisation, memory usage, request throughput, error rates, and latency percentiles.
   * @returns Comprehensive system metrics wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getMetrics(): Promise<ApiResponse<HealthMetrics>> {
    return this.request<HealthMetrics>("GET", "/api/health/metrics");
  }

  /**
   * @description Retrieve the health status of all external dependencies such as databases, caches, and third-party APIs.
   * @returns A list of dependency health checks and an aggregate healthy flag wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getDependencies(): Promise<
    ApiResponse<HealthDependenciesResponse>
  > {
    return this.request<HealthDependenciesResponse>(
      "GET",
      "/api/health/dependencies",
    );
  }

  // ──────────────────────────────────────────────
  // Users
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve the authenticated user's profile, including account details and cumulative usage stats.
   * @returns The current user's profile wrapped in an ApiResponse.
   * @throws {ApiClientError} When the user is not authenticated or the API returns a non-2xx status code.
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>("GET", "/api/users/profile");
  }

  /**
   * @description Retrieve the authenticated user's preferences for theme, language, timezone, notifications, and default settings.
   * @returns The current user's preferences wrapped in an ApiResponse.
   * @throws {ApiClientError} When the user is not authenticated or the API returns a non-2xx status code.
   */
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>(
      "GET",
      "/api/users/preferences",
    );
  }

  /**
   * @description Update the authenticated user's preferences. Only the provided fields are modified; omitted fields remain unchanged.
   * @param data - Partial preferences update containing only the fields to change.
   * @returns The full updated preferences object wrapped in an ApiResponse.
   * @throws {ApiClientError} When the user is not authenticated or the API returns a non-2xx status code.
   */
  async updatePreferences(
    data: UserPreferencesUpdate,
  ): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>(
      "PUT",
      "/api/users/preferences",
      { body: data },
    );
  }

  /**
   * @description Retrieve the authenticated user's activity history with pagination.
   * @param params - Optional pagination parameters.
   * @param params.page - Page number for pagination (1-indexed).
   * @param params.limit - Maximum number of history entries per page.
   * @returns A paginated list of UserHistoryEntry objects wrapped in an ApiResponse.
   * @throws {ApiClientError} When the user is not authenticated or the API returns a non-2xx status code.
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<UserHistoryEntry>>> {
    return this.request<PaginatedResponse<UserHistoryEntry>>(
      "GET",
      "/api/users/history",
      params ? { params } : undefined,
    );
  }

  // ──────────────────────────────────────────────
  // Sessions
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve a paginated list of sessions for the authenticated user.
   * @param params - Optional pagination parameters.
   * @param params.page - Page number for pagination (1-indexed).
   * @param params.limit - Maximum number of sessions per page.
   * @returns A paginated list of Session objects wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async listSessions(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Session>>> {
    return this.request<PaginatedResponse<Session>>(
      "GET",
      "/api/sessions",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Retrieve detailed information for a specific session, including the full event timeline and a computed summary.
   * @param id - The unique identifier of the session.
   * @returns Session detail with events and summary statistics wrapped in an ApiResponse.
   * @throws {ApiClientError} When the session is not found or the API returns a non-2xx status code.
   */
  async getSession(
    id: string,
  ): Promise<ApiResponse<SessionDetailResponse>> {
    return this.request<SessionDetailResponse>(
      "GET",
      `/api/sessions/${encodeURIComponent(id)}`,
    );
  }

  /**
   * @description Replay a session's events at a configurable playback speed, optionally starting from a specific event.
   * @param id - The unique identifier of the session to replay.
   * @param data - Replay options including speed multiplier, optional starting event index, and whether to include system events.
   * @returns Replay response with the sequenced events, total duration, and effective playback speed.
   * @throws {ApiClientError} When the session is not found or the API returns a non-2xx status code.
   */
  async replaySession(
    id: string,
    data: SessionReplayRequest,
  ): Promise<ApiResponse<SessionReplayResponse>> {
    return this.request<SessionReplayResponse>(
      "POST",
      `/api/sessions/${encodeURIComponent(id)}/replay`,
      { body: data },
    );
  }

  // ──────────────────────────────────────────────
  // Commands
  // ──────────────────────────────────────────────

  /**
   * @description Execute a command asynchronously on the server. Returns immediately with a command ID for polling.
   * @param data - The command execution request with the command string, arguments, optional environment variables, timeout, and working directory.
   * @returns The assigned command ID, initial status, start timestamp, and estimated duration.
   * @throws {ApiClientError} When the command is rejected or the API returns a non-2xx status code.
   */
  async executeCommand(
    data: CommandExecuteRequest,
  ): Promise<ApiResponse<CommandExecuteResponse>> {
    return this.request<CommandExecuteResponse>(
      "POST",
      "/api/commands/execute",
      { body: data },
    );
  }

  /**
   * @description Poll the current execution status and progress of a previously submitted command.
   * @param id - The unique identifier of the command to check.
   * @returns Current command status, exit code (if finished), timing information, and progress details.
   * @throws {ApiClientError} When the command is not found or the API returns a non-2xx status code.
   */
  async getCommandStatus(
    id: string,
  ): Promise<ApiResponse<CommandStatusResponse>> {
    return this.request<CommandStatusResponse>(
      "GET",
      `/api/commands/${encodeURIComponent(id)}/status`,
    );
  }

  /**
   * @description Retrieve the stdout and stderr log output for a previously executed command.
   * @param id - The unique identifier of the command whose logs to retrieve.
   * @returns The command's log entries, total line count, and whether the output was truncated.
   * @throws {ApiClientError} When the command is not found or the API returns a non-2xx status code.
   */
  async getCommandLogs(
    id: string,
  ): Promise<ApiResponse<CommandLogsResponse>> {
    return this.request<CommandLogsResponse>(
      "GET",
      `/api/commands/${encodeURIComponent(id)}/logs`,
    );
  }

  // ──────────────────────────────────────────────
  // Webhooks
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve a paginated list of registered webhooks.
   * @param params - Optional pagination parameters.
   * @param params.page - Page number for pagination (1-indexed).
   * @param params.limit - Maximum number of webhooks per page.
   * @returns A paginated list of Webhook objects wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async listWebhooks(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Webhook>>> {
    return this.request<PaginatedResponse<Webhook>>(
      "GET",
      "/api/webhooks",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Register a new webhook endpoint to receive real-time event notifications.
   * @param data - The webhook registration payload with target URL, subscribed events, optional secret for HMAC signing, custom headers, and retry policy.
   * @returns The newly created Webhook object wrapped in an ApiResponse.
   * @throws {ApiClientError} When the URL is invalid, no events are selected, or the API returns a non-2xx status code.
   */
  async registerWebhook(
    data: WebhookRegisterRequest,
  ): Promise<ApiResponse<Webhook>> {
    return this.request<Webhook>("POST", "/api/webhooks", {
      body: data,
    });
  }

  /**
   * @description Permanently delete a registered webhook by its unique identifier.
   * @param id - The unique identifier of the webhook to delete.
   * @throws {ApiClientError} When the webhook is not found or the API returns a non-2xx status code.
   */
  async deleteWebhook(id: string): Promise<void> {
    await this.request(
      "DELETE",
      `/api/webhooks/${encodeURIComponent(id)}`,
    );
  }

  /**
   * @description Send a test payload to a registered webhook endpoint to verify connectivity and correct handling.
   * @param id - The unique identifier of the webhook to test.
   * @returns Test delivery result including the HTTP status code, response time in milliseconds, and any delivery error.
   * @throws {ApiClientError} When the webhook is not found or the API returns a non-2xx status code.
   */
  async testWebhook(
    id: string,
  ): Promise<ApiResponse<WebhookTestResponse>> {
    return this.request<WebhookTestResponse>(
      "POST",
      `/api/webhooks/${encodeURIComponent(id)}/test`,
    );
  }

  // ──────────────────────────────────────────────
  // Analytics
  // ──────────────────────────────────────────────

  /**
   * @description Retrieve daily analytics data including sessions, commands, tokens, costs, errors, and unique users.
   * @param params - Optional filter parameters for scoping the analytics query.
   * @param params.from - ISO 8601 start date for the period.
   * @param params.to - ISO 8601 end date for the period.
   * @param params.providers - Restrict results to specific provider identifiers.
   * @param params.channels - Restrict results to specific channel types.
   * @param params.models - Restrict results to specific model identifiers.
   * @param params.limit - Maximum number of daily data points to return.
   * @returns Daily analytics data points with an aggregate summary wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getDailyAnalytics(
    params?: AnalyticsFilterParams,
  ): Promise<ApiResponse<AnalyticsDailyResponse>> {
    return this.request<AnalyticsDailyResponse>(
      "GET",
      "/api/analytics/daily",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Retrieve weekly analytics data including sessions, commands, tokens, costs, and growth rates.
   * @param params - Optional filter parameters for scoping the analytics query.
   * @param params.from - ISO 8601 start date for the period.
   * @param params.to - ISO 8601 end date for the period.
   * @param params.providers - Restrict results to specific provider identifiers.
   * @param params.channels - Restrict results to specific channel types.
   * @param params.models - Restrict results to specific model identifiers.
   * @param params.limit - Maximum number of weekly data points to return.
   * @returns Weekly analytics data points with an aggregate summary wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getWeeklyAnalytics(
    params?: AnalyticsFilterParams,
  ): Promise<ApiResponse<AnalyticsWeeklyResponse>> {
    return this.request<AnalyticsWeeklyResponse>(
      "GET",
      "/api/analytics/weekly",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Retrieve monthly analytics data including sessions, commands, tokens, costs, growth rates, and projected costs.
   * @param params - Optional filter parameters for scoping the analytics query.
   * @param params.from - ISO 8601 start date for the period.
   * @param params.to - ISO 8601 end date for the period.
   * @param params.providers - Restrict results to specific provider identifiers.
   * @param params.channels - Restrict results to specific channel types.
   * @param params.models - Restrict results to specific model identifiers.
   * @param params.limit - Maximum number of monthly data points to return.
   * @returns Monthly analytics data points with an aggregate summary wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getMonthlyAnalytics(
    params?: AnalyticsFilterParams,
  ): Promise<ApiResponse<AnalyticsMonthlyResponse>> {
    return this.request<AnalyticsMonthlyResponse>(
      "GET",
      "/api/analytics/monthly",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Retrieve analytics data broken down by programming language, including session counts, token usage, costs, and trend direction.
   * @param params - Optional filter parameters for scoping the analytics query.
   * @param params.from - ISO 8601 start date for the period.
   * @param params.to - ISO 8601 end date for the period.
   * @param params.providers - Restrict results to specific provider identifiers.
   * @param params.channels - Restrict results to specific channel types.
   * @param params.models - Restrict results to specific model identifiers.
   * @param params.limit - Maximum number of language entries to return.
   * @returns Per-language analytics with usage percentages and trends wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getLanguageAnalytics(
    params?: AnalyticsFilterParams,
  ): Promise<ApiResponse<AnalyticsByLanguageResponse>> {
    return this.request<AnalyticsByLanguageResponse>(
      "GET",
      "/api/analytics/by-language",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Retrieve analytics data broken down by model, including session counts, token usage, costs, latency, and error rates.
   * @param params - Optional filter parameters for scoping the analytics query.
   * @param params.from - ISO 8601 start date for the period.
   * @param params.to - ISO 8601 end date for the period.
   * @param params.providers - Restrict results to specific provider identifiers.
   * @param params.channels - Restrict results to specific channel types.
   * @param params.models - Restrict results to specific model identifiers.
   * @param params.limit - Maximum number of model entries to return.
   * @returns Per-model analytics with performance metrics and usage percentages wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getModelAnalytics(
    params?: AnalyticsFilterParams,
  ): Promise<ApiResponse<AnalyticsByModelResponse>> {
    return this.request<AnalyticsByModelResponse>(
      "GET",
      "/api/analytics/by-model",
      params ? { params } : undefined,
    );
  }

  /**
   * @description Retrieve trend analysis across key metrics, including current vs. previous period comparisons and actionable insights.
   * @param params - Optional filter parameters for scoping the trend analysis, with an additional metric filter.
   * @param params.from - ISO 8601 start date for the period.
   * @param params.to - ISO 8601 end date for the period.
   * @param params.providers - Restrict results to specific provider identifiers.
   * @param params.channels - Restrict results to specific channel types.
   * @param params.models - Restrict results to specific model identifiers.
   * @param params.limit - Maximum number of trend entries to return.
   * @param params.metric - Restrict trend analysis to a specific metric name (e.g. "sessions", "cost", "errors").
   * @returns Trend data with directional changes, percentage deltas, and significance-ranked insights wrapped in an ApiResponse.
   * @throws {ApiClientError} When the API returns a non-2xx status code.
   */
  async getTrends(
    params?: AnalyticsFilterParams & { metric?: string },
  ): Promise<ApiResponse<AnalyticsTrendsResponse>> {
    return this.request<AnalyticsTrendsResponse>(
      "GET",
      "/api/analytics/trends",
      params ? { params } : undefined,
    );
  }
}

/**
 * Factory function for creating a configured {@link OpenClawApiClient} instance.
 *
 * @param options - Optional configuration for the client.
 * @param options.baseUrl - The base URL of the OpenClaw API (e.g. "https://api.openclaw.dev"). Defaults to the current origin.
 * @param options.apiKey - Bearer token for API authentication. Sets the Authorization header automatically.
 * @param options.headers - Additional custom headers to include on every request.
 * @returns A fully configured OpenClawApiClient instance.
 */
export function createApiClient(options?: {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}): OpenClawApiClient {
  return new OpenClawApiClient(options);
}

/** Default singleton client instance configured for same-origin requests. */
export const apiClient = createApiClient();
