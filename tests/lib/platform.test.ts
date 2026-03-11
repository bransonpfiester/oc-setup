import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { homedir } from "node:os";

vi.mock("node:os", () => ({
  homedir: vi.fn(),
}));

import {
  detectPlatform,
  paths,
  installHint,
} from "../../src/lib/platform.js";

describe("platform", () => {
  const originalPlatform = process.platform;
  const originalArch = process.arch;

  beforeEach(() => {
    vi.mocked(homedir).mockReturnValue("/mock/home");
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    Object.defineProperty(process, "arch", { value: originalArch });
  });

  describe("detectPlatform", () => {
    it("detects macOS (darwin) with arm64", () => {
      Object.defineProperty(process, "platform", { value: "darwin" });
      Object.defineProperty(process, "arch", { value: "arm64" });

      const result = detectPlatform();

      expect(result.platform).toBe("macos");
      expect(result.arch).toBe("arm64");
      expect(result.display).toBe("macOS (arm64)");
      expect(result.serviceManager).toBe("launchd");
    });

    it("detects macOS with x64", () => {
      Object.defineProperty(process, "platform", { value: "darwin" });
      Object.defineProperty(process, "arch", { value: "x64" });

      const result = detectPlatform();

      expect(result.platform).toBe("macos");
      expect(result.arch).toBe("x64");
      expect(result.display).toBe("macOS (x64)");
      expect(result.serviceManager).toBe("launchd");
    });

    it("detects Linux with arm64", () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      Object.defineProperty(process, "arch", { value: "arm64" });

      const result = detectPlatform();

      expect(result.platform).toBe("linux");
      expect(result.arch).toBe("arm64");
      expect(result.display).toBe("Linux (arm64)");
      expect(result.serviceManager).toBe("systemd");
    });

    it("detects Linux with x64", () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      Object.defineProperty(process, "arch", { value: "x64" });

      const result = detectPlatform();

      expect(result.platform).toBe("linux");
      expect(result.arch).toBe("x64");
      expect(result.display).toBe("Linux (x64)");
      expect(result.serviceManager).toBe("systemd");
    });

    it("detects Windows (win32)", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      Object.defineProperty(process, "arch", { value: "x64" });

      const result = detectPlatform();

      expect(result.platform).toBe("windows");
      expect(result.arch).toBe("x64");
      expect(result.display).toBe("Windows (x64)");
      expect(result.serviceManager).toBe("task-scheduler");
    });

    it("returns unknown for unrecognized platform", () => {
      Object.defineProperty(process, "platform", { value: "freebsd" });
      Object.defineProperty(process, "arch", { value: "x64" });

      const result = detectPlatform();

      expect(result.platform).toBe("unknown");
      expect(result.arch).toBe("x64");
      expect(result.display).toBe("freebsd (x64)");
      expect(result.serviceManager).toBe("none");
    });

    it("maps unrecognized arch to unknown", () => {
      Object.defineProperty(process, "platform", { value: "darwin" });
      Object.defineProperty(process, "arch", { value: "mips" });

      const result = detectPlatform();

      expect(result.arch).toBe("unknown");
      expect(result.display).toBe("macOS (unknown)");
    });

    it("returns object matching PlatformInfo shape", () => {
      Object.defineProperty(process, "platform", { value: "darwin" });
      Object.defineProperty(process, "arch", { value: "arm64" });

      const result = detectPlatform();

      expect(result).toHaveProperty("platform");
      expect(result).toHaveProperty("arch");
      expect(result).toHaveProperty("display");
      expect(result).toHaveProperty("serviceManager");
      expect(typeof result.platform).toBe("string");
      expect(typeof result.arch).toBe("string");
      expect(typeof result.display).toBe("string");
      expect(typeof result.serviceManager).toBe("string");
    });

    it("includes arch in display string for all platforms", () => {
      Object.defineProperty(process, "arch", { value: "arm64" });

      for (const p of ["darwin", "linux", "win32", "freebsd"] as const) {
        Object.defineProperty(process, "platform", { value: p });
        const result = detectPlatform();
        expect(result.display).toContain("arm64");
      }
    });

    it("returns Windows with arm64 arch when set", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      Object.defineProperty(process, "arch", { value: "arm64" });

      const result = detectPlatform();

      expect(result.platform).toBe("windows");
      expect(result.arch).toBe("arm64");
      expect(result.display).toBe("Windows (arm64)");
    });
  });

  describe("paths", () => {
    it("returns correct configFile", () => {
      const p = paths();
      expect(p.configFile).toBe("/mock/home/.openclaw/config.json");
    });

    it("returns correct soulFile", () => {
      const p = paths();
      expect(p.soulFile).toBe("/mock/home/.openclaw/SOUL.md");
    });

    it("returns correct userFile", () => {
      const p = paths();
      expect(p.userFile).toBe("/mock/home/.openclaw/USER.md");
    });

    it("returns correct heartbeatFile", () => {
      const p = paths();
      expect(p.heartbeatFile).toBe("/mock/home/.openclaw/HEARTBEAT.md");
    });

    it("returns correct launchdPlist path", () => {
      const p = paths();
      expect(p.launchdPlist).toBe(
        "/mock/home/Library/LaunchAgents/com.openclaw.gateway.plist",
      );
    });

    it("returns correct systemdUnit path", () => {
      const p = paths();
      expect(p.systemdUnit).toBe(
        "/mock/home/.config/systemd/user/openclaw-gateway.service",
      );
    });

    it("openclawDir is under home", () => {
      const p = paths();
      expect(p.openclawDir).toBe("/mock/home/.openclaw");
      expect(p.openclawDir.startsWith(p.home)).toBe(true);
    });
  });

  describe("installHint", () => {
    it("returns brew command for macOS", () => {
      const hint = installHint("macos");
      expect(hint).toBe("brew install node");
    });

    it("returns curl/nodesource command for Linux", () => {
      const hint = installHint("linux");
      expect(hint).toContain("curl");
      expect(hint).toContain("deb.nodesource.com");
      expect(hint).toContain("apt-get install");
    });

    it("returns winget command for Windows", () => {
      const hint = installHint("windows");
      expect(hint).toBe("winget install OpenJS.NodeJS.LTS");
    });

    it("returns nodejs.org fallback for unknown platform", () => {
      const hint = installHint("unknown");
      expect(hint).toContain("https://nodejs.org");
      expect(hint).toContain("Node.js");
    });

    it("Linux hint includes sudo", () => {
      const hint = installHint("linux");
      expect(hint).toContain("sudo");
    });

    it("all hints return non-empty strings", () => {
      const platforms = ["macos", "linux", "windows", "unknown"] as const;
      for (const p of platforms) {
        const hint = installHint(p);
        expect(hint.length).toBeGreaterThan(0);
        expect(typeof hint).toBe("string");
      }
    });
  });
});
