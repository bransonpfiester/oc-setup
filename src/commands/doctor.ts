import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, statfsSync } from "node:fs";
import { run, runShell } from "../utils/exec.js";
import { readConfig } from "../lib/config.js";
import { validateToken } from "../lib/telegram.js";
import { validateApiKey, type ModelProvider } from "../lib/models.js";
import { detectPlatform, paths } from "../lib/platform.js";
import { logger } from "../utils/logger.js";

interface HealthCheck {
  label: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export async function doctorCommand(): Promise<void> {
  p.intro(pc.bold("oc-setup doctor"));
  logger.info("Running diagnostics");

  const checks: HealthCheck[] = [];

  // Node.js version
  const major = parseInt(process.version.replace("v", "").split(".")[0], 10);
  checks.push({
    label: "Node.js",
    ok: major >= 18,
    detail: `${process.version} ${major >= 18 ? "(OK)" : "(too old)"}`,
    fix:
      major < 18
        ? `Install Node.js 18+: ${detectPlatform().platform === "macos" ? "brew install node" : "https://nodejs.org"}`
        : undefined,
  });

  // OpenClaw installed
  const ocVersion = await run("openclaw", ["--version"]);
  checks.push({
    label: "OpenClaw",
    ok: ocVersion.exitCode === 0,
    detail:
      ocVersion.exitCode === 0
        ? `${ocVersion.stdout} (OK)`
        : "NOT INSTALLED",
    fix:
      ocVersion.exitCode !== 0 ? "npm install -g openclaw" : undefined,
  });

  // Gateway running
  const gwStatus = await runShell("openclaw gateway status 2>/dev/null");
  const gwRunning =
    gwStatus.exitCode === 0 &&
    gwStatus.stdout.toLowerCase().includes("running");
  checks.push({
    label: "Gateway",
    ok: gwRunning,
    detail: gwRunning ? "running (OK)" : "NOT RUNNING",
    fix: !gwRunning ? "openclaw gateway start" : undefined,
  });

  // Config file
  const { configFile } = paths();
  const configExists = existsSync(configFile);
  checks.push({
    label: "Config",
    ok: configExists,
    detail: configExists ? "found (OK)" : "NOT FOUND",
    fix: !configExists ? "Run: npx oc-setup" : undefined,
  });

  // Telegram
  const config = readConfig();
  if (config.telegram?.token) {
    const s = p.spinner();
    s.start("Checking Telegram...");
    const botInfo = await validateToken(config.telegram.token);
    s.stop(botInfo ? "Telegram OK" : "Telegram check failed");
    checks.push({
      label: "Telegram",
      ok: !!botInfo,
      detail: botInfo
        ? `connected (@${botInfo.username})`
        : "token invalid or expired",
      fix: !botInfo
        ? 'Update token: openclaw config set telegram.token "NEW_TOKEN"'
        : undefined,
    });
  } else {
    checks.push({
      label: "Telegram",
      ok: false,
      detail: "not configured",
      fix: "Run: npx oc-setup",
    });
  }

  // API key
  if (config.model?.provider && config.model?.apiKey) {
    const s = p.spinner();
    s.start("Checking API key...");
    const valid = await validateApiKey(
      config.model.provider as ModelProvider,
      config.model.apiKey,
    );
    s.stop(valid ? "API key OK" : "API key check failed");
    checks.push({
      label: "API key",
      ok: valid,
      detail: valid
        ? `${config.model.provider} (OK)`
        : "expired or invalid",
      fix: !valid
        ? `Update key: openclaw config set model.apiKey "NEW_KEY"`
        : undefined,
    });
  } else {
    checks.push({
      label: "API key",
      ok: false,
      detail: "not configured",
      fix: "Run: npx oc-setup",
    });
  }

  // Disk space
  try {
    const stats = statfsSync(paths().openclawDir);
    const freeGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
    checks.push({
      label: "Disk",
      ok: freeGB > 1,
      detail: `${freeGB.toFixed(0)}GB free ${freeGB > 1 ? "(OK)" : "(LOW)"}`,
      fix: freeGB <= 1 ? "Free up disk space" : undefined,
    });
  } catch {
    checks.push({
      label: "Disk",
      ok: true,
      detail: "could not check",
    });
  }

  // Service installed
  const platform = detectPlatform();
  const p_ = paths();
  if (platform.serviceManager === "launchd") {
    const installed = existsSync(p_.launchdPlist);
    checks.push({
      label: "Auto-start",
      ok: installed,
      detail: installed ? "launchd (OK)" : "not installed",
      fix: !installed ? "Run: npx oc-setup" : undefined,
    });
  } else if (platform.serviceManager === "systemd") {
    const installed = existsSync(p_.systemdUnit);
    checks.push({
      label: "Auto-start",
      ok: installed,
      detail: installed ? "systemd (OK)" : "not installed",
      fix: !installed ? "Run: npx oc-setup" : undefined,
    });
  }

  // Print results
  console.log("");
  for (const check of checks) {
    const icon = check.ok ? pc.green("\u2713") : pc.red("\u2717");
    const label = check.label.padEnd(12);
    console.log(` ${icon} ${pc.bold(label)} ${check.detail}`);
    if (check.fix) {
      console.log(`   ${pc.dim("\u2192 Fix:")} ${pc.yellow(check.fix)}`);
    }
  }
  console.log("");

  const critical = checks.filter((c) => !c.ok);
  if (critical.length === 0) {
    p.outro(pc.green("All checks passed!"));
  } else {
    p.outro(
      pc.yellow(
        `${critical.length} issue${critical.length > 1 ? "s" : ""} found. Run the suggested fixes above.`,
      ),
    );
  }

  logger.info(
    `Doctor completed: ${checks.filter((c) => c.ok).length}/${checks.length} passed`,
  );
}
