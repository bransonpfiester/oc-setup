import * as p from "@clack/prompts";
import { run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function installOpenClaw(ctx: SetupContext): Promise<void> {
  const versionResult = await run("openclaw", ["--version"]);

  if (versionResult.exitCode === 0 && versionResult.stdout) {
    const currentVersion = versionResult.stdout.trim();
    ctx.openclawVersion = currentVersion;
    p.log.success(`OpenClaw ${currentVersion} found`);
    logger.info(`OpenClaw installed: ${currentVersion}`);

    await checkForUpdate(ctx, currentVersion);
    return;
  }

  p.log.warn("OpenClaw not installed");

  const s = p.spinner();
  s.start("Installing openclaw globally...");

  const installResult = await run("npm", ["install", "-g", "openclaw"], {
    timeout: 120_000,
  });

  if (installResult.exitCode !== 0) {
    s.stop("Installation failed");
    p.log.error(`Failed to install OpenClaw:\n${installResult.stderr}`);
    logger.error(`OpenClaw install failed: ${installResult.stderr}`);
    p.log.info("Try running manually: npm install -g openclaw");
    process.exit(1);
  }

  const checkVersion = await run("openclaw", ["--version"]);
  ctx.openclawVersion = checkVersion.stdout.trim() || "installed";

  s.stop(`OpenClaw ${ctx.openclawVersion} installed`);
  logger.info(`OpenClaw installed: ${ctx.openclawVersion}`);
}

async function checkForUpdate(
  ctx: SetupContext,
  currentVersion: string,
): Promise<void> {
  const s = p.spinner();
  s.start("Checking for updates...");

  const latestResult = await run("npm", ["view", "openclaw", "version"], {
    timeout: 10_000,
  });

  if (latestResult.exitCode !== 0 || !latestResult.stdout.trim()) {
    s.stop("Could not check for updates");
    logger.warn(`npm view failed: ${latestResult.stderr}`);
    return;
  }

  const latestVersion = latestResult.stdout.trim();

  if (normalizeVersion(latestVersion) === normalizeVersion(currentVersion)) {
    s.stop(`OpenClaw ${currentVersion} is up to date`);
    return;
  }

  s.stop(`Update available: ${currentVersion} → ${latestVersion}`);

  const updateSpinner = p.spinner();
  updateSpinner.start(`Updating OpenClaw to ${latestVersion}...`);

  const updateResult = await run("npm", ["install", "-g", "openclaw@latest"], {
    timeout: 120_000,
  });

  if (updateResult.exitCode !== 0) {
    updateSpinner.stop("Update failed");
    p.log.warn(
      `Could not update automatically. Run manually: npm install -g openclaw@latest`,
    );
    logger.warn(`OpenClaw update failed: ${updateResult.stderr}`);
    return;
  }

  const newVersion = await run("openclaw", ["--version"]);
  ctx.openclawVersion = newVersion.stdout.trim() || latestVersion;

  updateSpinner.stop(`OpenClaw updated to ${ctx.openclawVersion}`);
  logger.info(`OpenClaw updated: ${currentVersion} → ${ctx.openclawVersion}`);
}

function normalizeVersion(v: string): string {
  return v.replace(/^v/, "").trim();
}
