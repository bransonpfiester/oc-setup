import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

import { checkNode } from "../../src/steps/install-node.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { detectPlatform, installHint } from "../../src/lib/platform.js";
import { createEmptyContext } from "../helpers/mock-factories.js";

describe("checkNode", () => {
  let ctx: SetupContext;
  const originalVersion = process.version;

  beforeEach(() => {
    ctx = createEmptyContext();
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "macos",
      arch: "arm64",
      display: "macOS (arm64)",
      serviceManager: "launchd",
    });
    vi.mocked(installHint).mockReturnValue("brew install node");
  });

  afterEach(() => {
    Object.defineProperty(process, "version", {
      value: originalVersion,
      writable: true,
      configurable: true,
    });
  });

  it("sets nodeVersion on context for valid version", async () => {
    Object.defineProperty(process, "version", { value: "v20.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v20.0.0");
  });

  it("shows success for Node 18", async () => {
    Object.defineProperty(process, "version", { value: "v18.0.0", configurable: true });
    await checkNode(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Node.js v18.0.0 found");
  });

  it("shows success for Node 20", async () => {
    Object.defineProperty(process, "version", { value: "v20.10.0", configurable: true });
    await checkNode(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Node.js v20.10.0 found");
  });

  it("shows success for Node 22", async () => {
    Object.defineProperty(process, "version", { value: "v22.5.1", configurable: true });
    await checkNode(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Node.js v22.5.1 found");
  });

  it("calls process.exit for Node 16", async () => {
    Object.defineProperty(process, "version", { value: "v16.20.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("calls process.exit for Node 14", async () => {
    Object.defineProperty(process, "version", { value: "v14.21.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("calls process.exit for NaN version", async () => {
    Object.defineProperty(process, "version", { value: "invalid", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("shows error message for old version", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("too old"),
    );
  });

  it("shows install hint for old version", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("brew install node"),
    );
  });

  it("logs info for valid version", async () => {
    Object.defineProperty(process, "version", { value: "v22.0.0", configurable: true });
    await checkNode(ctx);
    expect(logger.info).toHaveBeenCalledWith("Node.js v22.0.0 OK");
  });

  it("logs error for invalid (NaN) version", async () => {
    Object.defineProperty(process, "version", { value: "garbage", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Invalid Node.js version"),
    );
  });

  it("does not modify other context fields", async () => {
    ctx.userName = "Alice";
    ctx.gatewayPort = 9999;
    Object.defineProperty(process, "version", { value: "v22.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.userName).toBe("Alice");
    expect(ctx.gatewayPort).toBe(9999);
    expect(ctx.openclawVersion).toBeNull();
  });

  it("handles version string v18.0.0", async () => {
    Object.defineProperty(process, "version", { value: "v18.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v18.0.0");
    expect(p.log.success).toHaveBeenCalled();
  });

  it("handles version string v22.5.1", async () => {
    Object.defineProperty(process, "version", { value: "v22.5.1", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v22.5.1");
    expect(p.log.success).toHaveBeenCalled();
  });

  it("process.exit called with code 1 for too-old version", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(process.exit).toHaveBeenCalledTimes(1);
  });

  it("error message for NaN includes 'Could not determine'", async () => {
    Object.defineProperty(process, "version", { value: "xyz", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      "Could not determine Node.js version.",
    );
  });

  it("nodeVersion is NOT set when version is NaN", async () => {
    Object.defineProperty(process, "version", { value: "abc", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(ctx.nodeVersion).toBe("");
  });

  it("nodeVersion IS set even when version is too old", async () => {
    Object.defineProperty(process, "version", { value: "v16.5.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(ctx.nodeVersion).toBe("v16.5.0");
  });
});
