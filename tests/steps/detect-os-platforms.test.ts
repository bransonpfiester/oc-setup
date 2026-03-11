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
import type { PlatformInfo } from "../../src/lib/platform.js";

function platform(
  plat: PlatformInfo["platform"],
  arch: PlatformInfo["arch"],
  display: string,
  sm: PlatformInfo["serviceManager"] = "none",
): PlatformInfo {
  return { platform: plat, arch, display, serviceManager: sm };
}

describe("detectOS — platform combinations", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
  });

  it("macOS with arm64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("macos", "arm64", "macOS (arm64)", "launchd"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "macos", arch: "arm64", display: "macOS (arm64)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("macOS with x64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("macos", "x64", "macOS (x64)", "launchd"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "macos", arch: "x64", display: "macOS (x64)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("macOS with unknown arch", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("macos", "unknown", "macOS (unknown)", "launchd"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "macos", arch: "unknown", display: "macOS (unknown)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("Linux with arm64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("linux", "arm64", "Linux (arm64)", "systemd"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "linux", arch: "arm64", display: "Linux (arm64)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("Linux with x64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("linux", "x64", "Linux (x64)", "systemd"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "linux", arch: "x64", display: "Linux (x64)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("Linux with unknown arch", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("linux", "unknown", "Linux (unknown)", "systemd"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "linux", arch: "unknown", display: "Linux (unknown)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("Windows with arm64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("windows", "arm64", "Windows (arm64)", "task-scheduler"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "windows", arch: "arm64", display: "Windows (arm64)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("Windows with x64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("windows", "x64", "Windows (x64)", "task-scheduler"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "windows", arch: "x64", display: "Windows (x64)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("Windows with unknown arch", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("windows", "unknown", "Windows (unknown)", "task-scheduler"));
    await detectOS(ctx);
    expect(ctx.os).toEqual({ platform: "windows", arch: "unknown", display: "Windows (unknown)" });
    expect(p.log.warn).not.toHaveBeenCalled();
  });

  it("unknown platform with arm64", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("unknown", "arm64", "freebsd (arm64)"));
    await detectOS(ctx);
    expect(ctx.os.platform).toBe("unknown");
    expect(ctx.os.arch).toBe("arm64");
    expect(p.log.warn).toHaveBeenCalled();
  });

  it("display string format for macOS", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("macos", "arm64", "macOS (arm64)", "launchd"));
    await detectOS(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Detected: macOS (arm64)");
    expect(logger.info).toHaveBeenCalledWith("Detected OS: macOS (arm64)");
  });

  it("display string format for Linux", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("linux", "x64", "Linux (x64)", "systemd"));
    await detectOS(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Detected: Linux (x64)");
    expect(logger.info).toHaveBeenCalledWith("Detected OS: Linux (x64)");
  });

  it("display string format for Windows", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("windows", "x64", "Windows (x64)", "task-scheduler"));
    await detectOS(ctx);
    expect(p.log.success).toHaveBeenCalledWith("Detected: Windows (x64)");
    expect(logger.info).toHaveBeenCalledWith("Detected OS: Windows (x64)");
  });

  it("context os object is fully populated after call", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("linux", "arm64", "Linux (arm64)", "systemd"));
    await detectOS(ctx);
    expect(ctx.os.platform).toBeTruthy();
    expect(ctx.os.arch).toBeTruthy();
    expect(ctx.os.display).toBeTruthy();
    expect(Object.keys(ctx.os)).toHaveLength(3);
  });

  it("warning message text for unknown platform", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("unknown", "x64", "aix (x64)"));
    await detectOS(ctx);
    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("not officially supported"),
    );
  });

  it("unknown platform still sets os fields correctly", async () => {
    vi.mocked(detectPlatform).mockReturnValue(platform("unknown", "unknown", "sunos (unknown)"));
    await detectOS(ctx);
    expect(ctx.os.platform).toBe("unknown");
    expect(ctx.os.arch).toBe("unknown");
    expect(ctx.os.display).toBe("sunos (unknown)");
  });

  it("success message always uses display from detectPlatform", async () => {
    const custom = "CustomOS (riscv64)";
    vi.mocked(detectPlatform).mockReturnValue(platform("unknown", "unknown", custom));
    await detectOS(ctx);
    expect(p.log.success).toHaveBeenCalledWith(`Detected: ${custom}`);
  });
});
