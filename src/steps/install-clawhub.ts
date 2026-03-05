import * as p from "@clack/prompts";
import { run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function installClawHub(ctx: SetupContext): Promise<void> {
  const versionResult = await run("clawhub", ["--version"]);

  if (versionResult.exitCode === 0 && versionResult.stdout) {
    p.log.success(`ClawHub ${versionResult.stdout.trim()} found`);
    logger.info(`ClawHub already installed: ${versionResult.stdout.trim()}`);
  } else {
    const s = p.spinner();
    s.start("Installing ClawHub...");

    const installResult = await run("npm", ["install", "-g", "clawhub"], {
      timeout: 120_000,
    });

    if (installResult.exitCode !== 0) {
      s.stop("ClawHub installation failed");
      p.log.warn("Could not install ClawHub automatically.");
      p.log.info("Install manually later: npm install -g clawhub");
      logger.warn(`ClawHub install failed: ${installResult.stderr}`);
      return;
    }

    s.stop("ClawHub installed");
    logger.info("ClawHub installed successfully");
  }

  if (ctx.skills.length > 0) {
    await installSkills(ctx.skills);
  }
}

async function installSkills(skills: string[]): Promise<void> {
  const s = p.spinner();
  s.start(`Installing ${skills.length} skill${skills.length > 1 ? "s" : ""}...`);

  const results: { name: string; ok: boolean }[] = [];

  for (const skill of skills) {
    const result = await run("clawhub", ["install", skill], {
      timeout: 60_000,
    });
    results.push({ name: skill, ok: result.exitCode === 0 });
  }

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  if (failed.length === 0) {
    s.stop(`${succeeded.length} skill${succeeded.length > 1 ? "s" : ""} installed`);
  } else {
    s.stop(`${succeeded.length} installed, ${failed.length} failed`);
    for (const f of failed) {
      p.log.warn(`  Could not install: ${f.name}`);
    }
    p.log.info("Install failed skills manually: clawhub install <name>");
  }

  logger.info(
    `Skills installed: ${succeeded.map((r) => r.name).join(", ")}` +
      (failed.length > 0
        ? ` | Failed: ${failed.map((r) => r.name).join(", ")}`
        : ""),
  );
}
