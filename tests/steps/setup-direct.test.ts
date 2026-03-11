import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext, createEmptyContext } from "../helpers/mock-factories.js";
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

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
  runInteractive: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { runShell, runInteractive } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { setupDirect } from "../../src/steps/setup-direct.js";

const mockRunShell = vi.mocked(runShell);
const mockRunInteractive = vi.mocked(runInteractive);
const mockExistsSync = vi.mocked(existsSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockLogger = vi.mocked(logger);
const mockSpinner = vi.mocked(p.spinner);

describe("setupDirect", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    mockRunShell.mockResolvedValue(successResult());
    mockRunInteractive.mockResolvedValue(0);
    mockExistsSync.mockReturnValue(false);
  });

  it("writes openclaw.json", async () => {
    await setupDirect(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    expect(writeCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("writes auth-profiles.json to both paths", async () => {
    await setupDirect(ctx);

    const authCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(authCalls.length).toBe(2);
  });

  it("creates workspace directory", async () => {
    await setupDirect(ctx);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("workspace"),
      { recursive: true },
    );
  });

  it("installs gateway service", async () => {
    await setupDirect(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw gateway install 2>&1",
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it("starts gateway", async () => {
    await setupDirect(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw gateway start 2>&1",
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it("falls back to interactive gateway on start failure", async () => {
    mockRunShell
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(failureResult("start failed", 1));

    await setupDirect(ctx);

    expect(mockRunInteractive).toHaveBeenCalledWith("openclaw", ["gateway"]);
  });

  it("config includes agents.defaults", async () => {
    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.agents).toBeDefined();
    expect(content.agents.defaults).toBeDefined();
    expect(content.agents.defaults.workspace).toBeDefined();
    expect(content.agents.defaults.model).toBeDefined();
  });

  it("config includes tools.profile", async () => {
    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.tools.profile).toBe("messaging");
  });

  it("config includes session.dmScope", async () => {
    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.session.dmScope).toBe("per-channel-peer");
  });

  it("config includes gateway settings", async () => {
    ctx.gatewayPort = 19000;

    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.gateway).toBeDefined();
    expect(content.gateway.port).toBe(19000);
    expect(content.gateway.mode).toBe("local");
    expect(content.gateway.bind).toBe("loopback");
  });

  it("config includes telegram when configured", async () => {
    ctx.telegram = { token: "123456:AABBccDD", botUsername: "my_bot" };
    ctx.telegramUserId = "999";

    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.channels).toBeDefined();
    expect(content.channels.telegram).toBeDefined();
    expect(content.channels.telegram.enabled).toBe(true);
    expect(content.channels.telegram.botToken).toBe("123456:AABBccDD");
  });

  it("config omits telegram when not configured", async () => {
    ctx.telegram = null;

    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.channels).toBeUndefined();
  });

  it("auth includes provider and key", async () => {
    ctx.model = {
      provider: "openai",
      apiKey: "sk-test-key",
      modelId: "gpt-4o",
      authMethod: "api-key",
    };

    await setupDirect(ctx);

    const authCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(authCalls.length).toBeGreaterThan(0);
    const content = JSON.parse(authCalls[0]![1] as string);
    expect(content.profiles["openai:default"].provider).toBe("openai");
    expect(content.profiles["openai:default"].key).toBe("sk-test-key");
  });

  it("generateToken returns 48-char hex string", async () => {
    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    const token = content.gateway.auth.token;
    expect(token).toHaveLength(48);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it("getProviderName maps google correctly", async () => {
    ctx.model = {
      provider: "google",
      apiKey: "google-key",
      modelId: "gemini-2.5-pro",
      authMethod: "api-key",
    };

    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const content = JSON.parse(configCall![1] as string);
    expect(content.agents.defaults.model).toContain("google-generative-ai");
  });

  it("spinner messages are shown", async () => {
    await setupDirect(ctx);

    const spinnerInstance = mockSpinner.mock.results[0]!.value;
    expect(spinnerInstance.start).toHaveBeenCalledWith("Writing OpenClaw configuration...");
  });
});
