import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockConfig, createMockPlatformInfo, createMockTelegramBotInfo } from "../helpers/mock-factories.js";
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
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("picocolors", () => ({
  default: {
    bold: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    red: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
  },
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  statfsSync: vi.fn(() => ({ bavail: 10 * 1024 * 1024, bsize: 1024 })),
}));

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
}));

vi.mock("../../src/lib/config.js", () => ({
  readConfig: vi.fn(() => ({})),
}));

vi.mock("../../src/lib/telegram.js", () => ({
  validateToken: vi.fn(),
}));

vi.mock("../../src/lib/models.js", () => ({
  validateApiKey: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  detectPlatform: vi.fn(() => ({
    platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
  })),
  paths: vi.fn(() => ({
    openclawDir: "/mock/home/.openclaw",
    configFile: "/mock/home/.openclaw/config.json",
    launchdPlist: "/mock/home/Library/LaunchAgents/com.openclaw.gateway.plist",
    systemdUnit: "/mock/home/.config/systemd/user/openclaw-gateway.service",
  })),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { existsSync, statfsSync } from "node:fs";
import { run, runShell } from "../../src/utils/exec.js";
import { readConfig } from "../../src/lib/config.js";
import { validateToken } from "../../src/lib/telegram.js";
import { validateApiKey } from "../../src/lib/models.js";
import { detectPlatform, paths } from "../../src/lib/platform.js";
import { logger } from "../../src/utils/logger.js";
import { doctorCommand } from "../../src/commands/doctor.js";

const mockRun = vi.mocked(run);
const mockRunShell = vi.mocked(runShell);
const mockExistsSync = vi.mocked(existsSync);
const mockStatfsSync = vi.mocked(statfsSync);
const mockReadConfig = vi.mocked(readConfig);
const mockValidateToken = vi.mocked(validateToken);
const mockValidateApiKey = vi.mocked(validateApiKey);
const mockDetectPlatform = vi.mocked(detectPlatform);
const mockLogger = vi.mocked(logger);

describe("doctorCommand", () => {
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    mockRun.mockResolvedValue(successResult("1.0.0"));
    mockRunShell.mockResolvedValue(successResult("running"));
    mockExistsSync.mockReturnValue(true);
    mockStatfsSync.mockReturnValue({ bavail: 10 * 1024 * 1024, bsize: 1024 } as any);
    mockReadConfig.mockReturnValue(createMockConfig());
    mockValidateToken.mockResolvedValue(createMockTelegramBotInfo());
    mockValidateApiKey.mockResolvedValue(true);
    mockDetectPlatform.mockReturnValue(createMockPlatformInfo());

    Object.defineProperty(process, "version", { value: "v22.0.0", writable: true, configurable: true });
  });

  it("shows intro", async () => {
    await doctorCommand();

    expect(p.intro).toHaveBeenCalledWith(expect.stringContaining("doctor"));
  });

  it("checks Node.js version", async () => {
    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Node.js"));
  });

  it("Node check passes for v18+", async () => {
    Object.defineProperty(process, "version", { value: "v22.0.0", configurable: true });

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("v22.0.0"));
  });

  it("Node check fails for < v18", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("too old"));
  });

  it("checks OpenClaw installation", async () => {
    await doctorCommand();

    expect(mockRun).toHaveBeenCalledWith("openclaw", ["--version"]);
  });

  it("OpenClaw check passes when installed", async () => {
    mockRun.mockResolvedValueOnce(successResult("2.1.0"));

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("2.1.0"));
  });

  it("OpenClaw check fails when not installed", async () => {
    mockRun.mockResolvedValueOnce(failureResult("not found"));

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("NOT INSTALLED"));
  });

  it("checks gateway status", async () => {
    await doctorCommand();

    expect(mockRunShell).toHaveBeenCalledWith("openclaw gateway status 2>/dev/null");
  });

  it("gateway check passes when running", async () => {
    mockRunShell.mockResolvedValueOnce(successResult("running"));

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("running (OK)"));
  });

  it("checks config file existence", async () => {
    mockExistsSync.mockReturnValue(true);

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Config"));
  });

  it("checks Telegram token when configured", async () => {
    mockReadConfig.mockReturnValue(createMockConfig());
    mockValidateToken.mockResolvedValue(createMockTelegramBotInfo({ username: "live_bot" }));

    await doctorCommand();

    expect(mockValidateToken).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("@live_bot"));
  });

  it("shows telegram not configured when no token", async () => {
    mockReadConfig.mockReturnValue({});

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("not configured"));
  });

  it("checks API key when configured", async () => {
    mockReadConfig.mockReturnValue(createMockConfig());
    mockValidateApiKey.mockResolvedValue(true);

    await doctorCommand();

    expect(mockValidateApiKey).toHaveBeenCalled();
  });

  it("shows API key not configured when missing", async () => {
    mockReadConfig.mockReturnValue({});

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("not configured"));
  });

  it("checks disk space", async () => {
    mockStatfsSync.mockReturnValue({ bavail: 5 * 1024 * 1024, bsize: 1024 } as any);

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Disk"));
  });

  it("checks service installation on macOS (launchd)", async () => {
    mockDetectPlatform.mockReturnValue(createMockPlatformInfo({ serviceManager: "launchd" }));
    mockExistsSync.mockReturnValue(true);

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Auto-start"));
  });

  it("checks service installation on Linux (systemd)", async () => {
    mockDetectPlatform.mockReturnValue(createMockPlatformInfo({ serviceManager: "systemd" }));
    mockExistsSync.mockImplementation((p: any) => {
      if (String(p).includes("systemd")) return true;
      return true;
    });

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Auto-start"));
  });

  it("all checks pass shows success outro", async () => {
    Object.defineProperty(process, "version", { value: "v22.0.0", configurable: true });
    mockRun.mockResolvedValue(successResult("1.0.0"));
    mockRunShell.mockResolvedValue(successResult("running"));
    mockExistsSync.mockReturnValue(true);
    mockReadConfig.mockReturnValue(createMockConfig());
    mockValidateToken.mockResolvedValue(createMockTelegramBotInfo());
    mockValidateApiKey.mockResolvedValue(true);

    await doctorCommand();

    expect(p.outro).toHaveBeenCalledWith(expect.stringContaining("All checks passed"));
  });

  it("some checks fail shows warning outro", async () => {
    mockRun.mockResolvedValueOnce(failureResult("not found"));

    await doctorCommand();

    expect(p.outro).toHaveBeenCalledWith(expect.stringContaining("issue"));
  });

  it("prints fix suggestions for failures", async () => {
    mockRun.mockResolvedValueOnce(failureResult("not found"));

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Fix:"));
  });

  it("handles disk space check failure gracefully", async () => {
    mockStatfsSync.mockImplementation(() => { throw new Error("no access"); });

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("could not check"));
  });

  it("logs completion with pass count", async () => {
    await doctorCommand();

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Doctor completed: \d+\/\d+ passed/));
  });

  it("logs start", async () => {
    await doctorCommand();

    expect(mockLogger.info).toHaveBeenCalledWith("Running diagnostics");
  });

  it("shows fix for Node version < 18 on macOS", async () => {
    Object.defineProperty(process, "version", { value: "v16.0.0", configurable: true });
    mockDetectPlatform.mockReturnValue(createMockPlatformInfo({ platform: "macos" }));

    await doctorCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("brew install node"));
  });
});
