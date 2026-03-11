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

import { detectOS } from "../../src/steps/detect-os.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { detectPlatform } from "../../src/lib/platform.js";
import { createEmptyContext } from "../helpers/mock-factories.js";

describe("detectOS", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "macos",
      arch: "arm64",
      display: "macOS (arm64)",
      serviceManager: "launchd",
    });
  });

  it("sets ctx.os.platform from detectPlatform", async () => {
    await detectOS(ctx);
    expect(ctx.os.platform).toBe("macos");
  });

  it("sets ctx.os.arch from detectPlatform", async () => {
    await detectOS(ctx);
    expect(ctx.os.arch).toBe("arm64");
  });

  it("sets ctx.os.display from detectPlatform", async () => {
    await detectOS(ctx);
    expect(ctx.os.display).toBe("macOS (arm64)");
  });

  it("logs info with display string", async () => {
    await detectOS(ctx);
    expect(logger.info).toHaveBeenCalledWith("Detected OS: macOS (arm64)");
  });

  it("shows success message via clack", async () => {
    await detectOS(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Detected: macOS (arm64)");
  });

  it("shows warning for unknown platform", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "unknown",
      arch: "x64",
      display: "freebsd (x64)",
      serviceManager: "none",
    });

    await detectOS(ctx);
    expect(p.log.warn).toHaveBeenCalledWith(
      "Your platform is not officially supported. Things may not work as expected.",
    );
  });

  it("no warning for macOS", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "macos",
      arch: "arm64",
      display: "macOS (arm64)",
      serviceManager: "launchd",
    });

    await detectOS(ctx);
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("no warning for linux", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "linux",
      arch: "x64",
      display: "Linux (x64)",
      serviceManager: "systemd",
    });

    await detectOS(ctx);
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("no warning for windows", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "windows",
      arch: "x64",
      display: "Windows (x64)",
      serviceManager: "task-scheduler",
    });

    await detectOS(ctx);
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("works with arm64 arch", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "macos",
      arch: "arm64",
      display: "macOS (arm64)",
      serviceManager: "launchd",
    });

    await detectOS(ctx);
    expect(ctx.os.arch).toBe("arm64");
  });

  it("works with x64 arch", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "linux",
      arch: "x64",
      display: "Linux (x64)",
      serviceManager: "systemd",
    });

    await detectOS(ctx);
    expect(ctx.os.arch).toBe("x64");
  });

  it("works with unknown arch", async () => {
    vi.mocked(detectPlatform).mockReturnValue({
      platform: "macos",
      arch: "unknown",
      display: "macOS (unknown)",
      serviceManager: "launchd",
    });

    await detectOS(ctx);
    expect(ctx.os.arch).toBe("unknown");
  });

  it("does not modify other context fields", async () => {
    ctx.userName = "Alice";
    ctx.gatewayPort = 9999;
    ctx.channel = "discord";

    await detectOS(ctx);

    expect(ctx.userName).toBe("Alice");
    expect(ctx.gatewayPort).toBe(9999);
    expect(ctx.channel).toBe("discord");
    expect(ctx.nodeVersion).toBe("");
    expect(ctx.openclawVersion).toBeNull();
  });

  it("returns void (promise resolves to undefined)", async () => {
    const result = await detectOS(ctx);
    expect(result).toBeUndefined();
  });

  it("calls detectPlatform exactly once", async () => {
    await detectOS(ctx);
    expect(detectPlatform).toHaveBeenCalledTimes(1);
  });

  it("logger.info is called exactly once", async () => {
    await detectOS(ctx);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it("p.log.success is called exactly once", async () => {
    await detectOS(ctx);
    expect(p.log.success).toHaveBeenCalledTimes(1);
  });
});
