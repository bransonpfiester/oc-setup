import * as p from "@clack/prompts";
import { writeConfig } from "../lib/config.js";
import { runShell } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";
import { createServer } from "node:net";

const DEFAULT_PORT = 18789;

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export async function setupGateway(ctx: SetupContext): Promise<void> {
  let port = DEFAULT_PORT;

  const available = await isPortAvailable(port);
  if (!available) {
    p.log.warn(`Port ${port} is already in use.`);
    const newPort = await p.text({
      message: "Enter an alternative port:",
      placeholder: "18790",
      validate(value) {
        const n = parseInt(value, 10);
        if (isNaN(n) || n < 1024 || n > 65535)
          return "Enter a valid port between 1024 and 65535";
      },
    });
    if (p.isCancel(newPort)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    port = parseInt(newPort, 10);
  }

  ctx.gatewayPort = port;

  writeConfig({ gateway: { port } });

  const s = p.spinner();
  s.start("Starting gateway service...");

  const result = await runShell(
    `openclaw gateway start --port ${port}`,
    { timeout: 30_000 },
  );

  if (result.exitCode !== 0) {
    s.stop("Gateway start failed");
    p.log.error(`Gateway failed to start:\n${result.stderr}`);
    p.log.info("You can start it manually: openclaw gateway start");
    logger.error(`Gateway start failed: ${result.stderr}`);
    return;
  }

  const pidMatch = result.stdout.match(/pid[:\s]+(\d+)/i);
  if (pidMatch) {
    ctx.gatewayPid = parseInt(pidMatch[1], 10);
  }

  s.stop(`Gateway running on port ${port}`);
  logger.info(`Gateway started on port ${port}`);
}
