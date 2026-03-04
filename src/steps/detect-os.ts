import * as p from "@clack/prompts";
import { detectPlatform } from "../lib/platform.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function detectOS(ctx: SetupContext): Promise<void> {
  const info = detectPlatform();
  ctx.os = {
    platform: info.platform,
    arch: info.arch,
    display: info.display,
  };

  logger.info(`Detected OS: ${info.display}`);
  p.log.success(`Detected: ${info.display}`);

  if (info.platform === "unknown") {
    p.log.warn(
      "Your platform is not officially supported. Things may not work as expected.",
    );
  }
}
