import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext, Channel } from "../../src/steps/context.js";

vi.mock("@clack/prompts", () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
  runInteractive: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  detectPlatform: vi.fn(),
  paths: vi.fn(),
  installHint: vi.fn(),
}));

vi.mock("../../src/lib/config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock("../../src/lib/telegram.js", () => ({
  isValidTokenFormat: vi.fn(),
  validateToken: vi.fn(),
}));

vi.mock("../../src/lib/models.js", () => ({
  MODEL_PROVIDERS: [],
  validateApiKey: vi.fn(),
}));

vi.mock("../../src/lib/templates.js", () => ({
  PRESETS: [],
  getPreset: vi.fn(),
  generateSoulMd: vi.fn(),
  generateUserMd: vi.fn(),
  generateHeartbeatMd: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

import { collectChannelInputs, configureChannel } from "../../src/steps/setup-channel.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { runShell } from "../../src/utils/exec.js";
import { validateToken } from "../../src/lib/telegram.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { createEmptyContext, createMockContext } from "../helpers/mock-factories.js";

describe("collectChannelInputs", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.spinner).mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    }) as any);
    vi.mocked(homedir).mockReturnValue("/mock/home");
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("shows channel selection when channel is telegram (default)", async () => {
    vi.mocked(p.select).mockResolvedValue("whatsapp");

    await collectChannelInputs(ctx);

    expect(p.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Which messaging channel?",
      }),
    );
  });

  it("sets channel from selection", async () => {
    vi.mocked(p.select).mockResolvedValue("discord");
    vi.mocked(p.text).mockResolvedValue("discord-token");

    await collectChannelInputs(ctx);

    expect(ctx.channel).toBe("discord");
  });

  it("handles cancel during channel selection", async () => {
    vi.mocked(p.select).mockResolvedValue(Symbol("cancel"));
    vi.mocked(p.isCancel).mockReturnValue(true);

    await expect(collectChannelInputs(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalledWith("Setup cancelled.");
  });

  it("telegram channel collects user ID and token", async () => {
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text)
      .mockResolvedValueOnce("123456789")
      .mockResolvedValueOnce("12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR");
    vi.mocked(validateToken).mockResolvedValue({
      id: 123, username: "test_bot", firstName: "Test",
    });

    await collectChannelInputs(ctx);

    expect(ctx.telegramUserId).toBe("123456789");
    expect(ctx.telegram).toEqual({
      token: "12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR",
      botUsername: "test_bot",
    });
  });

  it("discord channel collects token", async () => {
    vi.mocked(p.select).mockResolvedValue("discord");
    vi.mocked(p.text).mockResolvedValue("discord-bot-token");

    await collectChannelInputs(ctx);

    expect(ctx.discord).toEqual({ token: "discord-bot-token" });
  });

  it("mattermost collects URL and token", async () => {
    vi.mocked(p.select).mockResolvedValue("mattermost");
    vi.mocked(p.text)
      .mockResolvedValueOnce("https://mm.example.com")
      .mockResolvedValueOnce("mm-token-123");

    await collectChannelInputs(ctx);

    expect(ctx.mattermost).toEqual({
      url: "https://mm.example.com",
      token: "mm-token-123",
    });
  });

  it("whatsapp shows info message", async () => {
    ctx.channel = "whatsapp" as Channel;

    await collectChannelInputs(ctx);

    expect(p.select).not.toHaveBeenCalled();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("WhatsApp"),
    );
  });

  it("signal shows info message", async () => {
    ctx.channel = "signal" as Channel;

    await collectChannelInputs(ctx);

    expect(p.select).not.toHaveBeenCalled();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("Signal"),
    );
  });

  it("imessage shows info message", async () => {
    ctx.channel = "imessage" as Channel;

    await collectChannelInputs(ctx);

    expect(p.select).not.toHaveBeenCalled();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("iMessage"),
    );
  });

  it("googlechat shows info message", async () => {
    ctx.channel = "googlechat" as Channel;

    await collectChannelInputs(ctx);

    expect(p.select).not.toHaveBeenCalled();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("Google Chat"),
    );
  });

  it("webchat shows info message", async () => {
    ctx.channel = "webchat" as Channel;

    await collectChannelInputs(ctx);

    expect(p.select).not.toHaveBeenCalled();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("WebChat"),
    );
  });

  it("pre-configured channel skips selection", async () => {
    ctx.channel = "discord" as Channel;
    ctx.discord = { token: "pre-set" };

    await collectChannelInputs(ctx);

    expect(p.select).not.toHaveBeenCalled();
    expect(p.log.success).toHaveBeenCalledWith("Discord token pre-configured");
  });
});

describe("configureChannel", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    vi.mocked(p.spinner).mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    }) as any);
    vi.mocked(homedir).mockReturnValue("/mock/home");
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue("{}");
    vi.mocked(runShell).mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
  });

  it("configureChannel for telegram writes config", async () => {
    ctx.channel = "telegram";
    ctx.telegram = { token: "tok123", botUsername: "bot" };
    ctx.telegramUserId = "999";

    await configureChannel(ctx);

    expect(writeFileSync).toHaveBeenCalled();
  });

  it("configureChannel for discord writes config", async () => {
    ctx.channel = "discord";
    ctx.discord = { token: "disc-token" };

    await configureChannel(ctx);

    expect(writeFileSync).toHaveBeenCalled();
  });

  it("configureChannel for mattermost writes config", async () => {
    ctx.channel = "mattermost";
    ctx.mattermost = { url: "https://mm.test", token: "mm-tok" };

    await configureChannel(ctx);

    expect(writeFileSync).toHaveBeenCalled();
  });

  it("configureChannel for other channels is no-op", async () => {
    ctx.channel = "whatsapp";

    await configureChannel(ctx);

    expect(writeFileSync).not.toHaveBeenCalled();
    expect(runShell).not.toHaveBeenCalled();
  });
});
