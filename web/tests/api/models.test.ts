import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as listModels } from "../../src/app/api/models/route";
import { POST as compareModels } from "../../src/app/api/models/compare/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("Models API", () => {
  describe("GET /api/models", () => {
    it("returns paginated list of models", async () => {
      const res = await listModels(createRequest("/api/models"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("items");
      expect(json.data).toHaveProperty("pagination");
      expect(json.data.items.length).toBeGreaterThanOrEqual(4);
    });

    it("filters models by provider", async () => {
      const res = await listModels(
        createRequest("/api/models?providerId=openai"),
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      for (const model of json.data.items) {
        expect(model.providerId).toBe("openai");
      }
      expect(json.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 404 for provider with no models", async () => {
      const res = await listModels(
        createRequest("/api/models?providerId=nonexistent"),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("each model has expected fields", async () => {
      const res = await listModels(createRequest("/api/models"));
      const json = await res.json();

      for (const model of json.data.items) {
        expect(model).toHaveProperty("id");
        expect(model).toHaveProperty("providerId");
        expect(model).toHaveProperty("name");
        expect(model).toHaveProperty("displayName");
        expect(model).toHaveProperty("type");
        expect(model).toHaveProperty("contextWindow");
        expect(typeof model.contextWindow).toBe("number");
        expect(model).toHaveProperty("capabilities");
        expect(Array.isArray(model.capabilities)).toBe(true);
        expect(model).toHaveProperty("status");
      }
    });

    it("filters by model type", async () => {
      const res = await listModels(
        createRequest("/api/models?type=multimodal"),
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      for (const model of json.data.items) {
        expect(model.type).toBe("multimodal");
      }
    });
  });

  describe("POST /api/models/compare", () => {
    it("compares two valid models and returns scores", async () => {
      const res = await compareModels(
        createRequest("/api/models/compare", {
          method: "POST",
          body: JSON.stringify({
            modelIds: ["gpt-4o", "claude-sonnet-4-20250514"],
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.models).toHaveLength(2);
      expect(json.data.recommendation).toBeDefined();
      expect(json.data.recommendation.modelId).toBeDefined();
      expect(typeof json.data.recommendation.confidence).toBe("number");

      for (const entry of json.data.models) {
        expect(entry.model).toBeDefined();
        expect(entry.scores).toBeDefined();
        expect(entry.benchmarks).toBeDefined();
      }
    });

    it("returns 404 for unknown model IDs", async () => {
      const res = await compareModels(
        createRequest("/api/models/compare", {
          method: "POST",
          body: JSON.stringify({
            modelIds: ["nonexistent-model-a", "nonexistent-model-b"],
          }),
        }),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 400 when fewer than 2 models provided", async () => {
      const res = await compareModels(
        createRequest("/api/models/compare", {
          method: "POST",
          body: JSON.stringify({ modelIds: ["gpt-4o"] }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("uses custom metrics when provided", async () => {
      const res = await compareModels(
        createRequest("/api/models/compare", {
          method: "POST",
          body: JSON.stringify({
            modelIds: ["gpt-4o", "gpt-4o-mini"],
            metrics: ["price", "speed"],
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();

      for (const entry of json.data.models) {
        expect(entry.scores).toHaveProperty("price");
        expect(entry.scores).toHaveProperty("speed");
      }
    });

    it("includes recommendation with reason and confidence", async () => {
      const res = await compareModels(
        createRequest("/api/models/compare", {
          method: "POST",
          body: JSON.stringify({
            modelIds: ["gpt-4o-mini", "gemini-2.0-flash"],
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.recommendation).not.toBeNull();
      expect(typeof json.data.recommendation.reason).toBe("string");
      expect(json.data.recommendation.confidence).toBeGreaterThan(0);
      expect(json.data.recommendation.confidence).toBeLessThanOrEqual(1);
    });
  });
});
