import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, cpSync, rmSync } from "node:fs";
import { paths } from "../lib/platform.js";
import { runShell } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import { initCommand } from "./init.js";

export async function resetCommand(): Promise<void> {
  p.intro(pc.bold("oc-setup reset"));

  p.log.warn(
    "This will back up your current config and start fresh.",
  );

  const confirmed = await p.confirm({
    message: "Are you sure you want to reset everything?",
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Reset cancelled.");
    return;
  }

  const { openclawDir } = paths();
  logger.info("Starting reset");

  // Stop gateway first
  const s = p.spinner();
  s.start("Stopping gateway...");
  await runShell("openclaw gateway stop 2>/dev/null; true");
  s.stop("Gateway stopped");

  // Backup existing config
  if (existsSync(openclawDir)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = `${openclawDir}-backup-${timestamp}`;

    const backup = p.spinner();
    backup.start("Backing up current config...");

    let backupOk = false;
    try {
      cpSync(openclawDir, backupDir, { recursive: true });
      backupOk = true;
      backup.stop(`Backed up to ${backupDir}`);
      logger.info(`Config backed up to ${backupDir}`);
    } catch (err) {
      backup.stop("Backup failed — aborting reset to protect your config");
      logger.error(`Backup failed: ${err}`);
      p.log.error("Cannot reset without a successful backup.");
      return;
    }

    if (backupOk) {
      try {
        rmSync(openclawDir, { recursive: true, force: true });
      } catch (err) {
        logger.warn(`Could not remove config dir: ${err}`);
      }
    }
  }

  p.log.success("Old config removed. Starting fresh setup...\n");

  // Re-run init
  await initCommand();
}
