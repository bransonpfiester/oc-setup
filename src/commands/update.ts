import * as p from "@clack/prompts";
import pc from "picocolors";
import { run, runShell } from "../utils/exec.js";
import { logger } from "../utils/logger.js";

export async function updateCommand(): Promise<void> {
  p.intro(pc.bold("oc-setup update"));
  logger.info("Starting update");

  const currentVersion = await run("openclaw", ["--version"]);
  if (currentVersion.exitCode === 0) {
    p.log.info(`Current version: ${currentVersion.stdout}`);
  }

  const s = p.spinner();
  s.start("Updating OpenClaw...");

  const result = await run("npm", ["update", "-g", "openclaw"], {
    timeout: 120_000,
  });

  if (result.exitCode !== 0) {
    s.stop("Update failed");
    p.log.error(`Update failed:\n${result.stderr}`);
    logger.error(`Update failed: ${result.stderr}`);
    process.exit(1);
  }

  const newVersion = await run("openclaw", ["--version"]);
  s.stop(
    `Updated to ${newVersion.exitCode === 0 ? newVersion.stdout : "latest"}`,
  );

  // Restart gateway
  const restart = p.spinner();
  restart.start("Restarting gateway...");

  const gwResult = await runShell("openclaw gateway restart", {
    timeout: 15_000,
  });

  if (gwResult.exitCode === 0) {
    restart.stop("Gateway restarted");
  } else {
    restart.stop("Gateway restart skipped (not running or failed)");
    p.log.info("Start manually if needed: openclaw gateway start");
  }

  p.outro(pc.green("Update complete!"));
  logger.info("Update completed successfully");
}
