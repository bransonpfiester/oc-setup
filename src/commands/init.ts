import * as p from "@clack/prompts";
import pc from "picocolors";
import { createContext, type SetupContext } from "../steps/context.js";
import { detectOS } from "../steps/detect-os.js";
import { checkNode } from "../steps/install-node.js";
import { installOpenClaw } from "../steps/install-openclaw.js";
import { collectTelegramInputs, configureTelegram } from "../steps/setup-telegram.js";
import { setupModel } from "../steps/setup-model.js";
import { setupPersonality } from "../steps/setup-personality.js";
import { setupGateway } from "../steps/setup-gateway.js";
import { setupService } from "../steps/setup-service.js";
import { installClawHub } from "../steps/install-clawhub.js";
import { verify } from "../steps/verify.js";
import { getPreset } from "../lib/templates.js";
import { MODEL_PROVIDERS } from "../lib/models.js";
import { logger } from "../utils/logger.js";

const BANNER = `
  ${pc.cyan("██████╗  ██████╗")}    ${pc.green("███████╗███████╗████████╗██╗   ██╗██████╗")}
 ${pc.cyan("██╔═══██╗██╔════╝")}    ${pc.green("██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗")}
 ${pc.cyan("██║   ██║██║")}         ${pc.green("███████╗█████╗     ██║   ██║   ██║██████╔╝")}
 ${pc.cyan("██║   ██║██║")}         ${pc.green("╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝")}
 ${pc.cyan("╚██████╔╝╚██████╗")}    ${pc.green("███████║███████╗   ██║   ╚██████╔╝██║")}
  ${pc.cyan("╚═════╝  ╚═════╝")}    ${pc.green("╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝")}
`;

interface ConfigPayload {
  name?: string;
  userId?: string;
  token?: string;
  provider?: string;
  apiKey?: string;
  modelId?: string;
  preset?: string;
  skills?: string[];
}

function decodeConfig(payload: string): ConfigPayload | null {
  try {
    const json = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(json) as ConfigPayload;
  } catch {
    return null;
  }
}

function applyConfig(ctx: SetupContext, cfg: ConfigPayload): void {
  if (cfg.name) {
    ctx.userName = cfg.name;
    ctx.agentName = cfg.name;
  }

  if (cfg.userId) {
    ctx.telegramUserId = cfg.userId;
  }

  if (cfg.token) {
    ctx.telegram = { token: cfg.token, botUsername: "" };
  }

  if (cfg.provider && cfg.apiKey) {
    const providerInfo = MODEL_PROVIDERS.find((m) => m.provider === cfg.provider);
    ctx.model = {
      provider: cfg.provider,
      apiKey: cfg.apiKey,
      modelId: cfg.modelId ?? providerInfo?.defaultModel ?? "",
    };
  }

  if (cfg.skills && cfg.skills.length > 0) {
    ctx.skills = cfg.skills;
  }

  if (cfg.preset) {
    const preset = getPreset(cfg.preset);
    if (preset) {
      ctx.personality.description = preset.description;
      ctx.personality.focusAreas = preset.focusAreas;
    }
  }
}

export async function initCommand(configPayload?: string): Promise<void> {
  console.log(BANNER);
  p.intro(pc.bold("Welcome to OpenClaw Setup! Let's get your AI agent running."));

  logger.info("Starting oc-setup init");
  const ctx = createContext();

  if (configPayload) {
    const cfg = decodeConfig(configPayload);
    if (cfg) {
      p.log.success("Using pre-filled configuration from --config");
      logger.info("Config payload decoded successfully");
      applyConfig(ctx, cfg);
    } else {
      p.log.warn("Could not decode --config payload. Falling back to interactive setup.");
      logger.warn("Failed to decode config payload");
    }
  }

  const steps: { name: string; fn: () => Promise<void> }[] = [
    // Phase 1: Prerequisites
    { name: "OS Detection", fn: () => detectOS(ctx) },
    { name: "Node.js Check", fn: () => checkNode(ctx) },
    { name: "OpenClaw Install", fn: () => installOpenClaw(ctx) },

    // Phase 2: Collect all user inputs
    { name: "Telegram Credentials", fn: () => collectTelegramInputs(ctx) },
    { name: "AI Model", fn: () => setupModel(ctx) },
    { name: "Agent Personality", fn: () => setupPersonality(ctx) },

    // Phase 3: Run OpenClaw onboarding (bootstraps gateway, workspace, daemon)
    { name: "OpenClaw Onboarding", fn: () => setupGateway(ctx) },

    // Phase 4: Configure Telegram AFTER onboarding (writes allowFrom, restarts gateway)
    { name: "Telegram Channel", fn: () => configureTelegram(ctx) },

    // Phase 5: Post-setup
    { name: "ClawHub + Skills", fn: () => installClawHub(ctx) },
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
