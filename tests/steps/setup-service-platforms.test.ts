import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext } from "../helpers/mock-factories.js";
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
import { writeFileSync } from "node:fs";
import { detectPlatform } from "../../src/lib/platform.js";
import { runShell } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { setupService } from "../../src/steps/setup-service.js";

const mockDetectPlatform = vi.mocked(detectPlatform);
const mockRunShell = vi.mocked(runShell);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockLogger = vi.mocked(logger);

function getPlistContent(): string {
  const call = mockWriteFileSync.mock.calls.find(
    (c) => (c[0] as string).includes(".plist"),
  );
  return call ? (call[1] as string) : "";
}

function getSystemdContent(): string {
  const call = mockWriteFileSync.mock.calls.find(
    (c) => (c[0] as string).includes(".service"),
  );
  return call ? (call[1] as string) : "";
}

describe("setupService – platform-specific file contents", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext({ gatewayPort: 18789 });
    mockRunShell.mockResolvedValue(successResult());
  });

  it("generatePlist includes XML header", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain('<?xml version="1.0"');
  });

  it("generatePlist includes Label key", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain("<key>Label</key>");
    expect(plist).toContain("<string>com.openclaw.gateway</string>");
  });

  it("generatePlist includes ProgramArguments", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain("<key>ProgramArguments</key>");
    expect(plist).toContain("<string>/usr/local/bin/openclaw</string>");
    expect(plist).toContain("<string>gateway</string>");
    expect(plist).toContain("<string>start</string>");
  });

  it("generatePlist includes RunAtLoad", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain("<key>RunAtLoad</key>");
    expect(plist).toContain("<true/>");
  });

  it("generatePlist includes KeepAlive", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain("<key>KeepAlive</key>");
  });

  it("generatePlist includes log paths", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain("<key>StandardOutPath</key>");
    expect(plist).toContain("<key>StandardErrorPath</key>");
    expect(plist).toContain("gateway.log");
  });

  it("generatePlist with custom port", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });
    ctx.gatewayPort = 25000;

    await setupService(ctx);

    const plist = getPlistContent();
    expect(plist).toContain("<string>25000</string>");
  });

  it("generateSystemdUnit includes [Unit] section", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    const unit = getSystemdContent();
    expect(unit).toContain("[Unit]");
    expect(unit).toContain("Description=OpenClaw Gateway");
  });

  it("generateSystemdUnit includes [Service] section", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    const unit = getSystemdContent();
    expect(unit).toContain("[Service]");
    expect(unit).toContain("ExecStart=");
  });

  it("generateSystemdUnit includes [Install] section", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    const unit = getSystemdContent();
    expect(unit).toContain("[Install]");
    expect(unit).toContain("WantedBy=default.target");
  });

  it("generateSystemdUnit includes Restart=always", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    const unit = getSystemdContent();
    expect(unit).toContain("Restart=always");
  });

  it("generateSystemdUnit includes RestartSec=5", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });

    await setupService(ctx);

    const unit = getSystemdContent();
    expect(unit).toContain("RestartSec=5");
  });

  it("generateSystemdUnit with custom port", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "linux", arch: "x64", display: "Linux (x64)", serviceManager: "systemd",
    });
    ctx.gatewayPort = 30000;

    await setupService(ctx);

    const unit = getSystemdContent();
    expect(unit).toContain("--port 30000");
  });

  it("windows platform gets no service", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "windows", arch: "x64", display: "Windows (x64)", serviceManager: "task-scheduler",
    });

    await setupService(ctx);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("not supported"),
    );
  });

  it("task-scheduler service manager detection", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "windows", arch: "x64", display: "Windows (x64)", serviceManager: "task-scheduler",
    });

    await setupService(ctx);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("No service manager"),
    );
  });

  it("service files are valid text", async () => {
    mockDetectPlatform.mockReturnValue({
      platform: "macos", arch: "arm64", display: "macOS (arm64)", serviceManager: "launchd",
    });

    await setupService(ctx);

    const plist = getPlistContent();
    expect(typeof plist).toBe("string");
    expect(plist.length).toBeGreaterThan(0);
    expect(plist).toContain("</plist>");
  });
});
