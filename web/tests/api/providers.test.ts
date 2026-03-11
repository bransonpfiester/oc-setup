import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as listProviders } from "../../src/app/api/providers/route";
import { GET as getProvider } from "../../src/app/api/providers/[id]/route";
import { POST as validateProvider } from "../../src/app/api/providers/validate/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

function routeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Providers API", () => {
  describe("GET /api/providers", () => {
    it("returns a paginated list of providers", async () => {
      const res = await listProviders(createRequest("/api/providers"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("items");
      expect(json.data).toHaveProperty("pagination");
      expect(Array.isArray(json.data.items)).toBe(true);
      expect(json.data.items.length).toBeGreaterThanOrEqual(3);
    });

    it("each provider has expected fields", async () => {
      const res = await listProviders(createRequest("/api/providers"));
      const json = await res.json();

      for (const provider of json.data.items) {
        expect(provider).toHaveProperty("id");
        expect(provider).toHaveProperty("name");
        expect(provider).toHaveProperty("slug");
        expect(provider).toHaveProperty("status");
        expect(provider).toHaveProperty("description");
        expect(provider).toHaveProperty("baseUrl");
      }
    });

    it("includes known provider IDs", async () => {
      const res = await listProviders(createRequest("/api/providers"));
      const json = await res.json();
      const ids = json.data.items.map((p: { id: string }) => p.id);

      expect(ids).toContain("openai");
      expect(ids).toContain("anthropic");
      expect(ids).toContain("google");
    });

    it("all providers have active status", async () => {
      const res = await listProviders(createRequest("/api/providers"));
      const json = await res.json();

      for (const provider of json.data.items) {
        expect(provider.status).toBe("active");
      }
    });
  });

  describe("GET /api/providers/:id", () => {
    it("returns detailed info for anthropic", async () => {
      const res = await getProvider(
        createRequest("/api/providers/anthropic"),
        routeCtx("anthropic"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.provider.id).toBe("anthropic");
      expect(json.data.provider.name).toBe("Anthropic");
      expect(json.data.health).toBeDefined();
      expect(json.data.usage).toBeDefined();
    });

    it("returns detailed info for openai with health and usage", async () => {
      const res = await getProvider(
        createRequest("/api/providers/openai"),
        routeCtx("openai"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.provider.id).toBe("openai");
      expect(json.data.health.status).toBe("active");
      expect(typeof json.data.health.latencyMs).toBe("number");
      expect(typeof json.data.usage.totalRequests).toBe("number");
    });

    it("returns 404 for unknown provider", async () => {
      const res = await getProvider(
        createRequest("/api/providers/unknown"),
        routeCtx("unknown"),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("provider detail includes rate limits", async () => {
      const res = await getProvider(
        createRequest("/api/providers/google"),
        routeCtx("google"),
      );

      const json = await res.json();
      const rl = json.data.provider.rateLimits;
      expect(typeof rl.requestsPerMinute).toBe("number");
      expect(typeof rl.tokensPerMinute).toBe("number");
      expect(typeof rl.concurrentRequests).toBe("number");
    });
  });

  describe("POST /api/providers/validate", () => {
    it("validates a valid API key", async () => {
      const res = await validateProvider(
        createRequest("/api/providers/validate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "anthropic",
            apiKey: "sk-ant-test-key-1234567890",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.valid).toBe(true);
      expect(json.data.provider).toBe("anthropic");
      expect(json.data.permissions.length).toBeGreaterThan(0);
    });

    it("reports invalid for short key", async () => {
      const res = await validateProvider(
        createRequest("/api/providers/validate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "anthropic",
            apiKey: "short",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.valid).toBe(false);
      expect(json.data.permissions).toEqual([]);
    });

    it("returns 400 for unsupported provider", async () => {
      const res = await validateProvider(
        createRequest("/api/providers/validate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "unknown_provider",
            apiKey: "sk-test-1234567890",
          }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("validates an openai key successfully", async () => {
      const res = await validateProvider(
        createRequest("/api/providers/validate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "openai",
            apiKey: "sk-openai-test-1234567890",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.valid).toBe(true);
      expect(json.data.provider).toBe("openai");
    });

    it("returns 400 when apiKey is missing", async () => {
      const res = await validateProvider(
        createRequest("/api/providers/validate", {
          method: "POST",
          body: JSON.stringify({ providerId: "anthropic" }),
        }),
      );

      expect(res.status).toBe(400);
    });
  });
});
