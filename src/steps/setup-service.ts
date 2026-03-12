import * as p from "@clack/prompts";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { detectPlatform, paths } from "../lib/platform.js";
import { runShell } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

async function findOpenClawPath(): Promise<string> {
  try {
    const { runShell: shell } = await import("../utils/exec.js");
    const { stdout } = await shell("which openclaw");
    const resolved = stdout.trim();
    if (resolved) return resolved;
  } catch {}
  return "/usr/local/bin/openclaw";
}

function generatePlist(port: number, binPath: string): string {
  const logPath = join(paths().logsDir, "gateway.log");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.openclaw.gateway</string>
  <key>ProgramArguments</key>
  <array>
    <string>${binPath}</string>
    <string>gateway</string>
    <string>start</string>
    <string>--port</string>
    <string>${port}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
</dict>
</plist>`;
}

function generateSystemdUnit(port: number, binPath: string): string {
  return `[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
ExecStart=${binPath} gateway start --port ${port}
Restart=always
RestartSec=5

[Install]
WantedBy=default.target`;
}

export async function setupService(ctx: SetupContext): Promise<void> {
  const platform = detectPlatform();
  const p_ = paths();

  const s = p.spinner();
  s.start("Configuring auto-start...");

  const binPath = await findOpenClawPath();

  try {
    if (platform.serviceManager === "launchd") {
      const plistPath = p_.launchdPlist;
      mkdirSync(dirname(plistPath), { recursive: true });
      mkdirSync(p_.logsDir, { recursive: true });
      writeFileSync(plistPath, generatePlist(ctx.gatewayPort, binPath), "utf-8");

      await runShell(`launchctl unload "${plistPath}" 2>/dev/null; true`);
      const result = await runShell(`launchctl load "${plistPath}"`);

      if (result.exitCode !== 0) {
        s.stop("Auto-start configuration failed");
        p.log.warn(`Could not load launch agent: ${result.stderr}`);
        logger.warn(`launchctl load failed: ${result.stderr}`);
        return;
      }

      s.stop("Auto-start configured (launchd)");
      logger.info("launchd plist installed and loaded");
    } else if (platform.serviceManager === "systemd") {
      const unitPath = p_.systemdUnit;
      mkdirSync(dirname(unitPath), { recursive: true });
      writeFileSync(unitPath, generateSystemdUnit(ctx.gatewayPort, binPath), "utf-8");

      await runShell("systemctl --user daemon-reload");
      const result = await runShell(
        "systemctl --user enable openclaw-gateway.service",
      );

      if (result.exitCode !== 0) {
        s.stop("Auto-start configuration failed");
        p.log.warn(`Could not enable systemd service: ${result.stderr}`);
        logger.warn(`systemd enable failed: ${result.stderr}`);
        return;
      }

      s.stop("Auto-start configured (systemd)");
      logger.info("systemd unit installed and enabled");
    } else {
      s.stop("Auto-start not available");
      p.log.info(
        "Auto-start is not supported on your platform yet. Start the gateway manually.",
      );
      logger.info(`No service manager for platform: ${platform.platform}`);
    }
  } catch (err) {
    s.stop("Auto-start configuration failed");
    p.log.warn(`Could not configure auto-start: ${err}`);
    logger.error(`Service setup error: ${err}`);
  }
}
