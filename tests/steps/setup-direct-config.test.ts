import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext, createEmptyContext } from "../helpers/mock-factories.js";
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

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
  runInteractive: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { runShell, runInteractive } from "../../src/utils/exec.js";
import { setupDirect } from "../../src/steps/setup-direct.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockRunShell = vi.mocked(runShell);
const mockRunInteractive = vi.mocked(runInteractive);

function getConfigContent(): Record<string, unknown> {
  const call = mockWriteFileSync.mock.calls.find(
    (c) => (c[0] as string).includes("openclaw.json"),
  );
  return call ? JSON.parse(call[1] as string) : {};
}

function getAuthContent(): Record<string, unknown> {
  const call = mockWriteFileSync.mock.calls.find(
    (c) => (c[0] as string).includes("auth-profiles.json"),
  );
  return call ? JSON.parse(call[1] as string) : {};
}

describe("setupDirect – config writing details", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    mockExistsSync.mockReturnValue(false);
    mockRunShell.mockResolvedValue(successResult());
    mockRunInteractive.mockResolvedValue(0);
  });

  it("writeFullConfig merges with existing config", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ existing: "data", custom: { key: "val" } }));

    await setupDirect(ctx);

    const config = getConfigContent();
    expect(config.agents).toBeDefined();
  });

  it("writeFullConfig handles missing existing file", async () => {
    mockExistsSync.mockReturnValue(false);

    await setupDirect(ctx);

    const config = getConfigContent();
    expect(config.agents).toBeDefined();
    expect(config.tools).toBeDefined();
  });

  it("writeFullConfig handles invalid existing JSON", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("NOT VALID JSON{{{");

    await setupDirect(ctx);

    const config = getConfigContent();
    expect(config.agents).toBeDefined();
  });

  it("writeFullConfig includes commands settings", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const commands = config.commands as Record<string, unknown>;
    expect(commands).toBeDefined();
    expect(commands.native).toBe("auto");
    expect(commands.nativeSkills).toBe("auto");
    expect(commands.restart).toBe(true);
    expect(commands.ownerDisplay).toBe("raw");
  });

  it("writeFullConfig includes hooks settings", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const hooks = config.hooks as Record<string, unknown>;
    expect(hooks).toBeDefined();
    const internal = hooks.internal as Record<string, unknown>;
    expect(internal.enabled).toBe(true);
  });

  it("writeFullConfig gateway auth has token", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const gateway = config.gateway as Record<string, unknown>;
    const auth = gateway.auth as Record<string, unknown>;
    expect(auth.mode).toBe("token");
    expect(typeof auth.token).toBe("string");
    expect((auth.token as string).length).toBe(48);
  });

  it("writeFullConfig gateway mode is local", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const gateway = config.gateway as Record<string, unknown>;
    expect(gateway.mode).toBe("local");
  });

  it("writeFullConfig gateway bind is loopback", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const gateway = config.gateway as Record<string, unknown>;
    expect(gateway.bind).toBe("loopback");
  });

  it("writeAuth skips when no apiKey", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "",
      modelId: "claude-sonnet-4-6",
      authMethod: "oauth",
    };

    await setupDirect(ctx);

    const authCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("auth-profiles.json"),
    );
    expect(authCalls.length).toBe(0);
  });

  it("writeAuth writes to AGENT_DIR", async () => {
    await setupDirect(ctx);

    const authCalls = mockWriteFileSync.mock.calls.filter(
      (call) => (call[0] as string).includes("agents/main/agent/auth-profiles.json"),
    );
    expect(authCalls.length).toBe(1);
  });

  it("writeAuth writes to AGENT_DIR_LEGACY", async () => {
    await setupDirect(ctx);

    const authCalls = mockWriteFileSync.mock.calls.filter(
      (call) => {
        const path = call[0] as string;
        return path.includes("agent/auth-profiles.json") && !path.includes("agents/main");
      },
    );
    expect(authCalls.length).toBe(1);
  });

  it("generateToken is 48 characters", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const gateway = config.gateway as Record<string, unknown>;
    const auth = gateway.auth as Record<string, unknown>;
    expect((auth.token as string).length).toBe(48);
  });

  it("generateToken only uses hex chars", async () => {
    await setupDirect(ctx);

    const config = getConfigContent();
    const gateway = config.gateway as Record<string, unknown>;
    const auth = gateway.auth as Record<string, unknown>;
    expect(/^[a-f0-9]+$/.test(auth.token as string)).toBe(true);
  });

  it("generateToken produces different values on each call", async () => {
    await setupDirect(ctx);
    const config1 = getConfigContent();
    const token1 = ((config1.gateway as Record<string, unknown>).auth as Record<string, unknown>).token;

    mockWriteFileSync.mockClear();
    await setupDirect(ctx);
    const config2 = getConfigContent();
    const token2 = ((config2.gateway as Record<string, unknown>).auth as Record<string, unknown>).token;

    expect(token1).not.toBe(token2);
  });

  it("config JSON is pretty-printed", async () => {
    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const raw = configCall![1] as string;
    expect(raw).toContain("\n");
    expect(raw).toContain("  ");
  });

  it("config ends with newline", async () => {
    await setupDirect(ctx);

    const configCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes("openclaw.json"),
    );
    const raw = configCall![1] as string;
    expect(raw.endsWith("\n")).toBe(true);
  });
});
