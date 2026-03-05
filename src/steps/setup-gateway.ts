import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runShell, run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const OPENCLAW_CONFIG = join(homedir(), ".openclaw", "openclaw.json");

export async function setupGateway(ctx: SetupContext): Promise<void> {
  await tryOnboard(ctx);
  writeModelConfig(ctx);
  await installGatewayService();
  await startGateway(ctx);
}

async function tryOnboard(ctx: SetupContext): Promise<void> {
  const s = p.spinner();
  s.start("Running OpenClaw onboarding...");

  const envVars = buildEnvVars(ctx);
  const authFlag = getAuthFlag(ctx);

  const cmd = [
    "openclaw onboard --non-interactive",
    "--flow quickstart",
    "--install-daemon",
    authFlag,
  ]
    .filter(Boolean)
    .join(" ");

  logger.info(`Running: ${cmd}`);

  const result = await runShell(cmd, { timeout: 120_000, env: envVars });

  if (result.exitCode === 0) {
    s.stop("OpenClaw onboarding complete");
    logger.info("openclaw onboard succeeded");
  } else {
    s.stop("Onboarding had issues, configuring manually");
    logger.warn(`onboard exit ${result.exitCode}: ${result.stderr || result.stdout}`);
  }
}

function writeModelConfig(ctx: SetupContext): void {
  if (!ctx.model) return;

  const s = p.spinner();
  s.start("Writing AI model config...");

  try {
    const dir = join(homedir(), ".openclaw");
    mkdirSync(dir, { recursive: true });

    let ocConfig: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_CONFIG)) {
      try {
        ocConfig = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8"));
      } catch {
        ocConfig = {};
      }
    }

    const models = (ocConfig.models ?? {}) as Record<string, unknown>;
    const providers = (models.providers ?? {}) as Record<string, unknown>;

    if (ctx.model.provider === "anthropic") {
      ocConfig.model = { default: ctx.model.modelId || "claude-sonnet-4-6" };
      providers.anthropic = { apiKey: ctx.model.apiKey };
    } else if (ctx.model.provider === "openai") {
      ocConfig.model = { default: ctx.model.modelId || "gpt-5.2" };
      providers.openai = { apiKey: ctx.model.apiKey };
    } else if (ctx.model.provider === "google") {
      ocConfig.model = { default: ctx.model.modelId || "gemini-2.5-flash" };
      providers.google = { apiKey: ctx.model.apiKey };
    } else {
      const baseUrl = getBaseUrl(ctx.model.provider);
      ocConfig.model = { default: ctx.model.modelId || "claude-sonnet-4-6" };
      providers[ctx.model.provider] = {
        apiKey: ctx.model.apiKey,
        ...(baseUrl ? { baseUrl } : {}),
        compatibility: "openai",
      };
    }

    models.providers = providers;
    ocConfig.models = models;

    writeFileSync(OPENCLAW_CONFIG, JSON.stringify(ocConfig, null, 2) + "\n", "utf-8");
    s.stop(`AI model configured (${ctx.model.provider})`);
    logger.info(`Wrote model config for ${ctx.model.provider}`);
  } catch (err) {
    s.stop("Could not write model config");
    p.log.warn(`${err}`);
    logger.error(`Model config write failed: ${err}`);
  }
}

async function installGatewayService(): Promise<void> {
  const checkResult = await runShell("openclaw gateway status 2>&1");
  if (checkResult.stdout.includes("Service not installed") || checkResult.stdout.includes("not loaded")) {
    const s = p.spinner();
    s.start("Installing gateway service...");

    const installResult = await runShell("openclaw gateway install", { timeout: 30_000 });

    if (installResult.exitCode === 0) {
      s.stop("Gateway service installed");
      logger.info("Gateway service installed");
    } else {
      s.stop("Gateway service install had issues");
      logger.warn(`gateway install: ${installResult.stderr || installResult.stdout}`);

      const installDaemon = await runShell("openclaw onboard --non-interactive --install-daemon 2>&1", { timeout: 30_000 });
      if (installDaemon.exitCode === 0) {
        p.log.success("Gateway daemon installed via onboard");
      } else {
        p.log.warn("Could not install gateway service automatically.");
        p.log.info("Install manually: openclaw gateway install");
      }
    }
  } else {
    p.log.success("Gateway service already installed");
  }
}

async function startGateway(ctx: SetupContext): Promise<void> {
  const statusResult = await run("openclaw", ["gateway", "status"]);
  const statusText = statusResult.stdout.toLowerCase();

  if (statusText.includes("running") && !statusText.includes("not")) {
    p.log.success("Gateway is running");
    return;
  }

  const s = p.spinner();
  s.start("Starting gateway...");

  const startResult = await runShell("openclaw gateway start", { timeout: 30_000 });

  if (startResult.exitCode === 0) {
    s.stop("Gateway started");
    logger.info("Gateway started successfully");
  } else {
    s.stop("Gateway start failed");
    logger.warn(`Gateway start: ${startResult.stderr || startResult.stdout}`);

    const launchResult = await runShell("openclaw gateway launch", { timeout: 30_000 });
    if (launchResult.exitCode === 0) {
      p.log.success("Gateway launched");
    } else {
      p.log.warn("Could not start gateway automatically.");
      p.log.info("Start manually: openclaw gateway start");
    }
  }
}

function getAuthFlag(ctx: SetupContext): string {
  if (!ctx.model) return "";
  switch (ctx.model.provider) {
    case "anthropic": return "--auth-choice anthropic-api-key";
    case "openai": return "--auth-choice openai-api-key";
    case "google": return "--auth-choice gemini-api-key";
    case "mistral": return "--auth-choice mistral-api-key";
    default: return `--auth-choice custom-api-key --custom-base-url ${getBaseUrl(ctx.model.provider) || "https://openrouter.ai/api/v1"} --custom-compatibility openai`;
  }
}

function getBaseUrl(provider: string): string | null {
  switch (provider) {
    case "xai": return "https://api.x.ai/v1";
    case "deepseek": return "https://api.deepseek.com/v1";
    case "perplexity": return "https://api.perplexity.ai";
    case "moonshot": return "https://api.moonshot.ai/v1";
    case "groq": return "https://api.groq.com/openai/v1";
    case "openrouter": return "https://openrouter.ai/api/v1";
    default: return null;
  }
}

function buildEnvVars(ctx: SetupContext): Record<string, string> {
  const env: Record<string, string> = {};
  if (ctx.telegram) env.TELEGRAM_BOT_TOKEN = ctx.telegram.token;
  if (ctx.model) {
    switch (ctx.model.provider) {
      case "anthropic": env.ANTHROPIC_API_KEY = ctx.model.apiKey; break;
      case "openai": env.OPENAI_API_KEY = ctx.model.apiKey; break;
      case "google": env.GEMINI_API_KEY = ctx.model.apiKey; break;
      case "mistral": env.MISTRAL_API_KEY = ctx.model.apiKey; break;
      default: env.CUSTOM_API_KEY = ctx.model.apiKey; break;
    }
  }
  return env;
}
