import * as p from "@clack/prompts";
import { detectPlatform, installHint } from "../lib/platform.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const MIN_NODE_MAJOR = 18;

export async function checkNode(ctx: SetupContext): Promise<void> {
  const raw = process.version;
  const major = parseInt(raw.replace("v", "").split(".")[0], 10);

  if (isNaN(major)) {
    p.log.error("Could not determine Node.js version.");
    logger.error(`Invalid Node.js version: ${raw}`);
    process.exit(1);
  }

  ctx.nodeVersion = raw;

  if (major < MIN_NODE_MAJOR) {
    const platform = detectPlatform();
    p.log.error(
      `Node.js ${raw} is too old. Minimum required: v${MIN_NODE_MAJOR}.`,
    );
    p.log.info(`Install a newer version:\n  ${installHint(platform.platform)}`);
    logger.error(`Node.js version ${raw} below minimum ${MIN_NODE_MAJOR}`);
    process.exit(1);
  }

  p.log.success(`Node.js ${raw} found`);
  logger.info(`Node.js ${raw} OK`);
}
