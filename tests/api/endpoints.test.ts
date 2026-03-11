import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route handler imports
// ---------------------------------------------------------------------------

import {
  GET as getStats,
  POST as createStat,
  statsStore,
} from "../../web/src/app/api/stats/route";
import {
  GET as getStatById,
  PUT as updateStat,
  DELETE as deleteStat,
} from "../../web/src/app/api/stats/[id]/route";

import { GET as getProviders } from "../../web/src/app/api/providers/route";
import { GET as getProviderById } from "../../web/src/app/api/providers/[id]/route";

import { GET as getModels } from "../../web/src/app/api/models/route";
import { POST as compareModels } from "../../web/src/app/api/models/compare/route";

import { POST as generateConfig } from "../../web/src/app/api/configs/generate/route";
import { POST as validateConfig } from "../../web/src/app/api/configs/validate/route";
import { POST as parseConfig } from "../../web/src/app/api/configs/parse/route";

import { GET as getHealth } from "../../web/src/app/api/health/route";
import { GET as getMetrics } from "../../web/src/app/api/health/metrics/route";
import { GET as getDependencies } from "../../web/src/app/api/health/dependencies/route";

import { GET as getUserProfile } from "../../web/src/app/api/users/profile/route";
import {
  GET as getPreferences,
  PUT as updatePreferences,
} from "../../web/src/app/api/users/preferences/route";

import { GET as getSessions } from "../../web/src/app/api/sessions/route";
import { GET as getSessionById } from "../../web/src/app/api/sessions/[id]/route";
import { POST as replaySession } from "../../web/src/app/api/sessions/[id]/replay/route";

import { POST as executeCommand } from "../../web/src/app/api/commands/execute/route";
import { GET as getCommandStatus } from "../../web/src/app/api/commands/[id]/status/route";
import { GET as getCommandLogs } from "../../web/src/app/api/commands/[id]/logs/route";

import {
  GET as getWebhooks,
  POST as registerWebhook,
} from "../../web/src/app/api/webhooks/route";
import { DELETE as deleteWebhook } from "../../web/src/app/api/webhooks/[id]/route";

import { GET as getDailyAnalytics } from "../../web/src/app/api/analytics/daily/route";
import { GET as getWeeklyAnalytics } from "../../web/src/app/api/analytics/weekly/route";
import { GET as getMonthlyAnalytics } from "../../web/src/app/api/analytics/monthly/route";
import { GET as getByLanguage } from "../../web/src/app/api/analytics/by-language/route";
import { GET as getByModel } from "../../web/src/app/api/analytics/by-model/route";
import { GET as getTrends } from "../../web/src/app/api/analytics/trends/route";

// ---------------------------------------------------------------------------
// Store imports (for setup / teardown)
// ---------------------------------------------------------------------------

import { webhooksStore } from "../../web/src/lib/stores/webhooks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(
  method: string,
  url: string,
  body?: unknown,
): NextRequest {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

async function parseResponse<T>(response: NextResponse): Promise<T> {
  return response.json() as Promise<T>;
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// 1. Stats API
// ---------------------------------------------------------------------------

describe("Stats API", () => {
  beforeEach(() => {
    statsStore.clear();
  });

  it("POST /api/stats - creates a stat and returns 201", async () => {
    const req = createRequest("POST", "http://localhost:3000/api/stats", {
      name: "api_calls",
      value: 1500,
      unit: "count",
      category: "usage",
      tags: ["api", "production"],
      metadata: { source: "test" },
    });

    const res = await createStat(req);
    expect(res.status).toBe(201);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("api_calls");
    expect(json.data.value).toBe(1500);
    expect(json.data.unit).toBe("count");
    expect(json.data.category).toBe("usage");
    expect(json.data.tags).toEqual(["api", "production"]);
    expect(json.data.metadata).toEqual({ source: "test" });
    expect(json.data.id).toBeDefined();
    expect(json.data.createdAt).toBeDefined();
    expect(json.data.updatedAt).toBeDefined();
    expect(json.timestamp).toBeDefined();
    expect(json.requestId).toBeDefined();
  });

  it("POST /api/stats - rejects invalid body (missing name)", async () => {
    const req = createRequest("POST", "http://localhost:3000/api/stats", {
      value: 100,
      unit: "ms",
      category: "performance",
    });

    const res = await createStat(req);
    expect(res.status).toBe(400);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("Request validation failed");
    expect(json.error.details).toBeDefined();
    expect(json.error.details.issues).toBeDefined();
    expect(Array.isArray(json.error.details.issues)).toBe(true);
    expect(json.error.details.issues.length).toBeGreaterThan(0);
  });

  it("GET /api/stats - returns paginated list", async () => {
    await createStat(
      createRequest("POST", "http://localhost:3000/api/stats", {
        name: "stat_a",
        value: 10,
        unit: "ms",
        category: "performance",
      }),
    );
    await createStat(
      createRequest("POST", "http://localhost:3000/api/stats", {
        name: "stat_b",
        value: 20,
        unit: "ms",
        category: "performance",
      }),
    );

    const res = await getStats(
      createRequest("GET", "http://localhost:3000/api/stats"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(2);
    expect(json.data.pagination).toBeDefined();
    expect(json.data.pagination.total).toBe(2);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.hasNext).toBe(false);
    expect(json.data.pagination.hasPrevious).toBe(false);
  });

  it("GET /api/stats/{id} - returns stat by id", async () => {
    const createRes = await createStat(
      createRequest("POST", "http://localhost:3000/api/stats", {
        name: "latency",
        value: 250,
        unit: "ms",
        category: "performance",
      }),
    );
    const created = await parseResponse<any>(createRes);
    const statId: string = created.data.id;

    const res = await getStatById(
      createRequest("GET", `http://localhost:3000/api/stats/${statId}`),
      routeContext(statId),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.stat).toBeDefined();
    expect(json.data.stat.id).toBe(statId);
    expect(json.data.stat.name).toBe("latency");
    expect(json.data.stat.value).toBe(250);
    expect(json.data.stat.unit).toBe("ms");
    expect(json.data.stat.category).toBe("performance");
    expect(json.data.stat.createdAt).toBeDefined();
    expect(json.data.history).toBeDefined();
    expect(Array.isArray(json.data.history)).toBe(true);
  });

  it("PUT /api/stats/{id} - updates stat fields", async () => {
    const createRes = await createStat(
      createRequest("POST", "http://localhost:3000/api/stats", {
        name: "requests",
        value: 100,
        unit: "count",
        category: "usage",
      }),
    );
    const created = await parseResponse<any>(createRes);
    const statId: string = created.data.id;

    const res = await updateStat(
      createRequest("PUT", `http://localhost:3000/api/stats/${statId}`, {
        value: 200,
        name: "requests_updated",
      }),
      routeContext(statId),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(statId);
    expect(json.data.value).toBe(200);
    expect(json.data.name).toBe("requests_updated");
    expect(json.data.unit).toBe("count");
    expect(json.data.updatedAt).toBeDefined();
    expect(typeof json.data.updatedAt).toBe("string");
  });

  it("DELETE /api/stats/{id} - removes stat and returns confirmation", async () => {
    const createRes = await createStat(
      createRequest("POST", "http://localhost:3000/api/stats", {
        name: "temp_stat",
        value: 1,
        unit: "count",
        category: "custom",
      }),
    );
    const created = await parseResponse<any>(createRes);
    const statId: string = created.data.id;

    const res = await deleteStat(
      createRequest("DELETE", `http://localhost:3000/api/stats/${statId}`),
      routeContext(statId),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.deleted).toBe(true);
    expect(statsStore.has(statId)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Providers API
// ---------------------------------------------------------------------------

describe("Providers API", () => {
  it("GET /api/providers - returns list of providers", async () => {
    const res = await getProviders(
      createRequest("GET", "http://localhost:3000/api/providers"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(3);

    for (const provider of json.data) {
      expect(provider).toHaveProperty("id");
      expect(provider).toHaveProperty("name");
      expect(provider).toHaveProperty("status");
      expect(provider).toHaveProperty("defaultModel");
      expect(provider).toHaveProperty("description");
      expect(provider).toHaveProperty("pricingHint");
      expect(provider).toHaveProperty("website");
    }

    const ids = json.data.map((p: { id: string }) => p.id);
    expect(ids).toContain("anthropic");
    expect(ids).toContain("openai");
    expect(ids).toContain("openrouter");
  });

  it("GET /api/providers/{id} - returns provider detail", async () => {
    const res = await getProviderById(
      createRequest("GET", "http://localhost:3000/api/providers/anthropic"),
      routeContext("anthropic"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("anthropic");
    expect(json.data.name).toBe("Anthropic");
    expect(json.data.status).toBe("active");
    expect(json.data.description).toBeDefined();
    expect(json.data.website).toBe("https://anthropic.com");
    expect(json.data.documentationUrl).toBe("https://docs.anthropic.com");
    expect(Array.isArray(json.data.capabilities)).toBe(true);
    expect(json.data.capabilities).toContain("function_calling");
    expect(Array.isArray(json.data.models)).toBe(true);
    expect(json.data.models.length).toBeGreaterThan(0);
    expect(json.data.rateLimits).toBeDefined();
    expect(typeof json.data.rateLimits.requestsPerMinute).toBe("number");
    expect(typeof json.data.rateLimits.tokensPerMinute).toBe("number");
    expect(typeof json.data.rateLimits.concurrentRequests).toBe("number");
  });

  it("GET /api/providers/{id} - returns 404 for unknown provider", async () => {
    const res = await getProviderById(
      createRequest(
        "GET",
        "http://localhost:3000/api/providers/unknown-provider",
      ),
      routeContext("unknown-provider"),
    );
    expect(res.status).toBe(404);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toContain("unknown-provider");
  });
});

// ---------------------------------------------------------------------------
// 3. Models API
// ---------------------------------------------------------------------------

describe("Models API", () => {
  it("GET /api/models - returns all models", async () => {
    const res = await getModels(
      createRequest("GET", "http://localhost:3000/api/models"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(6);

    for (const model of json.data) {
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("providerId");
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("displayName");
      expect(model).toHaveProperty("description");
      expect(model).toHaveProperty("type");
      expect(model).toHaveProperty("contextWindow");
      expect(model).toHaveProperty("maxOutputTokens");
      expect(model).toHaveProperty("inputPricePerToken");
      expect(model).toHaveProperty("outputPricePerToken");
      expect(model).toHaveProperty("capabilities");
      expect(model).toHaveProperty("status");
    }
  });

  it("GET /api/models?provider=anthropic - filters by provider", async () => {
    const res = await getModels(
      createRequest(
        "GET",
        "http://localhost:3000/api/models?provider=anthropic",
      ),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    for (const model of json.data) {
      expect(model.providerId).toBe("anthropic");
    }
  });

  it("POST /api/models/compare - compares models", async () => {
    const res = await compareModels(
      createRequest("POST", "http://localhost:3000/api/models/compare", {
        modelIds: ["claude-sonnet-4-20250514", "gpt-4o"],
      }),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.models).toHaveLength(2);
    expect(json.data.recommendation).toBeDefined();
    expect(json.data.recommendation.modelId).toBeDefined();
    expect(json.data.recommendation.reason).toBeDefined();
    expect(typeof json.data.recommendation.confidence).toBe("number");
    expect(json.data.recommendation.confidence).toBeGreaterThan(0);
    expect(json.data.recommendation.confidence).toBeLessThanOrEqual(1);

    for (const entry of json.data.models) {
      expect(entry.model).toBeDefined();
      expect(entry.model.id).toBeDefined();
      expect(entry.scores).toBeDefined();
      expect(typeof entry.scores.price).toBe("number");
      expect(typeof entry.scores.speed).toBe("number");
      expect(typeof entry.scores.quality).toBe("number");
      expect(Array.isArray(entry.strengths)).toBe(true);
      expect(Array.isArray(entry.weaknesses)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Configs API
// ---------------------------------------------------------------------------

describe("Configs API", () => {
  it("POST /api/configs/generate - generates config", async () => {
    const res = await generateConfig(
      createRequest("POST", "http://localhost:3000/api/configs/generate", {
        userName: "TestUser",
        agentName: "TestAgent",
        channel: "telegram",
        provider: "anthropic",
      }),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);

    expect(json.data.config).toBeDefined();
    expect(json.data.config.user.name).toBe("TestUser");
    expect(json.data.config.user.agentName).toBe("TestAgent");
    expect(json.data.config.channel).toBe("telegram");
    expect(json.data.config.model.provider).toBe("anthropic");
    expect(json.data.config.model.modelId).toBeDefined();
    expect(json.data.config.version).toBe("2.0.2");
    expect(json.data.config.gateway).toBeDefined();
    expect(json.data.config.parameters).toBeDefined();

    expect(Array.isArray(json.data.files)).toBe(true);
    expect(json.data.files.length).toBeGreaterThanOrEqual(3);
    const fileNames = json.data.files.map((f: { name: string }) => f.name);
    expect(fileNames).toContain("config.json");
    expect(fileNames).toContain("SOUL.md");
    expect(fileNames).toContain("USER.md");

    expect(Array.isArray(json.data.instructions)).toBe(true);
    expect(json.data.instructions.length).toBeGreaterThan(0);
  });

  it("POST /api/configs/validate - validates valid config", async () => {
    const res = await validateConfig(
      createRequest("POST", "http://localhost:3000/api/configs/validate", {
        config: {
          version: "2.0.2",
          user: { name: "TestUser", agentName: "TestAgent" },
          channel: "telegram",
          model: {
            provider: "anthropic",
            modelId: "claude-sonnet-4-20250514",
          },
          gateway: { port: 18789 },
        },
        strict: false,
      }),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.valid).toBe(true);
    expect(json.data.errors).toHaveLength(0);
    expect(json.data.normalizedConfig).toBeDefined();
    expect(json.data.normalizedConfig.version).toBe("2.0.2");
    expect(json.data.normalizedConfig.gateway).toBeDefined();
    expect(Array.isArray(json.data.warnings)).toBe(true);
  });

  it("POST /api/configs/validate - returns errors for invalid config", async () => {
    const res = await validateConfig(
      createRequest("POST", "http://localhost:3000/api/configs/validate", {
        config: {},
        strict: false,
      }),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.valid).toBe(false);
    expect(json.data.errors.length).toBeGreaterThan(0);

    for (const error of json.data.errors) {
      expect(error).toHaveProperty("path");
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("code");
      expect(error.code).toBe("MISSING_REQUIRED");
    }

    expect(json.data.normalizedConfig).toBeNull();
  });

  it("POST /api/configs/parse - parses JSON config", async () => {
    const configObj = {
      version: "2.0.2",
      name: "test-config",
      gateway: { port: 18789 },
    };
    const res = await parseConfig(
      createRequest("POST", "http://localhost:3000/api/configs/parse", {
        raw: JSON.stringify(configObj),
        format: "json",
      }),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.config).toBeDefined();
    expect(json.data.config.version).toBe("2.0.2");
    expect(json.data.config.name).toBe("test-config");
    expect(json.data.originalFormat).toBe("json");
    expect(Array.isArray(json.data.parseWarnings)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Health API
// ---------------------------------------------------------------------------

describe("Health API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/health - returns healthy status", async () => {
    const res = await getHealth(
      createRequest("GET", "http://localhost:3000/api/health"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("healthy");
    expect(json.data.version).toBe("2.0.2");
    expect(typeof json.data.uptime).toBe("number");
    expect(json.data.uptime).toBeGreaterThanOrEqual(0);
    expect(json.data.environment).toBeDefined();
    expect(Array.isArray(json.data.checks)).toBe(true);
    expect(json.data.checks.length).toBeGreaterThanOrEqual(3);

    for (const check of json.data.checks) {
      expect(check).toHaveProperty("name");
      expect(check).toHaveProperty("status");
      expect(check).toHaveProperty("latencyMs");
      expect(check).toHaveProperty("message");
    }
  });

  it("GET /api/health/metrics - returns system metrics", async () => {
    const res = await getMetrics(
      createRequest("GET", "http://localhost:3000/api/health/metrics"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("cpu");
    expect(json.data).toHaveProperty("memory");
    expect(json.data).toHaveProperty("requests");
    expect(json.data).toHaveProperty("errors");
    expect(json.data).toHaveProperty("latency");

    expect(typeof json.data.cpu.usage).toBe("number");
    expect(typeof json.data.cpu.cores).toBe("number");
    expect(Array.isArray(json.data.cpu.loadAverage)).toBe(true);

    expect(typeof json.data.memory.used).toBe("number");
    expect(typeof json.data.memory.total).toBe("number");
    expect(typeof json.data.memory.percentage).toBe("number");

    expect(json.data.latency).toHaveProperty("p50");
    expect(json.data.latency).toHaveProperty("p90");
    expect(json.data.latency).toHaveProperty("p95");
    expect(json.data.latency).toHaveProperty("p99");
    expect(json.data.latency).toHaveProperty("average");

    expect(json.data.requests).toHaveProperty("byMethod");
    expect(json.data.requests).toHaveProperty("byStatus");
  });

  it("GET /api/health/dependencies - returns dependencies list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    const res = await getDependencies(
      createRequest("GET", "http://localhost:3000/api/health/dependencies"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("dependencies");
    expect(json.data).toHaveProperty("allHealthy");
    expect(Array.isArray(json.data.dependencies)).toBe(true);
    expect(json.data.dependencies.length).toBeGreaterThanOrEqual(3);

    for (const dep of json.data.dependencies) {
      expect(dep).toHaveProperty("name");
      expect(dep).toHaveProperty("type");
      expect(dep).toHaveProperty("status");
      expect(dep).toHaveProperty("latencyMs");
    }

    const depNames = json.data.dependencies.map(
      (d: { name: string }) => d.name,
    );
    expect(depNames).toContain("node_runtime");
    expect(depNames).toContain("filesystem");
    expect(depNames).toContain("anthropic_api");
    expect(depNames).toContain("openai_api");
  });
});

// ---------------------------------------------------------------------------
// 6. Users API
// ---------------------------------------------------------------------------

describe("Users API", () => {
  it("GET /api/users/profile - returns user profile", async () => {
    const res = await getUserProfile(
      createRequest("GET", "http://localhost:3000/api/users/profile"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("id");
    expect(json.data).toHaveProperty("email");
    expect(json.data).toHaveProperty("displayName");
    expect(json.data).toHaveProperty("avatarUrl");
    expect(json.data).toHaveProperty("role");
    expect(json.data).toHaveProperty("organization");
    expect(json.data).toHaveProperty("createdAt");
    expect(json.data).toHaveProperty("lastLoginAt");
    expect(json.data).toHaveProperty("stats");
    expect(typeof json.data.stats.totalSessions).toBe("number");
    expect(typeof json.data.stats.totalCommands).toBe("number");
    expect(typeof json.data.stats.totalTokensUsed).toBe("number");
    expect(json.data.stats.favoriteModel).toBeDefined();
  });

  it("GET /api/users/preferences - returns preferences", async () => {
    const res = await getPreferences(
      createRequest("GET", "http://localhost:3000/api/users/preferences"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("theme");
    expect(json.data).toHaveProperty("language");
    expect(json.data).toHaveProperty("timezone");
    expect(json.data).toHaveProperty("notifications");
    expect(json.data.notifications).toHaveProperty("email");
    expect(json.data.notifications).toHaveProperty("webhook");
    expect(json.data.notifications).toHaveProperty("setupAlerts");
    expect(json.data.notifications).toHaveProperty("healthAlerts");
    expect(json.data).toHaveProperty("defaults");
    expect(json.data.defaults).toHaveProperty("provider");
    expect(json.data.defaults).toHaveProperty("channel");
    expect(json.data.defaults).toHaveProperty("model");
  });

  it("PUT /api/users/preferences - updates preferences", async () => {
    const res = await updatePreferences(
      createRequest("PUT", "http://localhost:3000/api/users/preferences", {
        theme: "dark",
        language: "es",
      }),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.theme).toBe("dark");
    expect(json.data.language).toBe("es");
    expect(json.data).toHaveProperty("timezone");
    expect(json.data).toHaveProperty("notifications");
    expect(json.data.notifications).toHaveProperty("email");
    expect(json.data).toHaveProperty("defaults");
    expect(json.data.defaults).toHaveProperty("provider");
  });
});

// ---------------------------------------------------------------------------
// 7. Sessions API
// ---------------------------------------------------------------------------

describe("Sessions API", () => {
  it("GET /api/sessions - returns paginated sessions", async () => {
    const res = await getSessions(
      createRequest("GET", "http://localhost:3000/api/sessions"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("items");
    expect(json.data).toHaveProperty("pagination");
    expect(Array.isArray(json.data.items)).toBe(true);
    expect(json.data.items.length).toBeGreaterThan(0);
    expect(json.data.pagination).toHaveProperty("page");
    expect(json.data.pagination).toHaveProperty("total");
    expect(json.data.pagination).toHaveProperty("totalPages");
    expect(json.data.pagination).toHaveProperty("hasNext");
    expect(json.data.pagination).toHaveProperty("hasPrevious");

    const firstSession = json.data.items[0];
    expect(firstSession).toHaveProperty("id");
    expect(firstSession).toHaveProperty("userId");
    expect(firstSession).toHaveProperty("providerId");
    expect(firstSession).toHaveProperty("modelId");
    expect(firstSession).toHaveProperty("status");
    expect(firstSession).toHaveProperty("title");
  });

  it("GET /api/sessions/{id} - returns session detail", async () => {
    const res = await getSessionById(
      createRequest("GET", "http://localhost:3000/api/sessions/sess_001"),
      { params: Promise.resolve({ id: "sess_001" }) },
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.session).toBeDefined();
    expect(json.data.session.id).toBe("sess_001");
    expect(json.data.session.title).toBe("OpenClaw Gateway Setup");
    expect(json.data.session.status).toBe("completed");

    expect(json.data.events).toBeDefined();
    expect(Array.isArray(json.data.events)).toBe(true);
    expect(json.data.events.length).toBeGreaterThan(0);
    for (const event of json.data.events) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("role");
      expect(event).toHaveProperty("content");
      expect(event).toHaveProperty("tokens");
      expect(event).toHaveProperty("latencyMs");
      expect(event).toHaveProperty("timestamp");
    }

    expect(json.data.summary).toBeDefined();
    expect(json.data.summary).toHaveProperty("totalMessages");
    expect(json.data.summary).toHaveProperty("totalTokens");
    expect(json.data.summary).toHaveProperty("totalCost");
    expect(json.data.summary).toHaveProperty("averageLatency");
    expect(json.data.summary).toHaveProperty("errorCount");
    expect(typeof json.data.summary.totalTokens).toBe("number");
    expect(typeof json.data.summary.totalCost).toBe("number");
  });

  it("POST /api/sessions/{id}/replay - replays session", async () => {
    const res = await replaySession(
      createRequest(
        "POST",
        "http://localhost:3000/api/sessions/sess_001/replay",
        { speed: 2 },
      ),
      { params: Promise.resolve({ id: "sess_001" }) },
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.sessionId).toBe("sess_001");
    expect(json.data.playbackSpeed).toBe(2);
    expect(Array.isArray(json.data.events)).toBe(true);
    expect(json.data.events.length).toBeGreaterThan(0);
    expect(typeof json.data.totalDuration).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// 8. Commands API
// ---------------------------------------------------------------------------

describe("Commands API", () => {
  it("POST /api/commands/execute - creates command", async () => {
    const res = await executeCommand(
      createRequest("POST", "http://localhost:3000/api/commands/execute", {
        command: "setupclaw",
        args: ["--provider", "anthropic"],
      }),
    );
    expect(res.status).toBe(201);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.commandId).toBeDefined();
    expect(json.data.commandId).toMatch(/^cmd_/);
    expect(json.data.status).toBe("queued");
    expect(json.data.startedAt).toBeDefined();
    expect(json.data.estimatedDuration).toBeDefined();
    expect(typeof json.data.estimatedDuration).toBe("number");
  });

  it("GET /api/commands/{id}/status - returns status", async () => {
    const res = await getCommandStatus(
      createRequest(
        "GET",
        "http://localhost:3000/api/commands/cmd_001/status",
      ),
      { params: Promise.resolve({ id: "cmd_001" }) },
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.commandId).toBe("cmd_001");
    expect(json.data.command).toBe("setupclaw");
    expect(json.data.status).toBeDefined();
    expect(json.data).toHaveProperty("exitCode");
    expect(json.data).toHaveProperty("startedAt");
    expect(json.data).toHaveProperty("completedAt");
    expect(json.data).toHaveProperty("duration");
    expect(json.data).toHaveProperty("progress");
  });

  it("GET /api/commands/{id}/logs - returns logs", async () => {
    const res = await getCommandLogs(
      createRequest(
        "GET",
        "http://localhost:3000/api/commands/cmd_001/logs",
      ),
      { params: Promise.resolve({ id: "cmd_001" }) },
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.commandId).toBe("cmd_001");
    expect(Array.isArray(json.data.logs)).toBe(true);
    expect(json.data.logs.length).toBeGreaterThan(0);
    expect(typeof json.data.totalLines).toBe("number");
    expect(json.data.totalLines).toBe(json.data.logs.length);
    expect(json.data.truncated).toBe(false);

    for (const log of json.data.logs) {
      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("commandId");
      expect(log.commandId).toBe("cmd_001");
      expect(log).toHaveProperty("stream");
      expect(log).toHaveProperty("content");
      expect(log).toHaveProperty("timestamp");
      expect(log).toHaveProperty("lineNumber");
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Webhooks API
// ---------------------------------------------------------------------------

describe("Webhooks API", () => {
  const savedWebhooks = new Map(webhooksStore);

  beforeEach(() => {
    webhooksStore.clear();
    for (const [key, value] of savedWebhooks) {
      webhooksStore.set(key, structuredClone(value));
    }
  });

  it("GET /api/webhooks - returns webhook list", async () => {
    const res = await getWebhooks(
      createRequest("GET", "http://localhost:3000/api/webhooks"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("items");
    expect(json.data).toHaveProperty("pagination");
    expect(Array.isArray(json.data.items)).toBe(true);
    expect(json.data.items.length).toBeGreaterThanOrEqual(2);
    expect(json.data.pagination.total).toBeGreaterThanOrEqual(2);

    const firstWebhook = json.data.items[0];
    expect(firstWebhook).toHaveProperty("id");
    expect(firstWebhook).toHaveProperty("url");
    expect(firstWebhook).toHaveProperty("events");
    expect(firstWebhook).toHaveProperty("status");
    expect(firstWebhook).toHaveProperty("secret");
    expect(firstWebhook).toHaveProperty("retryPolicy");
    expect(firstWebhook).toHaveProperty("deliveryStats");
    expect(firstWebhook).toHaveProperty("createdAt");
  });

  it("POST /api/webhooks - registers new webhook", async () => {
    const res = await registerWebhook(
      createRequest("POST", "http://localhost:3000/api/webhooks", {
        url: "https://hooks.example.com/test",
        events: ["session.created", "config.updated"],
        description: "Integration test webhook",
      }),
    );
    expect(res.status).toBe(201);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data.id).toBeDefined();
    expect(json.data.id).toMatch(/^wh_/);
    expect(json.data.url).toBe("https://hooks.example.com/test");
    expect(json.data.events).toContain("session.created");
    expect(json.data.events).toContain("config.updated");
    expect(json.data.status).toBe("active");
    expect(json.data.description).toBe("Integration test webhook");
    expect(json.data.secret).toBeDefined();
    expect(json.data.secret).toMatch(/^whsec_/);
    expect(json.data.retryPolicy).toBeDefined();
    expect(json.data.retryPolicy.maxRetries).toBe(3);
    expect(json.data.deliveryStats).toBeDefined();
    expect(json.data.deliveryStats.totalDeliveries).toBe(0);
    expect(json.data.createdAt).toBeDefined();
    expect(json.data.updatedAt).toBeDefined();
  });

  it("POST /api/webhooks - rejects invalid URL", async () => {
    const res = await registerWebhook(
      createRequest("POST", "http://localhost:3000/api/webhooks", {
        url: "not-a-valid-url",
        events: ["session.created"],
      }),
    );
    expect(res.status).toBe(400);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("Request validation failed");
    expect(json.error.details).toBeDefined();
    expect(json.error.details.issues).toBeDefined();
  });

  it("DELETE /api/webhooks/{id} - deletes webhook", async () => {
    expect(webhooksStore.has("wh_001")).toBe(true);

    const res = await deleteWebhook(
      createRequest("DELETE", "http://localhost:3000/api/webhooks/wh_001"),
      { params: Promise.resolve({ id: "wh_001" }) },
    );
    expect(res.status).toBe(204);
    expect(webhooksStore.has("wh_001")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. Analytics API
// ---------------------------------------------------------------------------

describe("Analytics API", () => {
  it("GET /api/analytics/daily - returns daily data", async () => {
    const res = await getDailyAnalytics(
      createRequest("GET", "http://localhost:3000/api/analytics/daily"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("period");
    expect(json.data.period).toHaveProperty("startDate");
    expect(json.data.period).toHaveProperty("endDate");
    expect(json.data).toHaveProperty("data");
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(json.data.data.length).toBeGreaterThan(0);
    expect(json.data).toHaveProperty("summary");
    expect(json.data.summary).toHaveProperty("totalSessions");
    expect(json.data.summary).toHaveProperty("totalCommands");
    expect(json.data.summary).toHaveProperty("totalTokens");
    expect(json.data.summary).toHaveProperty("totalCost");
    expect(json.data.summary).toHaveProperty("totalErrors");
    expect(json.data.summary).toHaveProperty("mostActiveDay");

    const firstDay = json.data.data[0];
    expect(firstDay).toHaveProperty("date");
    expect(firstDay).toHaveProperty("sessions");
    expect(firstDay).toHaveProperty("commands");
    expect(firstDay).toHaveProperty("tokens");
    expect(firstDay).toHaveProperty("cost");
    expect(firstDay).toHaveProperty("errors");
    expect(firstDay).toHaveProperty("uniqueUsers");
    expect(firstDay).toHaveProperty("averageLatency");
  });

  it("GET /api/analytics/weekly - returns weekly data", async () => {
    const res = await getWeeklyAnalytics(
      createRequest("GET", "http://localhost:3000/api/analytics/weekly"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("period");
    expect(json.data.period).toHaveProperty("startDate");
    expect(json.data.period).toHaveProperty("endDate");
    expect(json.data).toHaveProperty("data");
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(json.data.data.length).toBeGreaterThan(0);
    expect(json.data).toHaveProperty("summary");

    const firstWeek = json.data.data[0];
    expect(firstWeek).toHaveProperty("weekStart");
    expect(firstWeek).toHaveProperty("weekEnd");
    expect(firstWeek).toHaveProperty("sessions");
    expect(firstWeek).toHaveProperty("commands");
    expect(firstWeek).toHaveProperty("tokens");
    expect(firstWeek).toHaveProperty("cost");
    expect(firstWeek).toHaveProperty("errors");
    expect(firstWeek).toHaveProperty("uniqueUsers");
    expect(firstWeek).toHaveProperty("growthRate");
  });

  it("GET /api/analytics/monthly - returns monthly data", async () => {
    const res = await getMonthlyAnalytics(
      createRequest("GET", "http://localhost:3000/api/analytics/monthly"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("period");
    expect(json.data).toHaveProperty("data");
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(json.data.data.length).toBeGreaterThan(0);
    expect(json.data).toHaveProperty("summary");

    const firstMonth = json.data.data[0];
    expect(firstMonth).toHaveProperty("month");
    expect(firstMonth).toHaveProperty("sessions");
    expect(firstMonth).toHaveProperty("commands");
    expect(firstMonth).toHaveProperty("tokens");
    expect(firstMonth).toHaveProperty("cost");
    expect(firstMonth).toHaveProperty("errors");
    expect(firstMonth).toHaveProperty("uniqueUsers");
    expect(firstMonth).toHaveProperty("growthRate");
    expect(firstMonth).toHaveProperty("projectedCost");
    expect(typeof firstMonth.projectedCost).toBe("number");
  });

  it("GET /api/analytics/by-language - returns language breakdown", async () => {
    const res = await getByLanguage(
      createRequest(
        "GET",
        "http://localhost:3000/api/analytics/by-language",
      ),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("period");
    expect(json.data).toHaveProperty("languages");
    expect(json.data).toHaveProperty("totalLanguages");
    expect(Array.isArray(json.data.languages)).toBe(true);
    expect(json.data.languages.length).toBeGreaterThan(0);
    expect(json.data.totalLanguages).toBe(json.data.languages.length);

    const firstLang = json.data.languages[0];
    expect(firstLang).toHaveProperty("language");
    expect(firstLang).toHaveProperty("sessions");
    expect(firstLang).toHaveProperty("tokens");
    expect(firstLang).toHaveProperty("cost");
    expect(firstLang).toHaveProperty("percentage");
    expect(firstLang).toHaveProperty("trend");
    expect(["up", "down", "stable"]).toContain(firstLang.trend);
  });

  it("GET /api/analytics/by-model - returns model breakdown", async () => {
    const res = await getByModel(
      createRequest("GET", "http://localhost:3000/api/analytics/by-model"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("period");
    expect(json.data).toHaveProperty("models");
    expect(json.data).toHaveProperty("totalModels");
    expect(Array.isArray(json.data.models)).toBe(true);
    expect(json.data.models.length).toBeGreaterThan(0);
    expect(json.data.totalModels).toBe(json.data.models.length);

    const firstModel = json.data.models[0];
    expect(firstModel).toHaveProperty("modelId");
    expect(firstModel).toHaveProperty("modelName");
    expect(firstModel).toHaveProperty("provider");
    expect(firstModel).toHaveProperty("sessions");
    expect(firstModel).toHaveProperty("tokens");
    expect(firstModel).toHaveProperty("cost");
    expect(firstModel).toHaveProperty("averageLatency");
    expect(firstModel).toHaveProperty("errorRate");
    expect(firstModel).toHaveProperty("satisfaction");
    expect(firstModel).toHaveProperty("percentage");
  });

  it("GET /api/analytics/trends - returns trend data", async () => {
    const res = await getTrends(
      createRequest("GET", "http://localhost:3000/api/analytics/trends"),
    );
    expect(res.status).toBe(200);

    const json = await parseResponse<any>(res);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("period");
    expect(json.data.period).toHaveProperty("startDate");
    expect(json.data.period).toHaveProperty("endDate");
    expect(json.data).toHaveProperty("trends");
    expect(json.data).toHaveProperty("insights");
    expect(Array.isArray(json.data.trends)).toBe(true);
    expect(json.data.trends.length).toBeGreaterThan(0);

    const trend = json.data.trends[0];
    expect(trend).toHaveProperty("metric");
    expect(trend).toHaveProperty("current");
    expect(trend).toHaveProperty("previous");
    expect(trend).toHaveProperty("change");
    expect(trend).toHaveProperty("changePercentage");
    expect(trend).toHaveProperty("direction");
    expect(["up", "down", "stable"]).toContain(trend.direction);
    expect(trend).toHaveProperty("series");
    expect(Array.isArray(trend.series)).toBe(true);
    expect(trend.series.length).toBeGreaterThan(0);
    expect(trend.series[0]).toHaveProperty("timestamp");
    expect(trend.series[0]).toHaveProperty("value");

    expect(Array.isArray(json.data.insights)).toBe(true);
    for (const insight of json.data.insights) {
      expect(insight).toHaveProperty("type");
      expect(["positive", "negative", "neutral"]).toContain(insight.type);
      expect(insight).toHaveProperty("metric");
      expect(insight).toHaveProperty("message");
      expect(insight).toHaveProperty("significance");
      expect(typeof insight.significance).toBe("number");
    }
  });
});
