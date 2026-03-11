import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext } from "../helpers/mock-factories.js";
import { successResult } from "../helpers/mock-exec.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn(), message: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => "{}"),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

vi.mock("../../src/lib/telegram.js", () => ({
  isValidTokenFormat: vi.fn(() => true),
  validateToken: vi.fn(),
}));

vi.mock("../../src/utils/exec.js", () => ({
  runShell: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { runShell } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { configureTelegram } from "../../src/steps/setup-telegram.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockRunShell = vi.mocked(runShell);
const mockSpinner = vi.mocked(p.spinner);
const mockLogger = vi.mocked(logger);

function getWrittenConfig(): Record<string, unknown> {
  const call = mockWriteFileSync.mock.calls.find(
    (c) => (c[0] as string).includes("openclaw.json"),
  );
  return call ? JSON.parse(call[1] as string) : {};
}

describe("configureTelegram – config writing details", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext({
      telegram: { token: "0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000", botUsername: "test_bot" },
      telegramUserId: "999888777",
    });
    mockExistsSync.mockReturnValue(false);
    mockRunShell.mockResolvedValue(successResult());
  });

  it("writeOpenClawTelegramConfig creates .openclaw dir", async () => {
    await configureTelegram(ctx);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(".openclaw"),
      { recursive: true },
    );
  });

  it("writeOpenClawTelegramConfig writes to openclaw.json", async () => {
    await configureTelegram(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/openclaw.json",
      expect.any(String),
      "utf-8",
    );
  });

  it("config includes enabled: true", async () => {
    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    expect(tg.enabled).toBe(true);
  });

  it("config includes botToken", async () => {
    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    expect(tg.botToken).toBe("0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000");
  });

  it("config includes dmPolicy: allowlist", async () => {
    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    expect(tg.dmPolicy).toBe("allowlist");
  });

  it("config includes allowFrom with user ID", async () => {
    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    expect(tg.allowFrom).toContain("999888777");
  });

  it("existing allowFrom is preserved", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      channels: {
        telegram: {
          allowFrom: ["111222333"],
        },
      },
    }));

    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    const allowFrom = tg.allowFrom as string[];
    expect(allowFrom).toContain("111222333");
    expect(allowFrom).toContain("999888777");
  });

  it("duplicate user ID not added", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      channels: {
        telegram: {
          allowFrom: ["999888777"],
        },
      },
    }));

    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    const allowFrom = tg.allowFrom as string[];
    const count = allowFrom.filter((id) => id === "999888777").length;
    expect(count).toBe(1);
  });

  it("existing config is merged, not overwritten", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      agents: { defaults: { model: "test/model" } },
      channels: { discord: { enabled: true } },
    }));

    await configureTelegram(ctx);

    const config = getWrittenConfig();
    expect(config.agents).toBeDefined();
    const channels = config.channels as Record<string, unknown>;
    expect(channels.discord).toBeDefined();
    expect(channels.telegram).toBeDefined();
  });

  it("invalid existing JSON is handled", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("{broken json");

    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    expect(channels.telegram).toBeDefined();
  });

  it("file write error shows warning", async () => {
    mockWriteFileSync.mockImplementation(() => { throw new Error("EPERM"); });

    await configureTelegram(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Failed"),
    );
  });

  it("error shows manual command", async () => {
    mockWriteFileSync.mockImplementation(() => { throw new Error("EPERM"); });

    await configureTelegram(ctx);

    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("openclaw config set"),
    );
  });

  it("spinner shows writing message", async () => {
    await configureTelegram(ctx);

    const calls = mockSpinner.mock.results;
    const spinnerInstances = calls.map((r) => r.value);
    const writeSpinner = spinnerInstances.find(
      (s) => s.start.mock.calls.some((c: string[]) => c[0]?.includes("Writing Telegram")),
    );
    expect(writeSpinner).toBeDefined();
  });

  it("logger records allowFrom list", async () => {
    await configureTelegram(ctx);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("allowFrom"),
    );
  });

  it("new user ID appended to existing list", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      channels: {
        telegram: {
          allowFrom: ["111", "222"],
        },
      },
    }));

    await configureTelegram(ctx);

    const config = getWrittenConfig();
    const channels = config.channels as Record<string, unknown>;
    const tg = channels.telegram as Record<string, unknown>;
    const allowFrom = tg.allowFrom as string[];
    expect(allowFrom).toEqual(["111", "222", "999888777"]);
  });

  it("config creates channels.telegram structure", async () => {
    mockExistsSync.mockReturnValue(false);

    await configureTelegram(ctx);

    const config = getWrittenConfig();
    expect(config.channels).toBeDefined();
    const channels = config.channels as Record<string, unknown>;
    expect(channels.telegram).toBeDefined();
    const tg = channels.telegram as Record<string, unknown>;
    expect(tg.enabled).toBe(true);
    expect(tg.botToken).toBeDefined();
    expect(tg.dmPolicy).toBe("allowlist");
    expect(tg.allowFrom).toBeDefined();
  });
});
