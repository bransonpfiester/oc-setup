import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createEmptyContext } from "../helpers/mock-factories.js";
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

vi.mock("picocolors", () => ({
  default: {
    bold: vi.fn((s: string) => s),
    cyan: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    red: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
  },
}));

vi.mock("../../src/steps/context.js", () => ({
  createContext: vi.fn(),
}));

vi.mock("../../src/steps/detect-os.js", () => ({
  detectOS: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/install-node.js", () => ({
  checkNode: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/install-openclaw.js", () => ({
  installOpenClaw: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/setup-channel.js", () => ({
  collectChannelInputs: vi.fn().mockResolvedValue(undefined),
  configureChannel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/setup-model.js", () => ({
  setupModel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/setup-personality.js", () => ({
  setupPersonality: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/setup-gateway.js", () => ({
  setupGateway: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/setup-direct.js", () => ({
  setupDirect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/setup-service.js", () => ({
  setupService: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/steps/verify.js", () => ({
  verify: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/templates.js", () => ({
  getPreset: vi.fn(),
}));

vi.mock("../../src/lib/models.js", () => ({
  MODEL_PROVIDERS: [
    { provider: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-4-5-20250514", hint: "~$20/mo" },
    { provider: "openai", label: "OpenAI", defaultModel: "gpt-4o", hint: "~$20/mo" },
    { provider: "openrouter", label: "OpenRouter", defaultModel: "anthropic/claude-sonnet-4-5-20250514", hint: "pay-per-use" },
  ],
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { createContext } from "../../src/steps/context.js";
import { detectOS } from "../../src/steps/detect-os.js";
import { checkNode } from "../../src/steps/install-node.js";
import { installOpenClaw } from "../../src/steps/install-openclaw.js";
import { collectChannelInputs, configureChannel } from "../../src/steps/setup-channel.js";
import { setupModel } from "../../src/steps/setup-model.js";
import { setupPersonality } from "../../src/steps/setup-personality.js";
import { setupGateway } from "../../src/steps/setup-gateway.js";
import { setupDirect } from "../../src/steps/setup-direct.js";
import { setupService } from "../../src/steps/setup-service.js";
import { verify } from "../../src/steps/verify.js";
import { getPreset } from "../../src/lib/templates.js";
import { logger } from "../../src/utils/logger.js";
import { initCommand } from "../../src/commands/init.js";

const mockCreateContext = vi.mocked(createContext);
const mockDetectOS = vi.mocked(detectOS);
const mockCheckNode = vi.mocked(checkNode);
const mockInstallOpenClaw = vi.mocked(installOpenClaw);
const mockCollectChannel = vi.mocked(collectChannelInputs);
const mockConfigureChannel = vi.mocked(configureChannel);
const mockSetupModel = vi.mocked(setupModel);
const mockSetupPersonality = vi.mocked(setupPersonality);
const mockSetupGateway = vi.mocked(setupGateway);
const mockSetupDirect = vi.mocked(setupDirect);
const mockSetupService = vi.mocked(setupService);
const mockVerify = vi.mocked(verify);
const mockGetPreset = vi.mocked(getPreset);
const mockLogger = vi.mocked(logger);

describe("initCommand", () => {
  let ctx: SetupContext;
  let mockProcessExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockCreateContext.mockReturnValue(ctx);
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockProcessExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("prints banner", async () => {
    await initCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("██████"));
  });

  it("calls p.intro", async () => {
    await initCommand();

    expect(p.intro).toHaveBeenCalledWith(expect.stringContaining("Welcome to OpenClaw Setup"));
  });

  it("calls createContext", async () => {
    await initCommand();

    expect(mockCreateContext).toHaveBeenCalled();
  });

  it("runs all steps in order", async () => {
    const callOrder: string[] = [];
    mockDetectOS.mockImplementation(async () => { callOrder.push("detectOS"); });
    mockCheckNode.mockImplementation(async () => { callOrder.push("checkNode"); });
    mockInstallOpenClaw.mockImplementation(async () => { callOrder.push("installOpenClaw"); });
    mockCollectChannel.mockImplementation(async () => { callOrder.push("collectChannel"); });
    mockSetupModel.mockImplementation(async () => { callOrder.push("setupModel"); });
    mockSetupPersonality.mockImplementation(async () => { callOrder.push("setupPersonality"); });
    mockSetupGateway.mockImplementation(async () => { callOrder.push("setupGateway"); });
    mockConfigureChannel.mockImplementation(async () => { callOrder.push("configureChannel"); });
    mockSetupService.mockImplementation(async () => { callOrder.push("setupService"); });
    mockVerify.mockImplementation(async () => { callOrder.push("verify"); });

    await initCommand();

    expect(callOrder).toEqual([
      "detectOS", "checkNode", "installOpenClaw",
      "collectChannel", "setupModel", "setupPersonality",
      "setupGateway", "configureChannel",
      "setupService", "verify",
    ]);
  });

  it("handles step failure and calls process.exit", async () => {
    mockDetectOS.mockRejectedValueOnce(new Error("OS detection failed"));

    await expect(initCommand()).rejects.toThrow("process.exit");

    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it("shows success banner on completion", async () => {
    await initCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Your AI agent is LIVE!"));
  });

  it("calls p.outro on completion", async () => {
    await initCommand();

    expect(p.outro).toHaveBeenCalledWith("Setup complete!");
  });

  it("logs completion", async () => {
    await initCommand();

    expect(mockLogger.info).toHaveBeenCalledWith("Setup completed successfully");
  });

  it("logs start", async () => {
    await initCommand();

    expect(mockLogger.info).toHaveBeenCalledWith("Starting oc-setup init");
  });

  it("shows error message on step failure", async () => {
    mockCheckNode.mockRejectedValueOnce(new Error("node check failed"));
    mockDetectOS.mockResolvedValueOnce(undefined);

    await expect(initCommand()).rejects.toThrow("process.exit");

    expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining("failed"));
  });

  it("shows re-run hint on step failure", async () => {
    mockDetectOS.mockRejectedValueOnce(new Error("fail"));

    await expect(initCommand()).rejects.toThrow("process.exit");

    expect(p.log.info).toHaveBeenCalledWith("You can re-run oc-setup to resume where you left off.");
  });

  it("logs step failure", async () => {
    mockDetectOS.mockRejectedValueOnce(new Error("boom"));

    await expect(initCommand()).rejects.toThrow("process.exit");

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("OS Detection"));
  });

  it("applies decoded config payload", async () => {
    const cfg = { name: "Alice", channel: "discord" };
    const payload = Buffer.from(JSON.stringify(cfg)).toString("base64");

    await initCommand(payload);

    expect(p.log.success).toHaveBeenCalledWith(expect.stringContaining("pre-filled"));
    expect(ctx.userName).toBe("Alice");
    expect(ctx.channel).toBe("discord");
  });

  it("shows warning for invalid config payload", async () => {
    await initCommand("not-valid-base64!!!");

    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("Could not decode"));
  });

  it("shows demo mode message", async () => {
    await initCommand(undefined, true);

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Demo mode"));
  });

  it("uses setupDirect instead of setupGateway in demo mode", async () => {
    const callOrder: string[] = [];
    mockSetupGateway.mockImplementation(async () => { callOrder.push("gateway"); });
    mockSetupDirect.mockImplementation(async () => { callOrder.push("direct"); });
    mockConfigureChannel.mockImplementation(async () => { callOrder.push("configureChannel"); });

    await initCommand(undefined, true);

    expect(callOrder).toContain("direct");
    expect(callOrder).not.toContain("gateway");
    expect(callOrder).not.toContain("configureChannel");
  });

  it("does not use setupDirect in normal mode", async () => {
    await initCommand();

    expect(mockSetupDirect).not.toHaveBeenCalled();
    expect(mockSetupGateway).toHaveBeenCalled();
  });

  it("shows dashboard URL in success banner", async () => {
    await initCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("localhost:18789"));
  });

  it("shows useful commands in success banner", async () => {
    await initCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("openclaw status"));
  });

  it("shows channel hint in success banner", async () => {
    ctx.channel = "telegram";
    ctx.telegram = { token: "t", botUsername: "my_bot" };

    await initCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("@my_bot"));
  });
});
