import * as p from "@clack/prompts";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runShell, runInteractive } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const OC_DIR = join(homedir(), ".openclaw");
const OC_CONFIG = join(OC_DIR, "openclaw.json");
const AGENT_DIR = join(OC_DIR, "agents", "main", "agent");
const AGENT_DIR_LEGACY = join(OC_DIR, "agent");
const AUTH_FILE = join(AGENT_DIR, "auth-profiles.json");
const AUTH_FILE_LEGACY = join(AGENT_DIR_LEGACY, "auth-profiles.json");
const WORKSPACE = join(OC_DIR, "workspace");

export async function setupDirect(ctx: SetupContext): Promise<void> {
  const s = p.spinner();

  s.start("Writing OpenClaw configuration...");
  writeFullConfig(ctx);
  s.stop("Configuration written");

  s.start("Saving API credentials...");
  writeAuth(ctx);
  s.stop("Credentials saved");

  s.start("Initializing workspace...");
  mkdirSync(WORKSPACE, { recursive: true });
  s.stop("Workspace ready");

  s.start("Installing gateway service...");
  await runShell("openclaw gateway install 2>&1", { timeout: 30_000 });
  s.stop("Gateway service installed");

  s.start("Starting gateway...");
  const startResult = await runShell("openclaw gateway start 2>&1", { timeout: 30_000 });
  if (startResult.exitCode !== 0) {
    await runInteractive("openclaw", ["gateway"]);
  }
  s.stop("Gateway started");

  logger.info("Direct setup complete");
}

function writeFullConfig(ctx: SetupContext): void {
  mkdirSync(OC_DIR, { recursive: true });

  let ocConfig: Record<string, unknown> = {};
  if (existsSync(OC_CONFIG)) {
    try { ocConfig = JSON.parse(readFileSync(OC_CONFIG, "utf-8")); } catch { ocConfig = {}; }
  }

  const providerName = ctx.model ? getProviderName(ctx.model.provider) : "anthropic";
  const modelId = ctx.model?.modelId || "claude-sonnet-4-6";

  const existingAgents = (ocConfig.agents as Record<string, unknown>) ?? {};
  ocConfig.agents = {
    ...existingAgents,
    defaults: {
      workspace: WORKSPACE,
      model: `${providerName}/${modelId}`,
    },
  };

  ocConfig.tools = { profile: "messaging" };
  ocConfig.session = { dmScope: "per-channel-peer" };
  ocConfig.commands = { native: "auto", nativeSkills: "auto", restart: true, ownerDisplay: "raw" };
  ocConfig.hooks = { internal: { enabled: true, entries: { "session-memory": { enabled: true } } } };

  ocConfig.gateway = {
    port: ctx.gatewayPort,
    mode: "local",
    bind: "loopback",
    auth: {
      mode: "token",
      token: generateToken(),
    },
    tailscale: { mode: "off", resetOnExit: false },
  };

  if (ctx.telegram) {
    ocConfig.channels = {
      telegram: {
        enabled: true,
        botToken: ctx.telegram.token,
        dmPolicy: "allowlist",
        allowFrom: [ctx.telegramUserId],
        groupPolicy: "allowlist",
        streaming: "partial",
      },
    };
  } else if (ctx.discord) {
    ocConfig.channels = {
      discord: {
        enabled: true,
        botToken: ctx.discord.token,
      },
    };
  } else if (ctx.mattermost) {
    ocConfig.channels = {
      mattermost: {
        enabled: true,
        url: ctx.mattermost.url,
        token: ctx.mattermost.token,
      },
    };
  }

  writeFileSync(OC_CONFIG, JSON.stringify(ocConfig, null, 2) + "\n", "utf-8");
  logger.info("Wrote openclaw.json directly");
}

function writeAuth(ctx: SetupContext): void {
  if (!ctx.model?.apiKey) return;

  const providerName = getProviderName(ctx.model.provider);
  const profileId = `${providerName}:default`;

  const authData = {
    profiles: {
      [profileId]: {
        type: "api_key",
        provider: providerName,
        key: ctx.model.apiKey,
      },
    },
  };

  const content = JSON.stringify(authData, null, 2) + "\n";

  for (const dir of [AGENT_DIR, AGENT_DIR_LEGACY]) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "auth-profiles.json"), content, "utf-8");
  }

  logger.info(`Wrote auth profiles for ${providerName}`);
}

function getProviderName(provider: string): string {
  switch (provider) {
    case "google": return "google-generative-ai";
    default: return provider;
  }
}

function generateToken(): string {
  return randomBytes(24).toString("hex");
}
