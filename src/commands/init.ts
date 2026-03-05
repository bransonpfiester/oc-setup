import * as p from "@clack/prompts";
import pc from "picocolors";
import { createContext, type SetupContext, type Channel } from "../steps/context.js";
import { detectOS } from "../steps/detect-os.js";
import { checkNode } from "../steps/install-node.js";
import { installOpenClaw } from "../steps/install-openclaw.js";
import { collectChannelInputs, configureChannel } from "../steps/setup-channel.js";
import { setupModel } from "../steps/setup-model.js";
import { setupPersonality } from "../steps/setup-personality.js";
import { setupGateway } from "../steps/setup-gateway.js";
import { setupDirect } from "../steps/setup-direct.js";
import { setupService } from "../steps/setup-service.js";
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
  channel?: string;
  userId?: string;
  token?: string;
  provider?: string;
  apiKey?: string;
  modelId?: string;
  authMethod?: string;
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

  if (cfg.channel) {
    ctx.channel = cfg.channel as Channel;
  }

  if (cfg.userId) {
    ctx.telegramUserId = cfg.userId;
  }

  if (cfg.token && (cfg.channel === "telegram" || !cfg.channel)) {
    ctx.telegram = { token: cfg.token, botUsername: "" };
  }

  if (cfg.token && cfg.channel === "discord") {
    ctx.discord = { token: cfg.token };
  }

  const method = cfg.authMethod || "api-key";
  if (cfg.provider && (cfg.apiKey || method !== "api-key")) {
    const providerInfo = MODEL_PROVIDERS.find((m) => m.provider === cfg.provider);
    ctx.model = {
      provider: cfg.provider,
      apiKey: cfg.apiKey || "",
      modelId: cfg.modelId ?? providerInfo?.defaultModel ?? "",
      authMethod: method,
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

export async function initCommand(configPayload?: string, demoMode?: boolean): Promise<void> {
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

  if (demoMode) {
    p.log.info("Demo mode: skipping onboarding wizard, writing config directly.");
  }

  const steps: { name: string; fn: () => Promise<void> }[] = [
    // Phase 1: Prerequisites
    { name: "OS Detection", fn: () => detectOS(ctx) },
    { name: "Node.js Check", fn: () => checkNode(ctx) },
    { name: "OpenClaw Install", fn: () => installOpenClaw(ctx) },

    // Phase 2: Collect all user inputs
    { name: "Channel Setup", fn: () => collectChannelInputs(ctx) },
    { name: "AI Model", fn: () => setupModel(ctx) },
    { name: "Agent Personality", fn: () => setupPersonality(ctx) },

    // Phase 3: Configure gateway
    ...(demoMode
      ? [{ name: "Direct Setup", fn: () => setupDirect(ctx) }]
      : [
          { name: "OpenClaw Onboarding", fn: () => setupGateway(ctx) },
          { name: "Channel Config", fn: () => configureChannel(ctx) },
        ]
    ),

    // Phase 4: Post-setup
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

  const channelHint = getChannelHint(ctx);

  console.log("");
  console.log(pc.bold(pc.green("══════════════════════════════════════════")));
  console.log(pc.bold(pc.green(" Your AI agent is LIVE!")));
  console.log("");
  console.log(pc.bold(` ${channelHint}`));
  console.log("");
  console.log(pc.dim(" Useful commands:"));
  console.log(pc.dim("   openclaw status          — check everything's running"));
  console.log(pc.dim("   openclaw gateway restart  — restart if issues"));
  console.log(pc.dim("   setupclaw doctor          — diagnose problems"));
  console.log("");
  console.log(pc.dim(` Dashboard: http://localhost:${ctx.gatewayPort}`));
  console.log(pc.bold(pc.green("══════════════════════════════════════════")));
  console.log("");

  p.outro("Setup complete!");
  logger.info("Setup completed successfully");
}

function getChannelHint(ctx: SetupContext): string {
  switch (ctx.channel) {
    case "telegram":
      return ctx.telegram
        ? `Send a message to @${ctx.telegram.botUsername} on Telegram.`
        : "Send a message to your bot on Telegram.";
    case "whatsapp":
      return "Send a message to your linked WhatsApp number.";
    case "discord":
      return "Send a message to your bot in Discord.";
    case "signal":
      return "Send a message to your agent on Signal.";
    case "imessage":
      return "Send a message via iMessage.";
    case "googlechat":
      return "Send a message in Google Chat.";
    case "mattermost":
      return "Send a message to your bot in Mattermost.";
    case "webchat":
      return `Open http://localhost:${ctx.gatewayPort} in your browser.`;
    default:
      return "Your agent is ready.";
  }
}
