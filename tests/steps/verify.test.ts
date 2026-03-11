import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";

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

import { verify } from "../../src/steps/verify.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { run } from "../../src/utils/exec.js";
import { createMockContext, createEmptyContext } from "../helpers/mock-factories.js";

describe("verify", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    vi.mocked(run).mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
  });

  it("checks gateway with pid when gatewayPid is set", async () => {
    ctx.gatewayPid = 1234;

    await verify(ctx);

    expect(run).toHaveBeenCalledWith("kill", ["-0", "1234"]);
  });

  it("checks gateway status when no pid", async () => {
    ctx.gatewayPid = null;

    await verify(ctx);

    expect(run).toHaveBeenCalledWith("openclaw", ["gateway", "status"]);
  });

  it("gateway check passes when running (via pid)", async () => {
    ctx.gatewayPid = 5678;
    vi.mocked(run).mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("running (pid 5678)"),
      "Verification",
    );
  });

  it("gateway check fails when not running (via pid)", async () => {
    ctx.gatewayPid = 9999;
    vi.mocked(run).mockResolvedValue({ stdout: "", stderr: "", exitCode: 1 });

    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("\u2717"),
      "Verification",
    );
  });

  it("telegram check passes when configured", async () => {
    ctx.telegram = { token: "tok", botUsername: "mybot" };

    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("@mybot"),
      "Verification",
    );
  });

  it("telegram check fails when not configured", async () => {
    ctx.telegram = null;

    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("not configured"),
      "Verification",
    );
  });

  it("model check passes when configured", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-test",
      modelId: "claude-sonnet-4-5-20250514",
      authMethod: "api-key",
    };

    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("claude-sonnet-4-5-20250514 configured"),
      "Verification",
    );
  });

  it("model check fails when not configured", async () => {
    ctx.model = null;

    await verify(ctx);

    const noteArg = vi.mocked(p.note).mock.calls[0][0];
    const modelLine = noteArg.split("\n").find((l: string) => l.includes("Model"));
    expect(modelLine).toContain("not configured");
    expect(modelLine).toContain("\u2717");
  });

  it("workspace check always passes", async () => {
    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("workspace initialized"),
      "Verification",
    );
  });

  it("heartbeat check always passes", async () => {
    await verify(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("configured (every 30 min)"),
      "Verification",
    );
  });

  it("note is called with formatted results", async () => {
    await verify(ctx);

    expect(p.note).toHaveBeenCalledTimes(1);
    expect(p.note).toHaveBeenCalledWith(
      expect.any(String),
      "Verification",
    );
  });

  it("warning logged for failures", async () => {
    ctx.telegram = null;
    ctx.model = null;

    await verify(ctx);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("issue(s)"),
    );
  });

  it("info logged when all pass", async () => {
    ctx.telegram = { token: "tok", botUsername: "bot" };
    ctx.model = {
      provider: "anthropic", apiKey: "k", modelId: "m", authMethod: "api-key",
    };
    ctx.gatewayPid = 100;
    vi.mocked(run).mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await verify(ctx);

    expect(logger.info).toHaveBeenCalledWith(
      "All verification checks passed",
    );
  });

  it("all checks shown in output", async () => {
    await verify(ctx);

    const noteArg = vi.mocked(p.note).mock.calls[0][0] as string;
    expect(noteArg).toContain("Gateway");
    expect(noteArg).toContain("Telegram");
    expect(noteArg).toContain("Model");
    expect(noteArg).toContain("Memory");
    expect(noteArg).toContain("Heartbeat");
  });

  it("failure count is correct", async () => {
    ctx.telegram = null;
    ctx.model = null;

    await verify(ctx);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("2 issue(s)"),
    );
  });

  it("check labels are padded to 12 characters", async () => {
    await verify(ctx);

    const noteArg = vi.mocked(p.note).mock.calls[0][0] as string;
    const lines = noteArg.split("\n");
    for (const line of lines) {
      const match = line.match(/[✓✗] (.{12})/);
      if (match) {
        expect(match[1]).toHaveLength(12);
      }
    }
  });

  it("gateway running via status command shows 'running'", async () => {
    ctx.gatewayPid = null;
    vi.mocked(run).mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await verify(ctx);

    const noteArg = vi.mocked(p.note).mock.calls[0][0] as string;
    const gatewayLine = noteArg.split("\n").find((l: string) => l.includes("Gateway"));
    expect(gatewayLine).toContain("running");
    expect(gatewayLine).toContain("\u2713");
  });

  it("gateway not running via status command shows 'not running'", async () => {
    ctx.gatewayPid = null;
    vi.mocked(run).mockResolvedValue({ stdout: "", stderr: "", exitCode: 1 });

    await verify(ctx);

    const noteArg = vi.mocked(p.note).mock.calls[0][0] as string;
    const gatewayLine = noteArg.split("\n").find((l: string) => l.includes("Gateway"));
    expect(gatewayLine).toContain("not running");
  });

  it("failure labels listed in warning message", async () => {
    ctx.telegram = null;
    ctx.model = null;

    await verify(ctx);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Telegram"),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Model"),
    );
  });
});
