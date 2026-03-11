import { describe, it, expect, vi, beforeEach } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";

vi.mock("node:os", () => ({
  homedir: vi.fn(),
}));

import { paths } from "../../src/lib/platform.js";

describe("paths", () => {
  beforeEach(() => {
    vi.mocked(homedir).mockReturnValue("/mock/home");
  });

  it("home matches mocked homedir()", () => {
    const p = paths();
    expect(p.home).toBe("/mock/home");
    expect(p.home).toBe(homedir());
  });

  it("configFile ends with config.json", () => {
    const p = paths();
    expect(p.configFile.endsWith("config.json")).toBe(true);
  });

  it("logsDir ends with logs", () => {
    const p = paths();
    expect(p.logsDir.endsWith("logs")).toBe(true);
  });

  it("soulFile ends with SOUL.md", () => {
    const p = paths();
    expect(p.soulFile.endsWith("SOUL.md")).toBe(true);
  });

  it("userFile ends with USER.md", () => {
    const p = paths();
    expect(p.userFile.endsWith("USER.md")).toBe(true);
  });

  it("heartbeatFile ends with HEARTBEAT.md", () => {
    const p = paths();
    expect(p.heartbeatFile.endsWith("HEARTBEAT.md")).toBe(true);
  });

  it("launchdPlist contains LaunchAgents", () => {
    const p = paths();
    expect(p.launchdPlist).toContain("LaunchAgents");
  });

  it("systemdUnit contains systemd/user", () => {
    const p = paths();
    expect(p.systemdUnit).toContain(join("systemd", "user"));
  });

  it("all path values are strings", () => {
    const p = paths();
    const keys = [
      "home",
      "openclawDir",
      "configFile",
      "logsDir",
      "soulFile",
      "userFile",
      "heartbeatFile",
      "launchdPlist",
      "systemdUnit",
    ] as const;

    for (const key of keys) {
      expect(typeof p[key]).toBe("string");
    }
  });

  it("all paths are absolute (start with /)", () => {
    const p = paths();
    const allPaths = [
      p.home,
      p.openclawDir,
      p.configFile,
      p.logsDir,
      p.soulFile,
      p.userFile,
      p.heartbeatFile,
      p.launchdPlist,
      p.systemdUnit,
    ];

    for (const pth of allPaths) {
      expect(pth.startsWith("/")).toBe(true);
    }
  });

  it("returns consistent results on multiple calls", () => {
    const first = paths();
    const second = paths();

    expect(first.home).toBe(second.home);
    expect(first.openclawDir).toBe(second.openclawDir);
    expect(first.configFile).toBe(second.configFile);
    expect(first.logsDir).toBe(second.logsDir);
    expect(first.soulFile).toBe(second.soulFile);
    expect(first.userFile).toBe(second.userFile);
    expect(first.heartbeatFile).toBe(second.heartbeatFile);
    expect(first.launchdPlist).toBe(second.launchdPlist);
    expect(first.systemdUnit).toBe(second.systemdUnit);
  });

  it("openclawDir is parent of configFile", () => {
    const p = paths();
    expect(p.configFile.startsWith(p.openclawDir)).toBe(true);
    expect(p.configFile).toBe(join(p.openclawDir, "config.json"));
  });

  it("openclawDir is parent of logsDir", () => {
    const p = paths();
    expect(p.logsDir.startsWith(p.openclawDir)).toBe(true);
    expect(p.logsDir).toBe(join(p.openclawDir, "logs"));
  });

  it("openclawDir is parent of soulFile", () => {
    const p = paths();
    expect(p.soulFile.startsWith(p.openclawDir)).toBe(true);
    expect(p.soulFile).toBe(join(p.openclawDir, "SOUL.md"));
  });

  it("all .openclaw-based paths include .openclaw", () => {
    const p = paths();
    const openclawPaths = [
      p.openclawDir,
      p.configFile,
      p.logsDir,
      p.soulFile,
      p.userFile,
      p.heartbeatFile,
    ];

    for (const pth of openclawPaths) {
      expect(pth).toContain(".openclaw");
    }
  });

  it("launchdPlist includes Library", () => {
    const p = paths();
    expect(p.launchdPlist).toContain("Library");
  });

  it("systemdUnit includes .config", () => {
    const p = paths();
    expect(p.systemdUnit).toContain(".config");
  });

  it("launchdPlist has correct filename", () => {
    const p = paths();
    expect(p.launchdPlist.endsWith("com.openclaw.gateway.plist")).toBe(true);
  });

  it("systemdUnit has correct filename", () => {
    const p = paths();
    expect(p.systemdUnit.endsWith("openclaw-gateway.service")).toBe(true);
  });

  it("uses different base directories for launchdPlist vs systemdUnit", () => {
    const p = paths();
    expect(p.launchdPlist).not.toContain(".config");
    expect(p.systemdUnit).not.toContain("Library");
  });

  it("openclawDir is parent of userFile and heartbeatFile", () => {
    const p = paths();
    expect(p.userFile.startsWith(p.openclawDir)).toBe(true);
    expect(p.heartbeatFile.startsWith(p.openclawDir)).toBe(true);
  });

  it("adapts to different home directories", () => {
    vi.mocked(homedir).mockReturnValue("/other/user");
    const p = paths();

    expect(p.home).toBe("/other/user");
    expect(p.openclawDir).toBe("/other/user/.openclaw");
    expect(p.configFile).toBe("/other/user/.openclaw/config.json");
    expect(p.launchdPlist).toContain("/other/user/Library");
    expect(p.systemdUnit).toContain("/other/user/.config");
  });

  it("returns all expected keys", () => {
    const p = paths();
    const expectedKeys = [
      "home",
      "openclawDir",
      "configFile",
      "logsDir",
      "soulFile",
      "userFile",
      "heartbeatFile",
      "launchdPlist",
      "systemdUnit",
    ];

    for (const key of expectedKeys) {
      expect(p).toHaveProperty(key);
    }
    expect(Object.keys(p)).toHaveLength(expectedKeys.length);
  });

  it("no path contains double slashes", () => {
    const p = paths();
    const allPaths = [
      p.home,
      p.openclawDir,
      p.configFile,
      p.logsDir,
      p.soulFile,
      p.userFile,
      p.heartbeatFile,
      p.launchdPlist,
      p.systemdUnit,
    ];

    for (const pth of allPaths) {
      expect(pth).not.toContain("//");
    }
  });
});
