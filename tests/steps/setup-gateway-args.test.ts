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

import { run, runShell, runInteractive } from "../../src/utils/exec.js";
import { setupGateway } from "../../src/steps/setup-gateway.js";

const mockRun = vi.mocked(run);
const mockRunShell = vi.mocked(runShell);
const mockRunInteractive = vi.mocked(runInteractive);

function getOnboardArgs(): string[] {
  const call = mockRunInteractive.mock.calls.find(
    (c) => c[0] === "openclaw" && c[1]?.[0] === "onboard",
  );
  return call ? call[1]!.slice(1) : [];
}

describe("setupGateway – buildOnboardArgs / getProviderName / getEnvVar", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    mockRunShell.mockResolvedValue(successResult());
    mockRunInteractive.mockResolvedValue(0);
    mockRun.mockResolvedValue(successResult("running"));
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("buildOnboardArgs includes --mode local", async () => {
    await setupGateway(ctx);
    const args = getOnboardArgs();
    const idx = args.indexOf("--mode");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(args[idx + 1]).toBe("local");
  });

  it("buildOnboardArgs includes --flow quickstart", async () => {
    await setupGateway(ctx);
    const args = getOnboardArgs();
    const idx = args.indexOf("--flow");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(args[idx + 1]).toBe("quickstart");
  });

  it("buildOnboardArgs includes --gateway-port", async () => {
    ctx.gatewayPort = 19999;
    await setupGateway(ctx);
    const args = getOnboardArgs();
    const idx = args.indexOf("--gateway-port");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(args[idx + 1]).toBe("19999");
  });

  it("buildOnboardArgs without model", async () => {
    ctx.model = null;
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).toContain("--mode");
    expect(args).not.toContain("--auth-choice");
  });

  it("buildOnboardArgs with anthropic api-key", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).toContain("--auth-choice");
    expect(args[args.indexOf("--auth-choice") + 1]).toBe("anthropic-api-key");
    expect(args).toContain("--anthropic-api-key");
  });

  it("buildOnboardArgs with openai api-key", async () => {
    ctx.model = {
      provider: "openai",
      apiKey: "sk-openai-key",
      modelId: "gpt-4o",
      authMethod: "api-key",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).toContain("--auth-choice");
    expect(args[args.indexOf("--auth-choice") + 1]).toBe("openai-api-key");
    expect(args).toContain("--openai-api-key");
  });

  it("buildOnboardArgs with google api-key", async () => {
    ctx.model = {
      provider: "google",
      apiKey: "google-key",
      modelId: "gemini-2.5-pro",
      authMethod: "api-key",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).toContain("--auth-choice");
    expect(args[args.indexOf("--auth-choice") + 1]).toBe("gemini-api-key");
    expect(args).toContain("--gemini-api-key");
  });

  it("buildOnboardArgs with xai (custom provider)", async () => {
    ctx.model = {
      provider: "xai",
      apiKey: "xai-key",
      modelId: "grok-4",
      authMethod: "api-key",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).toContain("--auth-choice");
    expect(args[args.indexOf("--auth-choice") + 1]).toBe("custom-api-key");
    expect(args).toContain("--custom-base-url");
    expect(args).toContain("--custom-provider-id");
    expect(args[args.indexOf("--custom-provider-id") + 1]).toBe("xai");
  });

  it("buildOnboardArgs with deepseek (custom provider)", async () => {
    ctx.model = {
      provider: "deepseek",
      apiKey: "ds-key",
      modelId: "deepseek-chat",
      authMethod: "api-key",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).toContain("--custom-base-url");
    expect(args[args.indexOf("--custom-base-url") + 1]).toBe("https://api.deepseek.com/v1");
    expect(args).toContain("--custom-provider-id");
    expect(args[args.indexOf("--custom-provider-id") + 1]).toBe("deepseek");
  });

  it("buildOnboardArgs with oauth method removes --accept-risk", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "",
      modelId: "claude-sonnet-4-6",
      authMethod: "oauth",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).not.toContain("--accept-risk");
    expect(args).not.toContain("--auth-choice");
  });

  it("buildOnboardArgs with setup-token removes --secret-input-mode", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "clst_tok",
      modelId: "claude-sonnet-4-6",
      authMethod: "setup-token",
    };
    await setupGateway(ctx);
    const args = getOnboardArgs();
    expect(args).not.toContain("--secret-input-mode");
    expect(args).not.toContain("--accept-risk");
  });

  it("getProviderName maps google to google-generative-ai (via writeAuthProfile)", async () => {
    ctx.model = {
      provider: "google",
      apiKey: "google-key",
      modelId: "gemini-2.5-pro",
      authMethod: "api-key",
    };
    await setupGateway(ctx);

    const { writeFileSync } = await import("node:fs");
    const writeCalls = vi.mocked(writeFileSync).mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    if (writeCalls.length > 0) {
      const content = JSON.parse(writeCalls[0]![1] as string);
      expect(content.profiles["google-generative-ai:default"]).toBeDefined();
    }
  });

  it("getProviderName returns unknown provider as-is", async () => {
    ctx.model = {
      provider: "custom-provider",
      apiKey: "custom-key",
      modelId: "custom-model",
      authMethod: "api-key",
    };
    await setupGateway(ctx);

    const { writeFileSync } = await import("node:fs");
    const writeCalls = vi.mocked(writeFileSync).mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    if (writeCalls.length > 0) {
      const content = JSON.parse(writeCalls[0]![1] as string);
      expect(content.profiles["custom-provider:default"]).toBeDefined();
    }
  });

  it("getEnvVar for anthropic (shown in fallback message)", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };
    const { writeFileSync, mkdirSync: mkdirFn } = await import("node:fs");
    vi.mocked(mkdirFn).mockImplementation(() => { throw new Error("write fail"); });

    await setupGateway(ctx);

    const { log } = await import("@clack/prompts");
    const infoCalls = vi.mocked(log.info).mock.calls;
    const envCall = infoCalls.find(
      (c) => typeof c[0] === "string" && c[0].includes("ANTHROPIC_API_KEY"),
    );
    expect(envCall).toBeDefined();
  });

  it("getEnvVar for unknown returns CUSTOM_API_KEY (shown in fallback)", async () => {
    ctx.model = {
      provider: "some-unknown",
      apiKey: "key-123",
      modelId: "model-x",
      authMethod: "api-key",
    };
    const { mkdirSync: mkdirFn } = await import("node:fs");
    vi.mocked(mkdirFn).mockImplementation(() => { throw new Error("write fail"); });

    await setupGateway(ctx);

    const { log } = await import("@clack/prompts");
    const infoCalls = vi.mocked(log.info).mock.calls;
    const envCall = infoCalls.find(
      (c) => typeof c[0] === "string" && c[0].includes("CUSTOM_API_KEY"),
    );
    expect(envCall).toBeDefined();
  });

  it("installGatewayService when not installed", async () => {
    mockRunShell
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(successResult("not installed"))
      .mockResolvedValueOnce(successResult());

    await setupGateway(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw gateway install 2>&1",
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it("installGatewayService when already installed", async () => {
    mockRunShell
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(successResult("active"));

    await setupGateway(ctx);

    const installCalls = mockRunShell.mock.calls.filter(
      (c) => c[0] === "openclaw gateway install 2>&1",
    );
    expect(installCalls.length).toBe(0);
  });
});
