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
import { runShell } from "../../src/utils/exec.js";
import { validateToken, isValidTokenFormat } from "../../src/lib/telegram.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { createEmptyContext, createMockContext } from "../helpers/mock-factories.js";

describe("collectChannelInputs — telegram details", () => {
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

  it("collectTelegramInputs asks for user ID when empty", async () => {
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text)
      .mockResolvedValueOnce("123456789")
      .mockResolvedValueOnce("0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000");
    vi.mocked(validateToken).mockResolvedValue({
      id: 123, username: "bot", firstName: "Bot",
    });

    await collectChannelInputs(ctx);

    expect(p.text).toHaveBeenCalledWith(
      expect.objectContaining({ placeholder: "123456789" }),
    );
  });

  it("collectTelegramInputs skips user ID when pre-configured", async () => {
    ctx.telegramUserId = "987654321";
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text).mockResolvedValue("0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000");
    vi.mocked(validateToken).mockResolvedValue({
      id: 123, username: "bot", firstName: "Bot",
    });

    await collectChannelInputs(ctx);

    expect(p.log.success).toHaveBeenCalledWith("Telegram user ID: 987654321");
  });

  it("collectTelegramInputs validates token format via p.text validate callback", async () => {
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text)
      .mockResolvedValueOnce("123456789")
      .mockResolvedValueOnce("0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000");
    vi.mocked(validateToken).mockResolvedValue({
      id: 123, username: "bot", firstName: "Bot",
    });

    await collectChannelInputs(ctx);

    const tokenCall = vi.mocked(p.text).mock.calls.find(
      (c) => c[0].placeholder === "7891234567:AAH...",
    );
    expect(tokenCall).toBeDefined();
    expect(tokenCall![0].validate).toBeTypeOf("function");
  });

  it("collectTelegramInputs retries on invalid token (up to 3)", async () => {
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text)
      .mockResolvedValueOnce("123456789")
      .mockResolvedValueOnce("token1")
      .mockResolvedValueOnce("token2")
      .mockResolvedValueOnce("token3");
    vi.mocked(validateToken).mockResolvedValue(null);

    await expect(collectChannelInputs(ctx)).rejects.toThrow("process.exit");

    expect(validateToken).toHaveBeenCalledTimes(3);
  });

  it("collectTelegramInputs fails after 3 attempts", async () => {
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text)
      .mockResolvedValueOnce("123456789")
      .mockResolvedValueOnce("bad1")
      .mockResolvedValueOnce("bad2")
      .mockResolvedValueOnce("bad3");
    vi.mocked(validateToken).mockResolvedValue(null);

    await expect(collectChannelInputs(ctx)).rejects.toThrow("process.exit");

    expect(p.log.error).toHaveBeenCalledWith("Failed after 3 attempts.");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("collectTelegramInputs validates pre-configured token", async () => {
    ctx.telegramUserId = "111";
    ctx.telegram = { token: "0000000000:TEST_PRECONFIGURED_TOKEN_000000000", botUsername: "" };
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(validateToken).mockResolvedValue({
      id: 1, username: "valid_bot", firstName: "Valid",
    });

    await collectChannelInputs(ctx);

    expect(validateToken).toHaveBeenCalledWith(
      "0000000000:TEST_PRECONFIGURED_TOKEN_000000000",
    );
    expect(ctx.telegram!.botUsername).toBe("valid_bot");
  });

  it("collectTelegramInputs clears invalid pre-configured token", async () => {
    ctx.telegramUserId = "111";
    ctx.telegram = { token: "invalid-old-token", botUsername: "old" };
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(validateToken)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2, username: "new_bot", firstName: "New" });
    vi.mocked(p.text).mockResolvedValue("0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000");

    await collectChannelInputs(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      "Pre-configured token didn't validate.",
    );
  });
});

describe("collectChannelInputs — discord and mattermost", () => {
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

  it("collectDiscordInputs skips when pre-configured", async () => {
    ctx.channel = "discord" as Channel;
    ctx.discord = { token: "existing" };

    await collectChannelInputs(ctx);

    expect(p.log.success).toHaveBeenCalledWith("Discord token pre-configured");
    expect(p.text).not.toHaveBeenCalled();
  });

  it("collectDiscordInputs asks for token", async () => {
    ctx.channel = "discord" as Channel;
    vi.mocked(p.text).mockResolvedValue("new-disc-token");

    await collectChannelInputs(ctx);

    expect(p.text).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Paste your Discord bot token:",
      }),
    );
    expect(ctx.discord).toEqual({ token: "new-disc-token" });
  });

  it("collectMattermostInputs asks for URL and token", async () => {
    ctx.channel = "mattermost" as Channel;
    vi.mocked(p.text)
      .mockResolvedValueOnce("https://mm.corp.com")
      .mockResolvedValueOnce("mm-secret");

    await collectChannelInputs(ctx);

    expect(ctx.mattermost).toEqual({
      url: "https://mm.corp.com",
      token: "mm-secret",
    });
  });

  it("collectMattermostInputs skips when pre-configured", async () => {
    ctx.channel = "mattermost" as Channel;
    ctx.mattermost = { url: "https://pre.mm", token: "pre-tok" };

    await collectChannelInputs(ctx);

    expect(p.log.success).toHaveBeenCalledWith("Mattermost pre-configured");
    expect(p.text).not.toHaveBeenCalled();
  });
});

describe("configureChannel — write and restart", () => {
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

  it("configureTelegram writes config file with channel data", async () => {
    ctx.channel = "telegram";
    ctx.telegram = { token: "12345678:tok", botUsername: "mybot" };
    ctx.telegramUserId = "999888";

    await configureChannel(ctx);

    expect(writeFileSync).toHaveBeenCalled();
    const written = vi.mocked(writeFileSync).mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed.channels.telegram.botToken).toBe("12345678:tok");
    expect(parsed.channels.telegram.enabled).toBe(true);
  });

  it("configureTelegram restarts gateway", async () => {
    ctx.channel = "telegram";
    ctx.telegram = { token: "tok", botUsername: "bot" };
    ctx.telegramUserId = "111";

    await configureChannel(ctx);

    expect(runShell).toHaveBeenCalledWith(
      expect.stringContaining("openclaw gateway restart"),
      expect.any(Object),
    );
  });

  it("configureDiscord writes to config", async () => {
    ctx.channel = "discord";
    ctx.discord = { token: "disc-secret" };

    await configureChannel(ctx);

    expect(writeFileSync).toHaveBeenCalled();
    const written = vi.mocked(writeFileSync).mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed.channels.discord.token).toBe("disc-secret");
    expect(parsed.channels.discord.enabled).toBe(true);
  });

  it("configureMattermost writes to config", async () => {
    ctx.channel = "mattermost";
    ctx.mattermost = { url: "https://mm.test.io", token: "mm-tok" };

    await configureChannel(ctx);

    expect(writeFileSync).toHaveBeenCalled();
    const written = vi.mocked(writeFileSync).mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed.channels.mattermost.baseUrl).toBe("https://mm.test.io");
    expect(parsed.channels.mattermost.botToken).toBe("mm-tok");
    expect(parsed.channels.mattermost.enabled).toBe(true);
  });

  it("hyperlink function creates proper ANSI escape sequence in user ID prompt", async () => {
    ctx = createEmptyContext();
    vi.mocked(p.select).mockResolvedValue("telegram");
    vi.mocked(p.text)
      .mockResolvedValueOnce("123")
      .mockResolvedValueOnce("0000000000:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_0000");
    vi.mocked(validateToken).mockResolvedValue({
      id: 1, username: "bot", firstName: "Bot",
    });
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);

    await collectChannelInputs(ctx);

    const textCalls = vi.mocked(p.text).mock.calls;
    const userIdCall = textCalls.find((c) => c[0].placeholder === "123456789");
    expect(userIdCall).toBeDefined();
    expect(userIdCall![0].message).toContain("\x1b]8;;");
  });
});
