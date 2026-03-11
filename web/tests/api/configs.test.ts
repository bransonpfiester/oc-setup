import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as generateConfig } from "../../src/app/api/configs/generate/route";
import { POST as validateConfig } from "../../src/app/api/configs/validate/route";
import { POST as parseConfig } from "../../src/app/api/configs/parse/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("Configs API", () => {
  describe("POST /api/configs/generate", () => {
    it("generates config with required fields", async () => {
      const res = await generateConfig(
        createRequest("/api/configs/generate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "anthropic",
            modelId: "claude-sonnet-4-20250514",
          }),
        }),
      );

      expect(res.status).toBe(201);
      const json = await res.json();

      expect(json.data.config).toBeDefined();
      expect(json.data.config.providerId).toBe("anthropic");
      expect(json.data.config.modelId).toBe("claude-sonnet-4-20250514");
      expect(json.data.config.parameters).toBeDefined();
      expect(json.data.warnings).toBeDefined();
    });

    it("uses balanced preset by default", async () => {
      const res = await generateConfig(
        createRequest("/api/configs/generate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "openai",
            modelId: "gpt-4o",
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.config.parameters.temperature).toBe(0.7);
      expect(json.data.config.parameters.maxTokens).toBe(2048);
    });

    it("applies preset overrides", async () => {
      const res = await generateConfig(
        createRequest("/api/configs/generate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "openai",
            modelId: "gpt-4o",
            preset: "creative",
            overrides: { temperature: 1.8 },
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.config.parameters.temperature).toBe(1.8);
      expect(json.data.warnings.length).toBeGreaterThan(0);
    });

    it("warns about high temperature", async () => {
      const res = await generateConfig(
        createRequest("/api/configs/generate", {
          method: "POST",
          body: JSON.stringify({
            providerId: "openai",
            modelId: "gpt-4o",
            overrides: { temperature: 1.9 },
          }),
        }),
      );

      const json = await res.json();
      const tempWarning = json.data.warnings.find(
        (w: { field: string }) => w.field === "parameters.temperature",
      );
      expect(tempWarning).toBeDefined();
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await generateConfig(
        createRequest("/api/configs/generate", {
          method: "POST",
          body: JSON.stringify({ providerId: "openai" }),
        }),
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/configs/validate", () => {
    it("validates a config with required fields", async () => {
      const res = await validateConfig(
        createRequest("/api/configs/validate", {
          method: "POST",
          body: JSON.stringify({
            config: {
              providerId: "anthropic",
              modelId: "claude-sonnet-4-20250514",
              parameters: { temperature: 0.7 },
            },
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.valid).toBe(true);
      expect(json.data.errors).toHaveLength(0);
    });

    it("returns errors for missing required fields", async () => {
      const res = await validateConfig(
        createRequest("/api/configs/validate", {
          method: "POST",
          body: JSON.stringify({
            config: {},
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.valid).toBe(false);
      expect(json.data.errors.length).toBeGreaterThan(0);

      const paths = json.data.errors.map(
        (e: { path: string }) => e.path,
      );
      expect(paths).toContain("providerId");
    });

    it("enforces personality check in strict mode", async () => {
      const res = await validateConfig(
        createRequest("/api/configs/validate", {
          method: "POST",
          body: JSON.stringify({
            config: {
              providerId: "anthropic",
              modelId: "claude-sonnet-4-20250514",
              parameters: { temperature: 0.7 },
            },
            strict: true,
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.valid).toBe(false);

      const paths = json.data.errors.map(
        (e: { path: string }) => e.path,
      );
      expect(paths).toContain("personality");
    });

    it("warns about high temperature", async () => {
      const res = await validateConfig(
        createRequest("/api/configs/validate", {
          method: "POST",
          body: JSON.stringify({
            config: {
              providerId: "openai",
              modelId: "gpt-4o",
              parameters: { temperature: 1.8 },
            },
          }),
        }),
      );

      const json = await res.json();
      const tempWarning = json.data.warnings.find(
        (w: { field: string }) => w.field === "parameters.temperature",
      );
      expect(tempWarning).toBeDefined();
      expect(tempWarning.severity).toBe("warning");
    });

    it("returns error for out-of-range temperature", async () => {
      const res = await validateConfig(
        createRequest("/api/configs/validate", {
          method: "POST",
          body: JSON.stringify({
            config: {
              providerId: "openai",
              modelId: "gpt-4o",
              parameters: { temperature: 3.0 },
            },
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.valid).toBe(false);
      const tempError = json.data.errors.find(
        (e: { path: string }) => e.path === "parameters.temperature",
      );
      expect(tempError).toBeDefined();
    });
  });

  describe("POST /api/configs/parse", () => {
    it("parses valid JSON config", async () => {
      const configObj = {
        providerId: "openai",
        modelId: "gpt-4o",
        temperature: 0.5,
      };

      const res = await parseConfig(
        createRequest("/api/configs/parse", {
          method: "POST",
          body: JSON.stringify({
            content: JSON.stringify(configObj),
            format: "json",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.config).toBeDefined();
      expect(json.data.originalFormat).toBe("json");
      expect(json.data.config.providerId).toBe("openai");
    });

    it("parses ENV format", async () => {
      const envContent = [
        "PROVIDER_ID=openai",
        "MODEL_ID=gpt-4o",
        "TEMPERATURE=0.8",
      ].join("\n");

      const res = await parseConfig(
        createRequest("/api/configs/parse", {
          method: "POST",
          body: JSON.stringify({
            content: envContent,
            format: "env",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.config).toBeDefined();
      expect(json.data.originalFormat).toBe("env");
      expect(json.data.config.providerId).toBe("openai");
    });

    it("returns 400 for invalid JSON content", async () => {
      const res = await parseConfig(
        createRequest("/api/configs/parse", {
          method: "POST",
          body: JSON.stringify({
            content: "not valid json {{{",
            format: "json",
          }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("returns parse warnings for YAML format", async () => {
      const res = await parseConfig(
        createRequest("/api/configs/parse", {
          method: "POST",
          body: JSON.stringify({
            content: "key: value",
            format: "yaml",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.parseWarnings.length).toBeGreaterThan(0);
    });

    it("returns 400 when content is empty", async () => {
      const res = await parseConfig(
        createRequest("/api/configs/parse", {
          method: "POST",
          body: JSON.stringify({
            content: "",
            format: "json",
          }),
        }),
      );

      expect(res.status).toBe(400);
    });
  });
});
