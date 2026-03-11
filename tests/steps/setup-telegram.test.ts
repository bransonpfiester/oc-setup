import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createEmptyContext, createMockContext } from "../helpers/mock-factories.js";
import { mockProcessExit } from "../helpers/test-utils.js";
import { successResult, failureResult } from "../helpers/mock-exec.js";

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
import { validateToken } from "../../src/lib/telegram.js";
import { runShell } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { collectTelegramInputs, configureTelegram } from "../../src/steps/setup-telegram.js";

const mockText = vi.mocked(p.text);
const mockIsCancel = vi.mocked(p.isCancel);
const mockValidateToken = vi.mocked(validateToken);
const mockRunShell = vi.mocked(runShell);
const mockSpinner = vi.mocked(p.spinner);
const mockLogger = vi.mocked(logger);

describe("collectTelegramInputs", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockIsCancel.mockReturnValue(false);
    mockRunShell.mockResolvedValue(successResult());
  });

  it("calls collectUserId then collectBotToken", async () => {
    mockText.mockResolvedValueOnce("999888777");
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 123, username: "my_bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(ctx.telegramUserId).toBe("999888777");
    expect(ctx.telegram).toBeDefined();
    expect(ctx.telegram!.botUsername).toBe("my_bot");
  });

  it("collectUserId asks for user ID when empty", async () => {
    mockText.mockResolvedValueOnce("111222333");
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 123, username: "bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: "123456789",
      }),
    );
  });

  it("collectUserId skips when pre-configured", async () => {
    ctx.telegramUserId = "555666777";
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 123, username: "bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(p.log.success).toHaveBeenCalledWith(
      expect.stringContaining("555666777"),
    );
    expect(ctx.telegramUserId).toBe("555666777");
  });

  it("collectUserId validates numeric input", async () => {
    mockText.mockResolvedValueOnce("123456");
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 123, username: "bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    const textCall = mockText.mock.calls[0]![0] as { validate: (v: string) => string | undefined };
    expect(textCall.validate("")).toBeDefined();
    expect(textCall.validate("abc")).toBeDefined();
    expect(textCall.validate("123456789")).toBeUndefined();
  });

  it("collectUserId handles cancel", async () => {
    mockProcessExit();
    mockText.mockResolvedValueOnce(Symbol("cancel") as unknown as string);
    mockIsCancel.mockReturnValueOnce(true);

    await expect(collectTelegramInputs(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalled();
  });

  it("collectBotToken validates pre-configured token", async () => {
    ctx.telegramUserId = "111";
    ctx.telegram = { token: "12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR", botUsername: "" };
    mockValidateToken.mockResolvedValueOnce({ id: 1, username: "valid_bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(ctx.telegram!.botUsername).toBe("valid_bot");
  });

  it("collectBotToken clears invalid pre-configured token", async () => {
    ctx.telegramUserId = "111";
    ctx.telegram = { token: "bad-token", botUsername: "" };
    mockValidateToken.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 1, username: "new_bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("didn't validate"),
    );
    expect(ctx.telegram!.botUsername).toBe("new_bot");
  });

  it("collectBotToken shows BotFather instructions", async () => {
    ctx.telegramUserId = "111";
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 1, username: "bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("BotFather"),
      "Telegram Setup",
    );
  });

  it("collectBotToken retries up to 3 times", async () => {
    ctx.telegramUserId = "111";
    mockText.mockResolvedValueOnce("bad1");
    mockValidateToken.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("bad2");
    mockValidateToken.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 1, username: "bot", firstName: "Bot" });

    await collectTelegramInputs(ctx);

    expect(ctx.telegram!.botUsername).toBe("bot");
    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not validate"),
    );
  });

  it("collectBotToken fails after 3 attempts", async () => {
    mockProcessExit();
    ctx.telegramUserId = "111";
    mockText.mockResolvedValueOnce("bad1");
    mockValidateToken.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("bad2");
    mockValidateToken.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("bad3");
    mockValidateToken.mockResolvedValueOnce(null);

    await expect(collectTelegramInputs(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("3 attempts"),
    );
  });

  it("collectBotToken sets telegram on context", async () => {
    ctx.telegramUserId = "111";
    mockText.mockResolvedValueOnce("99887766:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    mockValidateToken.mockResolvedValueOnce({ id: 99, username: "test_bot", firstName: "Test" });

    await collectTelegramInputs(ctx);

    expect(ctx.telegram).toEqual({
      token: "99887766:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR",
      botUsername: "test_bot",
    });
  });
});

describe("configureTelegram", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    mockRunShell.mockResolvedValue(successResult());
  });

  it("writes config", async () => {
    const { writeFileSync } = await import("node:fs");

    await configureTelegram(ctx);

    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(
      expect.stringContaining("openclaw.json"),
      expect.any(String),
      "utf-8",
    );
  });

  it("restarts gateway", async () => {
    mockRunShell.mockResolvedValueOnce(successResult());

    await configureTelegram(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw gateway restart 2>&1",
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it("handles restart failure", async () => {
    mockRunShell.mockResolvedValueOnce(failureResult("restart failed"));
    mockRunShell.mockResolvedValueOnce(successResult());
    mockRunShell.mockResolvedValueOnce(successResult());

    await configureTelegram(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw gateway stop 2>&1",
      expect.anything(),
    );
  });

  it("tries launchctl fallback", async () => {
    mockRunShell.mockResolvedValueOnce(failureResult("restart failed"));
    mockRunShell.mockResolvedValueOnce(successResult());
    mockRunShell.mockResolvedValueOnce(failureResult("start failed"));
    mockRunShell.mockResolvedValueOnce(successResult());

    await configureTelegram(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      expect.stringContaining("launchctl kickstart"),
      expect.anything(),
    );
  });

  it("skips when not configured", async () => {
    ctx.telegram = null;
    ctx.telegramUserId = "";

    await configureTelegram(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("not fully configured"),
    );
    expect(mockRunShell).not.toHaveBeenCalled();
  });
});
