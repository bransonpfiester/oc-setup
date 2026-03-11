import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext } from "../helpers/mock-factories.js";
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
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  detectPlatform: vi.fn(),
  paths: vi.fn(() => ({
    home: "/mock/home",
    openclawDir: "/mock/home/.openclaw",
    configFile: "/mock/home/.openclaw/config.json",
    logsDir: "/mock/home/.openclaw/logs",
    soulFile: "/mock/home/.openclaw/SOUL.md",
    userFile: "/mock/home/.openclaw/USER.md",
    heartbeatFile: "/mock/home/.openclaw/HEARTBEAT.md",
    launchdPlist: "/mock/home/Library/LaunchAgents/com.openclaw.gateway.plist",
    systemdUnit: "/mock/home/.config/systemd/user/openclaw-gateway.service",
  })),
}));

vi.mock("../../src/utils/exec.js", () => ({
  runShell: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { writeFileSync, mkdirSync } from "node:fs";
import { detectPlatform } from "../../src/lib/platform.js";
import { runShell } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { setupService } from "../../src/steps/setup-service.js";

const mockDetectPlatform = vi.mocked(detectPlatform);
const mockRunShell = vi.mocked(runShell);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockSpinner = vi.mocked(p.spinner);
const mockLogger = vi.mocked(logger);

describe("setupService", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext({ gatewayPort: 18789 });
    mockRunShell.mockResolvedValue(successResult());
  });

  it("macOS writes plist file", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/Library/LaunchAgents/com.openclaw.gateway.plist",
      expect.stringContaining("com.openclaw.gateway"),
      "utf-8",
    );
  });

  it("macOS calls launchctl unload then load", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      expect.stringContaining("launchctl unload"),
    );
    expect(mockRunShell).toHaveBeenCalledWith(
      expect.stringContaining("launchctl load"),
    );
  });

  it("macOS handles launchctl failure", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });
    mockRunShell
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(failureResult("load failed", 1));

    await setupService(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not load"),
    );
  });

  it("linux writes systemd unit file", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.config/systemd/user/openclaw-gateway.service",
      expect.stringContaining("[Unit]"),
      "utf-8",
    );
  });

  it("linux calls systemctl daemon-reload", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    expect(mockRunShell).toHaveBeenCalledWith("systemctl --user daemon-reload");
  });

  it("linux calls systemctl enable", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    expect(mockRunShell).toHaveBeenCalledWith(
      "systemctl --user enable openclaw-gateway.service",
    );
  });

  it("linux handles systemctl failure", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });
    mockRunShell
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(failureResult("enable failed", 1));

    await setupService(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not enable"),
    );
  });

  it("unknown platform shows not supported", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "unknown", arch: "unknown", display: "Unknown", serviceManager: "none",
    });

    await setupService(ctx);

    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("not supported"),
    );
  });

  it("plist contains correct port", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });
    ctx.gatewayPort = 20000;

    await setupService(ctx);

    const plistCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes(".plist"),
    );
    expect(plistCall![1]).toContain("20000");
  });

  it("plist contains correct label", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plistCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes(".plist"),
    );
    expect(plistCall![1]).toContain("com.openclaw.gateway");
  });

  it("systemd unit contains correct ExecStart", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });
    ctx.gatewayPort = 21000;

    await setupService(ctx);

    const unitCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes(".service"),
    );
    expect(unitCall![1]).toContain("ExecStart=/usr/local/bin/openclaw gateway start --port 21000");
  });

  it("systemd unit has correct After=network.target", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    const unitCall = mockWriteFileSync.mock.calls.find(
      (call) => (call[0] as string).includes(".service"),
    );
    expect(unitCall![1]).toContain("After=network.target");
  });

  it("creates log directory on macOS", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/logs",
      { recursive: true },
    );
  });

  it("creates parent directory for plist", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("LaunchAgents"),
      { recursive: true },
    );
  });

  it("spinner shows configuring message", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const spinnerInstance = mockSpinner.mock.results[0]!.value;
    expect(spinnerInstance.start).toHaveBeenCalledWith("Configuring auto-start...");
  });

  it("error handling doesn't crash", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });
    mockWriteFileSync.mockImplementation(() => { throw new Error("disk full"); });

    await expect(setupService(ctx)).resolves.toBeUndefined();

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not configure"),
    );
  });
});
