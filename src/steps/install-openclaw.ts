import * as p from "@clack/prompts";
import { run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function installOpenClaw(ctx: SetupContext): Promise<void> {
  const versionResult = await run("openclaw", ["--version"]);

  if (versionResult.exitCode === 0 && versionResult.stdout) {
    ctx.openclawVersion = versionResult.stdout.trim();
    p.log.success(`OpenClaw ${ctx.openclawVersion} found`);
    logger.info(`OpenClaw already installed: ${ctx.openclawVersion}`);
    return;
  }

  p.log.warn("OpenClaw not installed");

  const shouldInstall = await p.confirm({
    message: "Install OpenClaw now?",
    initialValue: true,
  });

  if (p.isCancel(shouldInstall) || !shouldInstall) {
    p.cancel("OpenClaw is required. Exiting.");
    process.exit(0);
  }

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
