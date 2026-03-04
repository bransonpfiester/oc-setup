import * as p from "@clack/prompts";
import pc from "picocolors";
import { createContext } from "../steps/context.js";
import { detectOS } from "../steps/detect-os.js";
import { checkNode } from "../steps/install-node.js";
import { installOpenClaw } from "../steps/install-openclaw.js";
import { setupTelegram } from "../steps/setup-telegram.js";
import { setupModel } from "../steps/setup-model.js";
import { setupPersonality } from "../steps/setup-personality.js";
import { setupGateway } from "../steps/setup-gateway.js";
import { setupService } from "../steps/setup-service.js";
import { verify } from "../steps/verify.js";
import { logger } from "../utils/logger.js";

const BANNER = `
  ${pc.cyan("██████╗  ██████╗")}    ${pc.green("███████╗███████╗████████╗██╗   ██╗██████╗")}
 ${pc.cyan("██╔═══██╗██╔════╝")}    ${pc.green("██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗")}
 ${pc.cyan("██║   ██║██║")}         ${pc.green("███████╗█████╗     ██║   ██║   ██║██████╔╝")}
 ${pc.cyan("██║   ██║██║")}         ${pc.green("╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝")}
 ${pc.cyan("╚██████╔╝╚██████╗")}    ${pc.green("███████║███████╗   ██║   ╚██████╔╝██║")}
  ${pc.cyan("╚═════╝  ╚═════╝")}    ${pc.green("╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝")}
`;

export async function initCommand(): Promise<void> {
  console.log(BANNER);
  p.intro(pc.bold("Welcome to OpenClaw Setup! Let's get your AI agent running."));

  logger.info("Starting oc-setup init");
  const ctx = createContext();

  const steps: { name: string; fn: () => Promise<void> }[] = [
    { name: "OS Detection", fn: () => detectOS(ctx) },
    { name: "Node.js Check", fn: () => checkNode(ctx) },
    { name: "OpenClaw Install", fn: () => installOpenClaw(ctx) },
    { name: "Telegram Setup", fn: () => setupTelegram(ctx) },
    { name: "AI Model", fn: () => setupModel(ctx) },
    { name: "Agent Personality", fn: () => setupPersonality(ctx) },
    { name: "Gateway", fn: () => setupGateway(ctx) },
    { name: "Auto-Start", fn: () => setupService(ctx) },
    { name: "Verification", fn: () => verify(ctx) },
  ];

  for (const step of steps) {
    try {
      await step.fn();
    } catch (err) {
      logger.error(`Step "${step.name}" failed: ${err}`);
      p.log.error(`Step "${step.name}" failed: ${err}`);
      p.log.info("You can re-run oc-setup to resume where you left off.");
      process.exit(1);
    }
  }

  const botHandle = ctx.telegram
    ? `@${ctx.telegram.botUsername}`
    : "your bot";

  console.log("");
  console.log(pc.bold(pc.green("══════════════════════════════════════════")));
  console.log(pc.bold(pc.green(" Your AI agent is LIVE!")));
  console.log("");
  console.log(pc.bold(` Send a message to ${botHandle} on Telegram.`));
  console.log("");
  console.log(pc.dim(" Useful commands:"));
  console.log(pc.dim("   openclaw status          — check everything's running"));
  console.log(pc.dim("   openclaw gateway restart  — restart if issues"));
  console.log(pc.dim("   oc-setup doctor           — diagnose problems"));
  console.log("");
  console.log(pc.dim(` Dashboard: http://localhost:${ctx.gatewayPort}`));
  console.log(pc.bold(pc.green("══════════════════════════════════════════")));
  console.log("");

  p.outro("Setup complete!");
  logger.info("Setup completed successfully");
}
