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

describe("checkNode — edge cases", () => {
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

  it("version v18.0.0 is minimum passing", async () => {
    Object.defineProperty(process, "version", { value: "v18.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v18.0.0");
    expect(p.log.success).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it("version v17.9.9 is maximum failing", async () => {
    Object.defineProperty(process, "version", { value: "v17.9.9", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("too old"),
    );
  });

  it("version v100.0.0 (very high) succeeds", async () => {
    Object.defineProperty(process, "version", { value: "v100.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v100.0.0");
    expect(p.log.success).toHaveBeenCalled();
  });

  it("version v0.10.0 (very old) fails", async () => {
    Object.defineProperty(process, "version", { value: "v0.10.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("version string without v prefix parsed correctly", async () => {
    Object.defineProperty(process, "version", { value: "20.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("20.0.0");
    expect(p.log.success).toHaveBeenCalled();
  });

  it("malformed version string triggers NaN exit", async () => {
    Object.defineProperty(process, "version", { value: "not-a-version", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      "Could not determine Node.js version.",
    );
  });

  it("empty version string triggers NaN exit", async () => {
    Object.defineProperty(process, "version", { value: "", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("version with pre-release tag parses major correctly", async () => {
    Object.defineProperty(process, "version", { value: "v22.0.0-beta.1", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v22.0.0-beta.1");
    expect(p.log.success).toHaveBeenCalled();
  });

  it("checkNode preserves existing context values", async () => {
    ctx.userName = "Bob";
    ctx.agentName = "Agent";
    ctx.gatewayPort = 3000;
    ctx.skills = ["search"];
    Object.defineProperty(process, "version", { value: "v22.0.0", configurable: true });

    await checkNode(ctx);

    expect(ctx.userName).toBe("Bob");
    expect(ctx.agentName).toBe("Agent");
    expect(ctx.gatewayPort).toBe(3000);
    expect(ctx.skills).toEqual(["search"]);
    expect(ctx.nodeVersion).toBe("v22.0.0");
  });

  it("multiple calls to checkNode update nodeVersion", async () => {
    Object.defineProperty(process, "version", { value: "v20.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v20.0.0");

    Object.defineProperty(process, "version", { value: "v22.0.0", configurable: true });
    await checkNode(ctx);
    expect(ctx.nodeVersion).toBe("v22.0.0");
  });

  it("install hint for macOS", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });
    vi.mocked(installHint).mockReturnValue("brew install node");

    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(installHint).toHaveBeenCalledWith("macos");
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("brew install node"),
    );
  });

  it("install hint for Linux", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });
    vi.mocked(installHint).mockReturnValue("curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -");

    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(installHint).toHaveBeenCalledWith("linux");
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("curl -fsSL"),
    );
  });

  it("install hint for Windows", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "windows", arch: "x64", display: "Windows (x64)", serviceManager: "task-scheduler",
    });
    vi.mocked(installHint).mockReturnValue("winget install OpenJS.NodeJS.LTS");

    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(installHint).toHaveBeenCalledWith("windows");
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("winget install"),
    );
  });

  it("error message includes current version", async () => {
    Object.defineProperty(process, "version", { value: "v14.17.6", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("v14.17.6"),
    );
  });

  it("logger called with version info on success", async () => {
    Object.defineProperty(process, "version", { value: "v20.11.0", configurable: true });
    await checkNode(ctx);
    expect(logger.info).toHaveBeenCalledWith("Node.js v20.11.0 OK");
  });

  it("logger called with version info on too-old failure", async () => {
    Object.defineProperty(process, "version", { value: "v12.0.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("v12.0.0"),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("below minimum 18"),
    );
  });

  it("error message includes minimum version requirement", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    await expect(checkNode(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("v18"),
    );
  });
});
