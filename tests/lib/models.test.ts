import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  MODEL_PROVIDERS,
  validateApiKey,
  type ModelConfig,
} from "../../src/lib/models.js";
import { logger } from "../../src/utils/logger.js";

describe("models", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("MODEL_PROVIDERS", () => {
    it("has exactly 3 entries", () => {
      expect(MODEL_PROVIDERS).toHaveLength(3);
    });

    it("includes anthropic provider", () => {
      const anthropic = MODEL_PROVIDERS.find(
        (p) => p.provider === "anthropic",
      );
      expect(anthropic).toBeDefined();
      expect(anthropic!.label).toBe("Anthropic (Claude)");
    });

    it("includes openai provider", () => {
      const openai = MODEL_PROVIDERS.find((p) => p.provider === "openai");
      expect(openai).toBeDefined();
      expect(openai!.label).toBe("OpenAI (GPT-4o)");
    });

    it("includes openrouter provider", () => {
      const openrouter = MODEL_PROVIDERS.find(
        (p) => p.provider === "openrouter",
      );
      expect(openrouter).toBeDefined();
      expect(openrouter!.label).toBe("OpenRouter (multiple models)");
    });

    it("each provider has label, defaultModel, and hint", () => {
      for (const provider of MODEL_PROVIDERS) {
        expect(provider).toHaveProperty("provider");
        expect(provider).toHaveProperty("label");
        expect(provider).toHaveProperty("defaultModel");
        expect(provider).toHaveProperty("hint");
        expect(typeof provider.label).toBe("string");
        expect(typeof provider.defaultModel).toBe("string");
        expect(typeof provider.hint).toBe("string");
        expect(provider.label.length).toBeGreaterThan(0);
        expect(provider.defaultModel.length).toBeGreaterThan(0);
        expect(provider.hint.length).toBeGreaterThan(0);
      }
    });
  });

  describe("validateApiKey", () => {
    it("returns true for valid anthropic key (200 response)", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      const result = await validateApiKey("anthropic", "sk-ant-test-key");

      expect(result).toBe(true);
    });

    it("returns false for invalid anthropic key (401 response)", async () => {
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      const result = await validateApiKey("anthropic", "invalid-key");

      expect(result).toBe(false);
    });

    it("returns true for valid openai key (200 response)", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      const result = await validateApiKey("openai", "sk-openai-test");

      expect(result).toBe(true);
    });

    it("returns false for invalid openai key (401 response)", async () => {
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      const result = await validateApiKey("openai", "bad-key");

      expect(result).toBe(false);
    });

    it("returns true for valid openrouter key (200 response)", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      const result = await validateApiKey("openrouter", "or-test-key");

      expect(result).toBe(true);
    });

    it("returns false for invalid openrouter key (401 response)", async () => {
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      const result = await validateApiKey("openrouter", "bad-key");

      expect(result).toBe(false);
    });

    it("returns false for skip provider", async () => {
      const result = await validateApiKey("skip", "any-key");

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns false on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"));

      const result = await validateApiKey("anthropic", "key");

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("API key validation failed"),
      );
    });

    it("trims whitespace from key before validation", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("anthropic", "  test-key  ");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-api-key": "test-key",
          }),
        }),
      );
    });

    it("returns false for anthropic 403 status", async () => {
      mockFetch.mockResolvedValue({ status: 403, ok: false });

      const result = await validateApiKey("anthropic", "forbidden-key");

      expect(result).toBe(false);
    });

    it("returns true for anthropic 500 status (key is valid)", async () => {
      mockFetch.mockResolvedValue({ status: 500, ok: false });

      const result = await validateApiKey("anthropic", "valid-key");

      expect(result).toBe(true);
    });

    it("sends correct headers for anthropic validation", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("anthropic", "sk-ant-key123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "x-api-key": "sk-ant-key123",
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          }),
        }),
      );
    });

    it("sends POST for anthropic and no explicit method for openai", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("anthropic", "key");
      const anthropicCall = mockFetch.mock.calls[0];
      expect(anthropicCall[1].method).toBe("POST");

      mockFetch.mockClear();
      await validateApiKey("openai", "key");
      const openaiCall = mockFetch.mock.calls[0];
      expect(openaiCall[1]).not.toHaveProperty("method");
    });

    it("includes body in anthropic request", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("anthropic", "key");

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toHaveProperty("model");
      expect(body).toHaveProperty("max_tokens", 1);
      expect(body).toHaveProperty("messages");
    });

    it("sends Authorization header for openai", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("openai", "sk-openai-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        expect.objectContaining({
          headers: { Authorization: "Bearer sk-openai-123" },
        }),
      );
    });

    it("sends Authorization header for openrouter", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("openrouter", "or-key-456");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/models",
        expect.objectContaining({
          headers: { Authorization: "Bearer or-key-456" },
        }),
      );
    });

    it("includes signal in all fetch calls", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      for (const provider of ["anthropic", "openai", "openrouter"] as const) {
        mockFetch.mockClear();
        await validateApiKey(provider, "key");
        const call = mockFetch.mock.calls[0];
        expect(call[1]).toHaveProperty("signal");
      }
    });
  });
});
