import { homedir } from "node:os";
import { join } from "node:path";

export type Platform = "macos" | "linux" | "windows" | "unknown";
export type Arch = "arm64" | "x64" | "unknown";
export type ServiceManager = "launchd" | "systemd" | "task-scheduler" | "none";

export interface PlatformInfo {
  platform: Platform;
  arch: Arch;
  display: string;
  serviceManager: ServiceManager;
}

export function detectPlatform(): PlatformInfo {
  const p = process.platform;
  const a = process.arch;

  const arch: Arch = a === "arm64" ? "arm64" : a === "x64" ? "x64" : "unknown";

  if (p === "darwin") {
    return {
      platform: "macos",
      arch,
      display: `macOS (${arch})`,
      serviceManager: "launchd",
    };
  }
  if (p === "linux") {
    return {
      platform: "linux",
      arch,
      display: `Linux (${arch})`,
      serviceManager: "systemd",
    };
  }
  if (p === "win32") {
    return {
      platform: "windows",
      arch,
      display: `Windows (${arch})`,
      serviceManager: "task-scheduler",
    };
  }
  return {
    platform: "unknown",
    arch,
    display: `${p} (${arch})`,
    serviceManager: "none",
  };
}

export function paths() {
  const home = homedir();
  const openclawDir = join(home, ".openclaw");

  return {
    home,
    openclawDir,
    configFile: join(openclawDir, "config.json"),
    logsDir: join(openclawDir, "logs"),
    soulFile: join(openclawDir, "SOUL.md"),
    userFile: join(openclawDir, "USER.md"),
    heartbeatFile: join(openclawDir, "HEARTBEAT.md"),
    launchdPlist: join(
      home,
      "Library",
      "LaunchAgents",
      "com.openclaw.gateway.plist",
    ),
    systemdUnit: join(
      home,
      ".config",
      "systemd",
      "user",
      "openclaw-gateway.service",
    ),
  };
}

export function installHint(platform: Platform): string {
  switch (platform) {
    case "macos":
      return "brew install node";
    case "linux":
      return "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs";
    case "windows":
      return "winget install OpenJS.NodeJS.LTS";
    default:
      return "Visit https://nodejs.org to install Node.js";
  }
}
