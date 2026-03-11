import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

export const uuid = z.string().uuid();
export const timestamp = z.string().datetime();
export const positiveInt = z.coerce.number().int().positive();
export const nonNegativeInt = z.coerce.number().int().nonnegative();

export const modelProvider = z.enum(["anthropic", "openai", "openrouter"]);

export const channel = z.enum([
  "telegram",
  "whatsapp",
  "discord",
  "signal",
  "imessage",
  "googlechat",
  "mattermost",
  "webchat",
]);

export const logLevel = z.enum(["debug", "info", "warn", "error", "fatal"]);
export const sortOrder = z.enum(["asc", "desc"]);

export const webhookEvent = z.enum([
  "setup.completed",
  "setup.failed",
  "config.updated",
  "health.degraded",
  "health.restored",
  "command.completed",
  "command.failed",
]);

export const dateRange = z.object({
  from: timestamp,
  to: timestamp,
});

// ---------------------------------------------------------------------------
// Pagination & sorting
// ---------------------------------------------------------------------------

export const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortParams = z.object({
  sortBy: z.string().optional(),
  order: sortOrder.default("desc"),
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const statCreate = z.object({
  name: z.string().min(1).max(255),
  value: z.number(),
  unit: z.string().min(1).max(50),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const statUpdate = z.object({
  name: z.string().min(1).max(255).optional(),
  value: z.number().optional(),
  unit: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const statFilter = z.object({
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated in query
  from: z.string().optional(),
  to: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export const providerValidate = z.object({
  provider: modelProvider,
  apiKey: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export const modelComparison = z.object({
  modelIds: z.array(z.string().min(1)).min(2).max(10),
  criteria: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------

export const configGenerate = z.object({
  userName: z.string().min(1).max(100),
  agentName: z.string().min(1).max(100),
  channel: channel,
  provider: modelProvider,
  modelId: z.string().optional(),
  personality: z.string().max(500).optional(),
  focusAreas: z.array(z.string()).optional(),
});

export const configValidate = z.object({
  config: z.record(z.unknown()),
  strict: z.boolean().default(false),
});

export const configParse = z.object({
  raw: z.string().min(1),
  format: z.enum(["json", "yaml", "toml", "env"]),
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const userPreferencesUpdate = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      webhook: z.boolean().optional(),
      setupAlerts: z.boolean().optional(),
      healthAlerts: z.boolean().optional(),
    })
    .optional(),
  defaults: z
    .object({
      provider: modelProvider.optional(),
      channel: channel.optional(),
      model: z.string().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const sessionReplay = z.object({
  speed: z.number().min(0.1).max(10).default(1),
  fromStep: z.number().int().nonnegative().optional(),
  dryRun: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const ALLOWED_COMMANDS = [
  "setupclaw",
  "oc-setup",
  "openclaw",
  "node",
  "npm",
  "npx",
] as const;

export const commandExecute = z.object({
  command: z.enum(ALLOWED_COMMANDS),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
  timeout: z.number().int().min(1000).max(300_000).default(30_000),
});

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export const webhookRegister = z.object({
  url: z.string().url(),
  events: z.array(webhookEvent).min(1),
  secret: z.string().min(16).optional(),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export const webhookTest = z.object({
  event: webhookEvent.optional(),
  payload: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const analyticsFilter = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  providers: z.string().optional(), // comma-separated
  channels: z.string().optional(),
  models: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(365).default(30),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseSearchParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
): z.infer<T> {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}

export function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
): z.infer<T> {
  return schema.parse(body);
}
