import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getHealth } from "../../src/app/api/health/route";
import { GET as getMetrics } from "../../src/app/api/health/metrics/route";
import { GET as getDependencies } from "../../src/app/api/health/dependencies/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("Health API", () => {
  describe("GET /api/health", () => {
    it("returns healthy status", async () => {
      const res = await getHealth(createRequest("/api/health"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("healthy");
      expect(json.data.version).toBe("1.0.0");
    });

    it("includes uptime as a number", async () => {
      const res = await getHealth(createRequest("/api/health"));
      const json = await res.json();

      expect(typeof json.data.uptime).toBe("number");
      expect(json.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it("includes environment field", async () => {
      const res = await getHealth(createRequest("/api/health"));
      const json = await res.json();

      expect(typeof json.data.environment).toBe("string");
    });

    it("returns health checks array", async () => {
      const res = await getHealth(createRequest("/api/health"));
      const json = await res.json();

      expect(Array.isArray(json.data.checks)).toBe(true);
      expect(json.data.checks.length).toBeGreaterThanOrEqual(3);

      for (const check of json.data.checks) {
        expect(check).toHaveProperty("name");
        expect(check).toHaveProperty("status");
        expect(check).toHaveProperty("latencyMs");
      }
    });

    it("checks include api and database", async () => {
      const res = await getHealth(createRequest("/api/health"));
      const json = await res.json();

      const names = json.data.checks.map((c: { name: string }) => c.name);
      expect(names).toContain("api");
      expect(names).toContain("database");
    });
  });

  describe("GET /api/health/metrics", () => {
    it("returns metric structure with all sections", async () => {
      const res = await getMetrics(createRequest("/api/health/metrics"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveProperty("cpu");
      expect(json.data).toHaveProperty("memory");
      expect(json.data).toHaveProperty("requests");
      expect(json.data).toHaveProperty("errors");
      expect(json.data).toHaveProperty("latency");
    });

    it("cpu metrics have expected fields", async () => {
      const res = await getMetrics(createRequest("/api/health/metrics"));
      const json = await res.json();

      expect(typeof json.data.cpu.usage).toBe("number");
      expect(typeof json.data.cpu.cores).toBe("number");
      expect(Array.isArray(json.data.cpu.loadAverage)).toBe(true);
    });

    it("memory metrics have expected fields", async () => {
      const res = await getMetrics(createRequest("/api/health/metrics"));
      const json = await res.json();

      expect(typeof json.data.memory.used).toBe("number");
      expect(typeof json.data.memory.total).toBe("number");
      expect(typeof json.data.memory.percentage).toBe("number");
      expect(json.data.memory.percentage).toBeGreaterThan(0);
      expect(json.data.memory.percentage).toBeLessThanOrEqual(100);
    });

    it("latency metrics include percentiles", async () => {
      const res = await getMetrics(createRequest("/api/health/metrics"));
      const json = await res.json();

      expect(json.data.latency).toHaveProperty("p50");
      expect(json.data.latency).toHaveProperty("p90");
      expect(json.data.latency).toHaveProperty("p95");
      expect(json.data.latency).toHaveProperty("p99");
      expect(json.data.latency).toHaveProperty("average");
    });

    it("request metrics have byMethod and byStatus", async () => {
      const res = await getMetrics(createRequest("/api/health/metrics"));
      const json = await res.json();

      expect(json.data.requests.byMethod).toBeDefined();
      expect(json.data.requests.byStatus).toBeDefined();
    });
  });

  describe("GET /api/health/dependencies", () => {
    it("returns dependencies array with allHealthy flag", async () => {
      const res = await getDependencies(
        createRequest("/api/health/dependencies"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveProperty("dependencies");
      expect(json.data).toHaveProperty("allHealthy");
      expect(Array.isArray(json.data.dependencies)).toBe(true);
    });

    it("allHealthy is true when all dependencies are up", async () => {
      const res = await getDependencies(
        createRequest("/api/health/dependencies"),
      );
      const json = await res.json();
      expect(json.data.allHealthy).toBe(true);
    });

    it("includes external API dependencies", async () => {
      const res = await getDependencies(
        createRequest("/api/health/dependencies"),
      );
      const json = await res.json();

      const names = json.data.dependencies.map(
        (d: { name: string }) => d.name,
      );
      expect(names).toContain("OpenAI API");
      expect(names).toContain("Anthropic API");
    });

    it("includes database and cache dependencies", async () => {
      const res = await getDependencies(
        createRequest("/api/health/dependencies"),
      );
      const json = await res.json();

      const types = json.data.dependencies.map(
        (d: { type: string }) => d.type,
      );
      expect(types).toContain("database");
      expect(types).toContain("cache");
    });

    it("each dependency has name, type, status, and latencyMs", async () => {
      const res = await getDependencies(
        createRequest("/api/health/dependencies"),
      );
      const json = await res.json();

      for (const dep of json.data.dependencies) {
        expect(dep).toHaveProperty("name");
        expect(dep).toHaveProperty("type");
        expect(dep).toHaveProperty("status");
        expect(dep).toHaveProperty("latencyMs");
      }
    });
  });
});
