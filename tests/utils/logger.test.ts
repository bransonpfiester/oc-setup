import { describe, it, expect, vi, beforeEach } from "vitest";
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

const EXPECTED_LOG_DIR = join("/mock/home", ".openclaw", "logs");
const EXPECTED_LOG_FILE = join(EXPECTED_LOG_DIR, "oc-setup.log");

describe("logger levels", () => {
  it("logger.info writes with INFO level tag", () => {
    logger.info("information message");
    expect(mockedAppend).toHaveBeenCalledWith(
      EXPECTED_LOG_FILE,
      expect.stringContaining("[INFO] information message"),
      "utf-8",
    );
  });

  it("logger.warn writes with WARN level tag", () => {
    logger.warn("warning message");
    expect(mockedAppend).toHaveBeenCalledWith(
      EXPECTED_LOG_FILE,
      expect.stringContaining("[WARN] warning message"),
      "utf-8",
    );
  });

  it("logger.error writes with ERROR level tag", () => {
    logger.error("error message");
    expect(mockedAppend).toHaveBeenCalledWith(
      EXPECTED_LOG_FILE,
      expect.stringContaining("[ERROR] error message"),
      "utf-8",
    );
  });

  it("logger.debug writes with DEBUG level tag", () => {
    logger.debug("debug message");
    expect(mockedAppend).toHaveBeenCalledWith(
      EXPECTED_LOG_FILE,
      expect.stringContaining("[DEBUG] debug message"),
      "utf-8",
    );
  });
});

describe("redact()", () => {
  it("masks Anthropic API keys (sk-ant-...)", () => {
    const input = "key: sk-ant-api03key_SECRETSECRETSECRETSECRET";
    const result = logger.redact(input);
    expect(result).not.toContain("SECRETSECRETSECRETSECRET");
    expect(result).toContain("...");
  });

  it("masks OpenAI API keys (sk-...)", () => {
    const result = logger.redact("key: sk-proj1234abcdefghijklmnopqrst");
    expect(result).toBe("key: sk-proj1234...");
    expect(result).not.toContain("abcdefghijklmnopqrst");
  });

  it("masks Telegram bot tokens (digits:alphanum)", () => {
    const result = logger.redact("token: 123456:ABCDefghIJKLmnopQRSTuvwx");
    expect(result).not.toContain("IJKLmnopQRSTuvwx");
    expect(result).toContain("123456:");
    expect(result).toContain("...");
  });

  it("does not mask normal text without key patterns", () => {
    const input = "This is a normal log message with no secrets";
    const result = logger.redact(input);
    expect(result).toBe(input);
  });

  it("masks multiple keys in a single message", () => {
    const input =
      "keys: sk-proj1234secretkey1 and sk-anotherabcsecretkey2";
    const result = logger.redact(input);
    expect(result).not.toContain("secretkey1");
    expect(result).not.toContain("secretkey2");
    expect(result.match(/\.\.\./g)!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("log format", () => {
  it("includes an ISO 8601 timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T10:30:00.000Z"));

    logger.info("timestamp check");

    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toContain("[2025-06-15T10:30:00.000Z]");

    vi.useRealTimers();
  });

  it("formats the line as [timestamp] [LEVEL] message\\n", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    logger.warn("formatted");

    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toBe("[2025-01-01T00:00:00.000Z] [WARN] formatted\n");

    vi.useRealTimers();
  });

  it("appends a newline at the end of each log line", () => {
    logger.info("newline test");
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written.endsWith("\n")).toBe(true);
  });
});

describe("ensureLogDir", () => {
  it("creates the log directory recursively on each write", () => {
    logger.info("dir check");
    expect(mockedMkdir).toHaveBeenCalledWith(EXPECTED_LOG_DIR, {
      recursive: true,
    });
  });

  it("calls mkdirSync before appendFileSync", () => {
    logger.info("order check");
    const mkdirOrder = mockedMkdir.mock.invocationCallOrder[0];
    const appendOrder = mockedAppend.mock.invocationCallOrder[0];
    expect(mkdirOrder).toBeLessThan(appendOrder!);
  });
});

describe("error handling", () => {
  it("silently catches appendFileSync errors", () => {
    mockedAppend.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device");
    });
    expect(() => logger.error("disk full")).not.toThrow();
  });

  it("silently catches mkdirSync errors", () => {
    mockedMkdir.mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });
    expect(() => logger.info("no perms")).not.toThrow();
  });

  it("does not call appendFileSync when mkdirSync throws", () => {
    mockedMkdir.mockImplementation(() => {
      throw new Error("EACCES");
    });
    logger.info("skipped");
    expect(mockedAppend).not.toHaveBeenCalled();
  });
});

describe("logger.redact export", () => {
  it("is publicly accessible as a function", () => {
    expect(typeof logger.redact).toBe("function");
  });

  it("is the same function used internally for log redaction", () => {
    const secret = "sk-proj1234abcdefghijklmnop";
    logger.info(`using ${secret}`);
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    const expected = logger.redact(`using ${secret}`);
    expect(written).toContain(expected);
  });
});

describe("log file path", () => {
  it("writes to the correct log file path under homedir", () => {
    logger.info("path check");
    expect(mockedAppend).toHaveBeenCalledWith(
      EXPECTED_LOG_FILE,
      expect.any(String),
      "utf-8",
    );
  });

  it("creates the correct log directory under homedir", () => {
    logger.info("dir path check");
    expect(mockedMkdir).toHaveBeenCalledWith(EXPECTED_LOG_DIR, {
      recursive: true,
    });
  });
});

describe("message edge cases", () => {
  it("handles an empty message", () => {
    logger.info("");
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toMatch(/\[INFO\] \n$/);
  });

  it("handles special characters in messages", () => {
    const special = "Error: file not found (path=/tmp/a b c) [code=404]";
    logger.error(special);
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).toContain(special);
  });

  it("redacts keys embedded in log messages", () => {
    logger.info("Connected with sk-proj1234abcdefghijklmnop");
    const written = mockedAppend.mock.calls[0]?.[1] as string;
    expect(written).not.toContain("abcdefghijklmnop");
    expect(written).toContain("sk-proj1234...");
  });
});
