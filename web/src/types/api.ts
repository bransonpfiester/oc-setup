import { z } from "zod";

// ============================================================
// Common / Shared Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ResponseMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  duration?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface TimestampFields {
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Stats Types
// ============================================================

export interface Stat extends TimestampFields {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: StatCategory;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type StatCategory = "performance" | "usage" | "cost" | "error" | "custom";

export interface StatCreate {
  name: string;
  value: number;
  unit: string;
  category: StatCategory;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface StatUpdate {
  name?: string;
  value?: number;
  unit?: string;
  category?: StatCategory;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type StatListResponse = PaginatedResponse<Stat>;

export interface StatDetailResponse {
  stat: Stat;
  history: StatHistoryPoint[];
}

export interface StatHistoryPoint {
  value: number;
  timestamp: string;
}

// ============================================================
// Provider Types
// ============================================================

export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string;
  baseUrl: string;
  authType: ProviderAuthType;
  status: ProviderStatus;
  models: string[];
  rateLimits: RateLimitConfig;
  features: ProviderFeature[];
  createdAt: string;
}

export type ProviderAuthType = "api_key" | "oauth2" | "bearer" | "none";

export type ProviderStatus = "active" | "degraded" | "down" | "maintenance";

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  concurrentRequests: number;
}

export interface ProviderFeature {
  name: string;
  supported: boolean;
  version?: string;
}

export type ProviderListResponse = PaginatedResponse<Provider>;

export interface ProviderDetailResponse {
  provider: Provider;
  health: ProviderHealthInfo;
  usage: ProviderUsageInfo;
}

export interface ProviderHealthInfo {
  status: ProviderStatus;
  latencyMs: number;
  lastChecked: string;
  uptime: number;
}

export interface ProviderUsageInfo {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  period: string;
}

export interface ProviderValidateRequest {
  providerId: string;
  apiKey: string;
}

export interface ProviderValidateResponse {
  valid: boolean;
  provider: string;
  permissions: string[];
  quotaRemaining: number | null;
  expiresAt: string | null;
}

// ============================================================
// Model Types
// ============================================================

export interface Model {
  id: string;
  providerId: string;
  name: string;
  displayName: string;
  description: string;
  type: ModelType;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePerToken: number;
  outputPricePerToken: number;
  capabilities: ModelCapability[];
  status: ModelStatus;
  version: string;
  releasedAt: string;
}

export type ModelType = "chat" | "completion" | "embedding" | "image" | "audio" | "multimodal";

export type ModelCapability =
  | "function_calling"
  | "vision"
  | "streaming"
  | "json_mode"
  | "system_prompt"
  | "fine_tuning"
  | "batch";

export type ModelStatus = "available" | "deprecated" | "preview" | "disabled";

export type ModelListResponse = PaginatedResponse<Model>;

export interface ModelCompareRequest {
  modelIds: string[];
  metrics?: ComparisonMetric[];
}

export type ComparisonMetric = "price" | "speed" | "quality" | "context" | "features";

export interface ModelCompareResponse {
  models: ModelComparison[];
  recommendation: ModelRecommendation | null;
}

export interface ModelComparison {
  model: Model;
  scores: Record<ComparisonMetric, number>;
  benchmarks: ModelBenchmark[];
}

export interface ModelBenchmark {
  name: string;
  score: number;
  maxScore: number;
  category: string;
}

export interface ModelRecommendation {
  modelId: string;
  reason: string;
  confidence: number;
}

// ============================================================
// Config Types
// ============================================================

export interface Config extends TimestampFields {
  id: string;
  name: string;
  version: string;
  providerId: string;
  modelId: string;
  parameters: ConfigParameters;
  personality: PersonalityConfig;
  channels: ChannelConfig[];
  gateway: GatewayConfig;
}

export interface ConfigParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
}

export interface PersonalityConfig {
  name: string;
  systemPrompt: string;
  traits: string[];
  tone: string;
}

export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export type ChannelType = "telegram" | "discord" | "slack" | "web" | "api";

export interface GatewayConfig {
  host: string;
  port: number;
  tls: boolean;
  corsOrigins: string[];
}

export interface ConfigGenerateRequest {
  providerId: string;
  modelId: string;
  preset?: ConfigPreset;
  overrides?: Partial<ConfigParameters>;
}

export type ConfigPreset = "minimal" | "balanced" | "creative" | "precise" | "custom";

export interface ConfigGenerateResponse {
  config: Config;
  warnings: ConfigWarning[];
}

export interface ConfigWarning {
  field: string;
  message: string;
  severity: "info" | "warning" | "error";
}

export interface ConfigValidateRequest {
  config: Partial<Config>;
  strict?: boolean;
}

export interface ConfigValidateResponse {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigWarning[];
  suggestions: ConfigSuggestion[];
}

export interface ConfigValidationError {
  path: string;
  message: string;
  code: string;
  expected?: string;
  received?: string;
}

export interface ConfigSuggestion {
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
}

export interface ConfigParseRequest {
  content: string;
  format: ConfigFormat;
}

export type ConfigFormat = "yaml" | "json" | "toml" | "env";

export interface ConfigParseResponse {
  config: Config;
  parseWarnings: string[];
  originalFormat: ConfigFormat;
}

// ============================================================
// Health Types
// ============================================================

export interface HealthStatus {
  status: ServiceStatus;
  version: string;
  uptime: number;
  environment: string;
  checks: HealthCheck[];
}

export type ServiceStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheck {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  message?: string;
}

export interface HealthMetrics {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  requests: RequestMetrics;
  errors: ErrorMetrics;
  latency: LatencyMetrics;
}

export interface CpuMetrics {
  usage: number;
  cores: number;
  loadAverage: number[];
}

export interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
}

export interface RequestMetrics {
  total: number;
  perSecond: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ErrorMetrics {
  total: number;
  rate: number;
  byType: Record<string, number>;
  recent: RecentError[];
}

export interface RecentError {
  message: string;
  count: number;
  lastOccurred: string;
}

export interface LatencyMetrics {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  average: number;
}

export interface HealthDependency {
  name: string;
  type: DependencyType;
  status: ServiceStatus;
  latencyMs: number;
  version?: string;
  details?: Record<string, unknown>;
}

export type DependencyType = "database" | "cache" | "queue" | "external_api" | "storage" | "service" | "filesystem";

export interface HealthDependenciesResponse {
  dependencies: HealthDependency[];
  allHealthy: boolean;
}

// ============================================================
// User Types
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  organization: string | null;
  createdAt: string;
  lastLoginAt: string;
  stats: UserStats;
}

export type UserRole = "admin" | "member" | "viewer";

export interface UserStats {
  totalSessions: number;
  totalCommands: number;
  totalTokensUsed: number;
  favoriteModel: string | null;
}

export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  defaults: DefaultPreferences;
}

export type ThemePreference = "light" | "dark" | "system";

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  webhookAlerts: boolean;
  dailyDigest: boolean;
}

export interface DefaultPreferences {
  providerId: string | null;
  modelId: string | null;
  temperature: number;
  maxTokens: number;
}

export interface UserPreferencesUpdate {
  theme?: ThemePreference;
  language?: string;
  timezone?: string;
  notifications?: Partial<NotificationPreferences>;
  defaults?: Partial<DefaultPreferences>;
}

export interface UserHistoryEntry {
  id: string;
  type: HistoryEventType;
  description: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export type HistoryEventType =
  | "session_start"
  | "session_end"
  | "command_execute"
  | "config_change"
  | "model_switch"
  | "webhook_create"
  | "error";

export type UserHistoryResponse = PaginatedResponse<UserHistoryEntry>;

// ============================================================
// Session Types
// ============================================================

export interface Session extends TimestampFields {
  id: string;
  userId: string;
  providerId: string;
  modelId: string;
  status: SessionStatus;
  title: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  duration: number;
  tags: string[];
}

export type SessionStatus = "active" | "completed" | "failed" | "expired";

export type SessionListResponse = PaginatedResponse<Session>;

export interface SessionDetailResponse {
  session: Session;
  events: SessionEvent[];
  summary: SessionSummary;
}

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number;
  latencyMs: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export type SessionEventType = "message" | "function_call" | "function_result" | "error" | "system";

export interface SessionSummary {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorCount: number;
}

export interface SessionReplayRequest {
  speed: number;
  startFromEvent?: number;
  includeSystemEvents?: boolean;
}

export interface SessionReplayResponse {
  sessionId: string;
  events: SessionEvent[];
  totalDuration: number;
  playbackSpeed: number;
}

// ============================================================
// Command Types
// ============================================================

export interface CommandExecuteRequest {
  command: string;
  args: string[];
  environment?: Record<string, string>;
  timeout?: number;
  workingDirectory?: string;
}

export interface CommandExecuteResponse {
  commandId: string;
  status: CommandState;
  startedAt: string;
  estimatedDuration: number | null;
}

export type CommandState = "queued" | "running" | "completed" | "failed" | "cancelled" | "timeout";

export interface CommandStatusResponse {
  commandId: string;
  command: string;
  status: CommandState;
  exitCode: number | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  progress: CommandProgress | null;
}

export interface CommandProgress {
  percentage: number;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
}

export interface CommandLog {
  id: string;
  commandId: string;
  stream: "stdout" | "stderr";
  content: string;
  timestamp: string;
  lineNumber: number;
}

export interface CommandLogsResponse {
  commandId: string;
  logs: CommandLog[];
  totalLines: number;
  truncated: boolean;
}

// ============================================================
// Webhook Types
// ============================================================

export interface Webhook extends TimestampFields {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  status: WebhookStatus;
  description: string;
  headers: Record<string, string>;
  retryPolicy: RetryPolicy;
  lastTriggeredAt: string | null;
  deliveryStats: WebhookDeliveryStats;
}

export type WebhookEventType =
  | "session.created"
  | "session.completed"
  | "command.executed"
  | "command.failed"
  | "config.updated"
  | "health.degraded"
  | "health.recovered"
  | "error.critical";

export type WebhookStatus = "active" | "paused" | "failed" | "disabled";

export interface RetryPolicy {
  maxRetries: number;
  retryIntervalMs: number;
  backoffMultiplier: number;
}

export interface WebhookDeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageLatencyMs: number;
}

export interface WebhookRegisterRequest {
  url: string;
  events: WebhookEventType[];
  description?: string;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy?: Partial<RetryPolicy>;
}

export type WebhookListResponse = PaginatedResponse<Webhook>;

export interface WebhookTestResponse {
  webhookId: string;
  delivered: boolean;
  statusCode: number | null;
  responseTime: number | null;
  error: string | null;
  payload: WebhookTestPayload;
}

export interface WebhookTestPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ============================================================
// Analytics Types
// ============================================================

export interface AnalyticsDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AnalyticsSeries {
  name: string;
  data: AnalyticsDataPoint[];
  total: number;
  average: number;
  min: number;
  max: number;
}

export interface DailyAnalytics {
  date: string;
  sessions: number;
  commands: number;
  tokens: number;
  cost: number;
  errors: number;
  uniqueUsers: number;
  averageLatency: number;
}

export interface AnalyticsDailyResponse {
  period: DateRangeParams;
  data: DailyAnalytics[];
  summary: AnalyticsSummary;
}

export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  sessions: number;
  commands: number;
  tokens: number;
  cost: number;
  errors: number;
  uniqueUsers: number;
  growthRate: number;
}

export interface AnalyticsWeeklyResponse {
  period: DateRangeParams;
  data: WeeklyAnalytics[];
  summary: AnalyticsSummary;
}

export interface MonthlyAnalytics {
  month: string;
  sessions: number;
  commands: number;
  tokens: number;
  cost: number;
  errors: number;
  uniqueUsers: number;
  growthRate: number;
  projectedCost: number;
}

export interface AnalyticsMonthlyResponse {
  period: DateRangeParams;
  data: MonthlyAnalytics[];
  summary: AnalyticsSummary;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalCommands: number;
  totalTokens: number;
  totalCost: number;
  totalErrors: number;
  averageSessionDuration: number;
  mostActiveDay: string;
}

export interface LanguageStats {
  language: string;
  sessions: number;
  tokens: number;
  cost: number;
  percentage: number;
  trend: TrendDirection;
}

export type TrendDirection = "up" | "down" | "stable";

export interface AnalyticsByLanguageResponse {
  period: DateRangeParams;
  languages: LanguageStats[];
  totalLanguages: number;
}

export interface ModelStats {
  modelId: string;
  modelName: string;
  provider: string;
  sessions: number;
  tokens: number;
  cost: number;
  averageLatency: number;
  errorRate: number;
  satisfaction: number | null;
  percentage: number;
}

export interface AnalyticsByModelResponse {
  period: DateRangeParams;
  models: ModelStats[];
  totalModels: number;
}

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  direction: TrendDirection;
  series: AnalyticsDataPoint[];
}

export interface AnalyticsTrendsResponse {
  period: DateRangeParams;
  trends: TrendData[];
  insights: TrendInsight[];
}

export interface TrendInsight {
  type: "positive" | "negative" | "neutral";
  metric: string;
  message: string;
  significance: number;
}

// ============================================================
// Zod Schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const statCreateSchema = z.object({
  name: z.string().min(1).max(255),
  value: z.number(),
  unit: z.string().min(1).max(50),
  category: z.enum(["performance", "usage", "cost", "error", "custom"]),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const statUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  value: z.number().optional(),
  unit: z.string().min(1).max(50).optional(),
  category: z.enum(["performance", "usage", "cost", "error", "custom"]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const providerValidateSchema = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(1),
});

export const modelCompareSchema = z.object({
  modelIds: z.array(z.string()).min(2).max(10),
  metrics: z
    .array(z.enum(["price", "speed", "quality", "context", "features"]))
    .optional()
    .default(["price", "speed", "quality"]),
});

export const configGenerateSchema = z.object({
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  preset: z.enum(["minimal", "balanced", "creative", "precise", "custom"]).optional().default("balanced"),
  overrides: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(1).optional(),
      topP: z.number().min(0).max(1).optional(),
      frequencyPenalty: z.number().min(-2).max(2).optional(),
      presencePenalty: z.number().min(-2).max(2).optional(),
      stopSequences: z.array(z.string()).optional(),
    })
    .optional(),
});

export const configValidateSchema = z.object({
  config: z.record(z.unknown()),
  strict: z.boolean().optional().default(false),
});

export const configParseSchema = z.object({
  content: z.string().min(1),
  format: z.enum(["yaml", "json", "toml", "env"]),
});

export const sessionReplaySchema = z.object({
  speed: z.number().min(0.25).max(10).default(1),
  startFromEvent: z.number().int().min(0).optional(),
  includeSystemEvents: z.boolean().optional().default(false),
});

export const commandExecuteSchema = z.object({
  command: z.string().min(1).max(1000),
  args: z.array(z.string().max(500)).max(50).default([]),
  environment: z.record(z.string()).optional(),
  timeout: z.number().int().min(1000).max(300000).optional().default(30000),
  workingDirectory: z.string().optional(),
});

export const webhookRegisterSchema = z.object({
  url: z.string().url(),
  events: z
    .array(
      z.enum([
        "session.created",
        "session.completed",
        "command.executed",
        "command.failed",
        "config.updated",
        "health.degraded",
        "health.recovered",
        "error.critical",
      ])
    )
    .min(1),
  description: z.string().max(500).optional().default(""),
  secret: z.string().min(16).optional(),
  headers: z.record(z.string()).optional().default({}),
  retryPolicy: z
    .object({
      maxRetries: z.number().int().min(0).max(10).optional(),
      retryIntervalMs: z.number().int().min(1000).optional(),
      backoffMultiplier: z.number().min(1).max(5).optional(),
    })
    .optional(),
});

export const userPreferencesUpdateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      webhookAlerts: z.boolean().optional(),
      dailyDigest: z.boolean().optional(),
    })
    .optional(),
  defaults: z
    .object({
      providerId: z.string().nullable().optional(),
      modelId: z.string().nullable().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(1).optional(),
    })
    .optional(),
});
