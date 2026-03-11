import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { isValidTokenFormat, validateToken } from "../../src/lib/telegram.js";
import { logger } from "../../src/utils/logger.js";

describe("telegram validation details", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isValidTokenFormat boundary cases", () => {
    it("accepts exactly 8 digits in numeric part", () => {
      const token = "0000000000:TEST_TOKEN_FORMAT_CHECK_000000000000";
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("accepts 10 digits in numeric part", () => {
      const token = "0000000003:TEST_TOKEN_FORMAT_CHECK_000000000000";
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("accepts exactly 35 chars after colon", () => {
      const stringPart = "A".repeat(35);
      const token = `12345678:${stringPart}`;
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("accepts 50 chars after colon", () => {
      const stringPart = "A".repeat(50);
      const token = `12345678:${stringPart}`;
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("accepts underscores in string part", () => {
      const stringPart = "ABCDEFGHIJ_KLMNOPQRS_TUVWXYZ_abcdefgh";
      expect(isValidTokenFormat(`12345678:${stringPart}`)).toBe(true);
    });

    it("accepts hyphens in string part", () => {
      const stringPart = "ABCDEFGHIJ-KLMNOPQRS-TUVWXYZ-abcdefgh";
      expect(isValidTokenFormat(`12345678:${stringPart}`)).toBe(true);
    });

    it("rejects 7 digits in numeric part", () => {
      const token = "1234567:TEST_TOKEN_FORMAT_CHECK_000000000000";
      expect(isValidTokenFormat(token)).toBe(false);
    });

    it("rejects 34 chars after colon", () => {
      const stringPart = "A".repeat(34);
      const token = `12345678:${stringPart}`;
      expect(isValidTokenFormat(token)).toBe(false);
    });

    it("rejects colon but no string part after it", () => {
      expect(isValidTokenFormat("12345678:")).toBe(false);
    });

    it("rejects string part but no colon", () => {
      expect(isValidTokenFormat("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk")).toBe(
        false,
      );
    });

    it("accepts numbers mixed in string part", () => {
      const token = "0000000000:TEST_TOKEN_MIXED_CHARS_000000000000";
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("rejects letters in numeric part", () => {
      expect(
        isValidTokenFormat(
          "1234abcd:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk",
        ),
      ).toBe(false);
    });

    it("rejects dots in string part", () => {
      expect(
        isValidTokenFormat(
          "12345678:ABCDEFGHIJKLMNOPQRSTUVWXYZ..........",
        ),
      ).toBe(false);
    });

    it("rejects spaces in token", () => {
      expect(
        isValidTokenFormat(
          "12345678:ABCDEFGHIJKLMNOPQR STUVWXYZ abcdefg",
        ),
      ).toBe(false);
    });
  });

  describe("validateToken additional scenarios", () => {
    const VALID_TOKEN =
      "0000000000:TEST_TOKEN_FORMAT_CHECK_000000000000";

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

    it("returns null with leading/trailing whitespace on invalid token", async () => {
      const result = await validateToken("  short  ");

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns null on timeout error", async () => {
      mockFetch.mockRejectedValue(
        new DOMException("Signal timed out", "AbortError"),
      );

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it("returns null when response json() throws", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it("returns null with empty result object", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ ok: true, result: undefined }),
      });

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
    });

    it("handles multiple valid tokens independently", async () => {
      const token2 = "0000000099:TEST_TOKEN_CONCURRENT_000000000000000";
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 1,
          username: "bot1",
          first_name: "Bot One",
        }),
      );

      const r1 = await validateToken(VALID_TOKEN);
      expect(r1).not.toBeNull();

      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 2,
          username: "bot2",
          first_name: "Bot Two",
        }),
      );

      const r2 = await validateToken(token2);
      expect(r2).not.toBeNull();
      expect(r2!.username).toBe("bot2");
    });

    it("returns null on 403 response", async () => {
      mockFetch.mockResolvedValue({
        status: 403,
        ok: false,
      });

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("403"),
      );
    });

    it("returns null on 500 response", async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        ok: false,
      });

      const result = await validateToken(VALID_TOKEN);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("500"),
      );
    });

    it("sends request with timeout signal", async () => {
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 1,
          username: "bot",
          first_name: "Bot",
        }),
      );

      await validateToken(VALID_TOKEN);

      const call = mockFetch.mock.calls[0];
      expect(call[1]).toHaveProperty("signal");
      expect(call[1].signal).toBeInstanceOf(AbortSignal);
    });

    it("does not call fetch when format check fails", async () => {
      await validateToken("invalid");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("result id is a number from the API response", async () => {
      mockFetch.mockResolvedValue(
        makeBotResponse(true, {
          id: 987654321,
          username: "num_bot",
          first_name: "Num",
        }),
      );

      const result = await validateToken(VALID_TOKEN);

      expect(result!.id).toBe(987654321);
      expect(typeof result!.id).toBe("number");
    });
  });
});
