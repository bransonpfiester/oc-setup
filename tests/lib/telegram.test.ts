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
  isValidTokenFormat,
  validateToken,
  type TelegramBotInfo,
} from "../../src/lib/telegram.js";
import { logger } from "../../src/utils/logger.js";

describe("telegram", () => {
  const mockFetch = vi.fn();
  const VALID_TOKEN = "12345678:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk";

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isValidTokenFormat", () => {
    it("accepts valid token format", () => {
      expect(isValidTokenFormat(VALID_TOKEN)).toBe(true);
    });

    it("rejects token without colon separator", () => {
      expect(isValidTokenFormat("12345678ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk")).toBe(false);
    });

    it("rejects token with too-short numeric part (less than 8 digits)", () => {
      expect(isValidTokenFormat("1234567:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk")).toBe(false);
    });

    it("rejects token with too-short string part (less than 35 chars)", () => {
      expect(isValidTokenFormat("12345678:ABCDEFshort")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidTokenFormat("")).toBe(false);
    });

    it("trims whitespace before validation", () => {
      const padded = `  ${VALID_TOKEN}  `;
      expect(isValidTokenFormat(padded)).toBe(true);
    });

    it("rejects token with special characters in string part", () => {
      expect(isValidTokenFormat("12345678:ABCDEF!@#$%^&*()QRSTUVWXYZ12345678")).toBe(false);
    });

    it("accepts token with underscores in string part", () => {
      expect(isValidTokenFormat("12345678:ABCDEFGHIJKLMNOPQRSTUVWXYZ_________")).toBe(true);
    });

    it("accepts token with hyphens in string part", () => {
      expect(isValidTokenFormat("12345678:ABCDEFGHIJKLMNOPQRSTUVWXYZ---------")).toBe(true);
    });

    it("accepts token with numbers in string part", () => {
      expect(isValidTokenFormat("12345678:ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789")).toBe(true);
    });

    it("rejects colon with no string part", () => {
      expect(isValidTokenFormat("12345678:")).toBe(false);
    });

    it("rejects string part with no colon", () => {
      expect(isValidTokenFormat("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk")).toBe(false);
    });
  });

  describe("validateToken", () => {
    function makeBotResponse(
      ok: boolean,
      result?: { id: number; username: string; first_name: string },
    ) {
      return {
        status: 200,
        ok: true,
        json: () => Promise.resolve({ ok, result }),
      };
    }

    it("returns bot info for valid token", async () => {
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 123456,
          username: "test_bot",
          first_name: "Test Bot",
        }),
      );

      const result = await validateToken(VALID_TOKEN);

      expect(result).toEqual({
        id: 123456,
        username: "test_bot",
        firstName: "Test Bot",
      });
    });

    it("returns null for invalid token format (skips API call)", async () => {
      const result = await validateToken("bad-token");

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        "Telegram token failed format check",
      );
    });

    it("returns null on non-ok HTTP response", async () => {
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
      });

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Telegram API returned 401"),
      );
    });

    it("returns null when data.ok is false", async () => {
      mockFetch.mockResolvedValue(makeBotResponse(false));

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
    });

    it("returns null when data.result is missing", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Telegram validation failed"),
      );
    });

    it("trims token before API call", async () => {
      const padded = `  ${VALID_TOKEN}  `;
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 1,
          username: "bot",
          first_name: "Bot",
        }),
      );

      await validateToken(padded);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${VALID_TOKEN}/getMe`,
        expect.any(Object),
      );
    });

    it("calls correct URL with token", async () => {
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 1,
          username: "bot",
          first_name: "Bot",
        }),
      );

      await validateToken(VALID_TOKEN);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${VALID_TOKEN}/getMe`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("maps first_name to firstName in result", async () => {
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 99,
          username: "my_bot",
          first_name: "My Cool Bot",
        }),
      );

      const result = await validateToken(VALID_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.firstName).toBe("My Cool Bot");
      expect((result as Record<string, unknown>)["first_name"]).toBeUndefined();
    });

    it("TelegramBotInfo has correct shape", async () => {
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 42,
          username: "shape_bot",
          first_name: "Shape",
        }),
      );

      const result = await validateToken(VALID_TOKEN);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("username");
      expect(result).toHaveProperty("firstName");
      expect(typeof result!.id).toBe("number");
      expect(typeof result!.username).toBe("string");
      expect(typeof result!.firstName).toBe("string");
    });
  });
});
