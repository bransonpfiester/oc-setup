import { describe, it, expect, vi } from "vitest";
import { join } from "node:path";

vi.mock("node:fs", () => ({
  appendFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

import { appendFileSync, mkdirSync } from "node:fs";
import { logger } from "../../src/utils/logger.js";

const mockedAppend = appendFileSync as unknown as ReturnType<typeof vi.fn>;
const mockedMkdir = mkdirSync as unknown as ReturnType<typeof vi.fn>;

const EXPECTED_LOG_FILE = join("/mock/home", ".openclaw", "logs", "oc-setup.log");

describe("redact edge cases – Anthropic key patterns", () => {
  it("partially masks a short Anthropic key (just past the prefix)", () => {
    const result = logger.redact("sk-ant-AB");
    expect(result).not.toBe("sk-ant-AB");
    expect(result).toContain("...");
  });

  it("does not match a bare sk-ant- prefix with no trailing chars", () => {
    const input = "prefix sk-ant- suffix";
    const result = logger.redact(input);
    expect(result).not.toContain("sk-ant-...");
  });

  it("masks a key at the very start of the message", () => {
    const result = logger.redact("sk-ant-ABCD1234_SECRETSECRETSECRET end");
    expect(result).not.toContain("SECRETSECRETSECRET");
    expect(result).toContain("...");
  });

  it("masks a key at the very end of the message", () => {
    const result = logger.redact("start sk-ant-ABCD1234_SECRETSECRETSECRET");
    expect(result).not.toContain("SECRETSECRETSECRET");
    expect(result).toContain("start");
  });

  it("masks a key surrounded by spaces", () => {
    const result = logger.redact("before sk-ant-XY123456_LONGSECRETHERE after");
    expect(result).not.toContain("LONGSECRETHERE");
    expect(result).toContain("before");
    expect(result).toContain("after");
  });

  it("handles a very long Anthropic key", () => {
    const longSuffix = "A".repeat(500);
    const input = `sk-ant-prefix12${longSuffix}`;
    const result = logger.redact(input);
    expect(result).not.toContain(longSuffix);
    expect(result).toContain("...");
    expect(result.length).toBeLessThan(input.length);
  });
});

describe("redact edge cases – OpenAI key patterns", () => {
  it("masks a standard OpenAI key without ant prefix", () => {
    const result = logger.redact("sk-abcdefghSECRETSECRETSECRET");
    expect(result).toBe("sk-abcdefgh...");
  });

  it("masks a key with exactly 9 chars after sk- (1 past capture group)", () => {
    const result = logger.redact("sk-12345678X");
    expect(result).toBe("sk-12345678...");
  });

  it("does not mask sk- alone without enough trailing chars", () => {
    const result = logger.redact("sk-");
    expect(result).toBe("sk-");
  });

  it("masks sk- with a single trailing char (capture group is 0, remainder is 1)", () => {
    const result = logger.redact("sk-A");
    expect(result).toBe("sk-...");
  });
});

describe("redact edge cases – Telegram token patterns", () => {
  it("masks a Telegram token with 5-digit bot ID", () => {
    const result = logger.redact("12345:ABCDefghXYZ123secret");
    expect(result).not.toContain("XYZ123secret");
    expect(result).toContain("12345:");
    expect(result).toContain("...");
  });

  it("masks a Telegram token with a very long bot ID", () => {
    const result = logger.redact("9876543210:ABCDefghXYZ123secret");
    expect(result).not.toContain("XYZ123secret");
    expect(result).toContain("9876543210:");
  });

  it("does not match a 4-digit number followed by colon (too short)", () => {
    const input = "1234:ABCDefghijklmnop";
    const result = logger.redact(input);
    expect(result).toBe(input);
  });

  it("masks a Telegram token followed by an API key", () => {
    const input = "token=12345:ABCDefghSECRET key=sk-proj1234abcdefghijklmnop";
    const result = logger.redact(input);
    expect(result).not.toContain("SECRET");
    expect(result).not.toContain("abcdefghijklmnop");
  });

  it("masks a minimum-length Telegram token (5 digits + colon + 2 chars)", () => {
    const result = logger.redact("10000:AB");
    expect(result).toBe("10000:A...");
  });
});

describe("redact edge cases – multiple key types", () => {
  it("masks both Anthropic and OpenAI keys in one message", () => {
    const input =
      "anthropic=sk-ant-prefix12_SECRETANTHROPIC openai=sk-proj5678secretopenai";
    const result = logger.redact(input);
    expect(result).not.toContain("SECRETANTHROPIC");
    expect(result).not.toContain("secretopenai");
  });

  it("masks all three key types in a single message", () => {
    const input = [
      "ant=sk-ant-abcd1234_SECRETANT",
      "oai=sk-openai12SECRETOAI",
      "tg=12345:tgtoken12SECRETTG",
    ].join(" ");
    const result = logger.redact(input);
    expect(result).not.toContain("SECRETANT");
    expect(result).not.toContain("SECRETOAI");
    expect(result).not.toContain("SECRETTG");
  });
});

describe("logger write edge cases", () => {
  it("handles a very long message without error", () => {
    const longMsg = "x".repeat(100_000);
    expect(() => logger.info(longMsg)).not.toThrow();
    expect(mockedAppend).toHaveBeenCalledWith(
      EXPECTED_LOG_FILE,
      expect.stringContaining(longMsg),
      "utf-8",
    );
  });

  it("handles a multiline message", () => {
    const multiline = "line1\nline2\nline3";
    logger.error(multiline);
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toContain("line1\nline2\nline3");
  });

  it("does not throw when appendFileSync throws", () => {
    mockedAppend.mockImplementation(() => {
      throw new Error("write failed");
    });
    expect(() => logger.warn("should not throw")).not.toThrow();
  });

  it("does not throw when mkdirSync throws", () => {
    mockedMkdir.mockImplementation(() => {
      throw new Error("mkdir failed");
    });
    expect(() => logger.debug("should not throw")).not.toThrow();
  });

  it("handles multiple rapid sequential log calls", () => {
    for (let i = 0; i < 50; i++) {
      logger.info(`message ${i}`);
    }
    expect(mockedAppend).toHaveBeenCalledTimes(50);
    expect(mockedMkdir).toHaveBeenCalledTimes(50);
  });
});

describe("redact purity and special inputs", () => {
  it("returns a new string without mutating the input", () => {
    const input = "sk-proj1234abcdefghijklmnop";
    const copy = input.slice();
    const result = logger.redact(input);
    expect(input).toBe(copy);
    expect(result).not.toBe(input);
  });

  it("returns the same string when no redaction is needed (no mutation)", () => {
    const input = "no secrets here";
    const result = logger.redact(input);
    expect(result).toBe(input);
  });

  it("handles empty string redaction", () => {
    const result = logger.redact("");
    expect(result).toBe("");
  });

  it("preserves unicode characters in log messages", () => {
    const unicode = "Error: ファイルが見つかりません 🚀 données";
    logger.info(unicode);
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toContain(unicode);
  });

  it("preserves unicode characters through redaction", () => {
    const input = "🔑 key=sk-proj1234abcdefghijklmnop 🔒";
    const result = logger.redact(input);
    expect(result).toContain("🔑");
    expect(result).toContain("🔒");
    expect(result).not.toContain("abcdefghijklmnop");
  });

  it("handles a message with only whitespace", () => {
    logger.info("   ");
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toContain("[INFO]    ");
  });
});
