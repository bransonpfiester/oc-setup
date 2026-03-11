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
} from "../../src/lib/models.js";
import { logger } from "../../src/utils/logger.js";

describe("models validation", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("validateApiKey edge cases", () => {
    it("returns false for empty string key", async () => {
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      const result = await validateApiKey("anthropic", "");

      expect(result).toBe(false);
    });

    it("returns false for whitespace-only key", async () => {
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      const result = await validateApiKey("anthropic", "   ");

      expect(result).toBe(false);
    });

    it("handles very long key string", async () => {
      const longKey = "sk-" + "a".repeat(500);
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      const result = await validateApiKey("anthropic", longKey);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("returns false on fetch timeout", async () => {
      mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));

      const result = await validateApiKey("anthropic", "key");

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it("handles 200 status as valid for all providers", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      for (const provider of ["anthropic", "openai", "openrouter"] as const) {
        const result = await validateApiKey(provider, "valid-key");
        expect(result).toBe(true);
      }
    });

    it("handles 400 status as valid key for anthropic", async () => {
      mockFetch.mockResolvedValue({ status: 400, ok: false });

      const result = await validateApiKey("anthropic", "key");

      expect(result).toBe(true);
    });

    it("handles 401 status as invalid for all providers", async () => {
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      for (const provider of ["anthropic", "openai", "openrouter"] as const) {
        const result = await validateApiKey(provider, "bad-key");
        expect(result).toBe(false);
      }
    });

    it("handles 403 status as invalid for anthropic only", async () => {
      mockFetch.mockResolvedValue({ status: 403, ok: false });

      const anthropicResult = await validateApiKey("anthropic", "key");
      expect(anthropicResult).toBe(false);

      const openaiResult = await validateApiKey("openai", "key");
      expect(openaiResult).toBe(true);

      const openrouterResult = await validateApiKey("openrouter", "key");
      expect(openrouterResult).toBe(true);
    });

    it("handles 500 status as valid key (server error, not auth)", async () => {
      mockFetch.mockResolvedValue({ status: 500, ok: false });

      for (const provider of ["anthropic", "openai", "openrouter"] as const) {
        const result = await validateApiKey(provider, "key");
        expect(result).toBe(true);
      }
    });

    it("calls correct URL for openai validation", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("openai", "test-key");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        expect.any(Object),
      );
    });

    it("calls correct URL for openrouter validation", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("openrouter", "test-key");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/models",
        expect.any(Object),
      );
    });

    it("anthropic validation sends POST request", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("anthropic", "key");

      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe("POST");
    });

    it("openai validation sends GET request (no method specified)", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("openai", "key");

      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBeUndefined();
    });

    it("returns false for unknown provider type", async () => {
      const result = await validateApiKey(
        "unknown" as "anthropic",
        "key",
      );

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles concurrent validation calls", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      const results = await Promise.all([
        validateApiKey("anthropic", "key-1"),
        validateApiKey("openai", "key-2"),
        validateApiKey("openrouter", "key-3"),
      ]);

      expect(results).toEqual([true, true, true]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("handles special characters in key", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("openai", "sk-key/with+special=chars");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer sk-key/with+special=chars",
          },
        }),
      );
    });

    it("fetch is called with AbortSignal for timeout", async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true });

      await validateApiKey("anthropic", "key");

      const call = mockFetch.mock.calls[0];
      expect(call[1].signal).toBeDefined();
    });
  });

  describe("MODEL_PROVIDERS data integrity", () => {
    it("all defaultModel values are non-empty strings", () => {
      for (const provider of MODEL_PROVIDERS) {
        expect(typeof provider.defaultModel).toBe("string");
        expect(provider.defaultModel.length).toBeGreaterThan(0);
      }
    });

    it("all hint values are non-empty strings", () => {
      for (const provider of MODEL_PROVIDERS) {
        expect(typeof provider.hint).toBe("string");
        expect(provider.hint.length).toBeGreaterThan(0);
      }
    });

    it("all provider labels are unique", () => {
      const labels = MODEL_PROVIDERS.map((p) => p.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it("all provider names are unique", () => {
      const providers = MODEL_PROVIDERS.map((p) => p.provider);
      const uniqueProviders = new Set(providers);
      expect(uniqueProviders.size).toBe(providers.length);
    });

    it("all defaultModels are strings", () => {
      for (const provider of MODEL_PROVIDERS) {
        expect(typeof provider.defaultModel).toBe("string");
      }
    });
  });
});
