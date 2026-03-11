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
import { run, runShell, runInteractive } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { setupGateway } from "../../src/steps/setup-gateway.js";

const mockRun = vi.mocked(run);
const mockRunShell = vi.mocked(runShell);
const mockRunInteractive = vi.mocked(runInteractive);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockLogger = vi.mocked(logger);

describe("setupGateway", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();

    mockRunShell.mockResolvedValue(successResult());
    mockRunInteractive.mockResolvedValue(0);
    mockRun.mockResolvedValue(successResult("running"));
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockReturnValue("{}");

    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("calls runDoctorFix", async () => {
    await setupGateway(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw doctor --fix 2>&1",
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it("calls runOnboard with context", async () => {
    await setupGateway(ctx);

    expect(mockRunInteractive).toHaveBeenCalledWith(
      "openclaw",
      expect.arrayContaining(["onboard"]),
    );
  });

  it("calls writeAuthProfile", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };
    mockExistsSync.mockReturnValue(false);

    await setupGateway(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("auth-profiles.json"),
      expect.any(String),
      "utf-8",
    );
  });

  it("calls writeDefaultModel", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };

    await setupGateway(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("openclaw.json"),
      expect.stringContaining("agents"),
      "utf-8",
    );
  });

  it("calls installGatewayService", async () => {
    mockRunShell.mockResolvedValueOnce(successResult());
    mockRunShell.mockResolvedValueOnce(successResult("not installed"));
    mockRunShell.mockResolvedValueOnce(successResult());

    await setupGateway(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      expect.stringContaining("gateway"),
      expect.anything(),
    );
  });

  it("calls startGateway", async () => {
    mockRun.mockResolvedValueOnce(successResult("not running"));

    await setupGateway(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      expect.stringContaining("gateway start"),
      expect.anything(),
    );
  });

  it("runOnboard runs openclaw onboard", async () => {
    await setupGateway(ctx);

    expect(mockRunInteractive).toHaveBeenCalledWith(
      "openclaw",
      expect.arrayContaining(["onboard", "--mode", "local"]),
    );
  });

  it("runOnboard handles exit code 0", async () => {
    mockRunInteractive.mockResolvedValueOnce(0);

    await setupGateway(ctx);

    expect(p.log.success).toHaveBeenCalledWith("OpenClaw onboarding complete");
    expect(mockLogger.info).toHaveBeenCalledWith("openclaw onboard succeeded");
  });

  it("runOnboard handles non-zero exit code", async () => {
    mockRunInteractive.mockResolvedValueOnce(1);

    await setupGateway(ctx);

    expect(p.log.warn).toHaveBeenCalledWith("Onboarding had issues.");
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("onboard exit 1"));
  });

  it("writeAuthProfile writes to auth-profiles.json", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-profile-key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };

    await setupGateway(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(writeCalls.length).toBeGreaterThanOrEqual(1);

    const content = JSON.parse(writeCalls[0]![1] as string);
    expect(content.profiles).toBeDefined();
    expect(content.profiles["anthropic:default"]).toBeDefined();
  });

  it("writeAuthProfile skips when no model", async () => {
    ctx.model = null;

    await setupGateway(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(writeCalls.length).toBe(0);
  });

  it("writeAuthProfile skips when no apiKey", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "",
      modelId: "claude-sonnet-4-6",
      authMethod: "oauth",
    };

    await setupGateway(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(writeCalls.length).toBe(0);
  });

  it("writeAuthProfile skips for non-api-key auth", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "some-token",
      modelId: "claude-sonnet-4-6",
      authMethod: "setup-token",
    };

    await setupGateway(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(writeCalls.length).toBe(0);
  });

  it("writeDefaultModel writes model reference", async () => {
    ctx.model = {
      provider: "openai",
      apiKey: "sk-test",
      modelId: "gpt-4o",
      authMethod: "api-key",
    };

    await setupGateway(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    expect(writeCalls.length).toBeGreaterThanOrEqual(1);

    const content = JSON.parse(writeCalls[0]![1] as string);
    expect(content.agents.defaults.model).toBe("openai/gpt-4o");
  });

  it("writeDefaultModel skips when no model", async () => {
    ctx.model = null;

    await setupGateway(ctx);

    const writeCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    expect(writeCalls.length).toBe(0);
  });

  it("startGateway skips when already running", async () => {
    mockRun.mockResolvedValueOnce(successResult("running"));

    await setupGateway(ctx);

    expect(p.log.success).toHaveBeenCalledWith("Gateway is running");
  });
});
