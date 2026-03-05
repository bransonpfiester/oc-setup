import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runShell, run, runInteractive } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const OPENCLAW_CONFIG = join(homedir(), ".openclaw", "openclaw.json");

export async function setupGateway(ctx: SetupContext): Promise<void> {
  await runDoctorFix();
  await runOnboard(ctx);
  writeAuthProfile(ctx);
  writeDefaultModel(ctx);
  await installGatewayService();
  await startGateway(ctx);
}

async function runDoctorFix(): Promise<void> {
  await runShell("openclaw doctor --fix 2>&1", { timeout: 30_000 });
}

async function runOnboard(ctx: SetupContext): Promise<void> {
  const args = buildOnboardArgs(ctx);

  p.log.info("Running OpenClaw onboarding...");
  p.log.info("You may need to accept a security warning and confirm prompts.");
  console.log("");

  const exitCode = await runInteractive("openclaw", ["onboard", ...args]);

  console.log("");
  if (exitCode === 0) {
    p.log.success("OpenClaw onboarding complete");
    logger.info("openclaw onboard succeeded");
  } else {
    p.log.warn("Onboarding had issues.");
    p.log.info("You can run manually: openclaw onboard");
    logger.warn(`onboard exit ${exitCode}`);
  }
}

function writeAuthProfile(ctx: SetupContext): void {
  if (!ctx.model || !ctx.model.apiKey) return;

  const method = ctx.model.authMethod || "api-key";
  if (method !== "api-key") return;

  const agentDir = join(homedir(), ".openclaw", "agents", "main", "agent");
  const authFile = join(agentDir, "auth-profiles.json");

  try {
    mkdirSync(agentDir, { recursive: true });

    let authData: Record<string, unknown> = {};
    if (existsSync(authFile)) {
      try {
        authData = JSON.parse(readFileSync(authFile, "utf-8"));
      } catch {
        authData = {};
      }
    }

    const profiles = (authData.profiles ?? {}) as Record<string, unknown>;
    const providerName = getProviderName(ctx.model.provider);
    const profileId = `${providerName}:default`;

    profiles[profileId] = {
      type: "api_key",
      provider: providerName,
      key: ctx.model.apiKey,
    };

    authData.profiles = profiles;

    writeFileSync(authFile, JSON.stringify(authData, null, 2) + "\n", "utf-8");
    p.log.success(`API key saved for ${ctx.model.provider}`);
    logger.info(`Wrote auth profile: ${profileId}`);
  } catch (err) {
    p.log.warn(`Could not save API key: ${err}`);
    logger.error(`Auth profile write failed: ${err}`);
  }
}

function writeDefaultModel(ctx: SetupContext): void {
  if (!ctx.model) return;

  try {
    let ocConfig: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_CONFIG)) {
      try {
        ocConfig = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8"));
      } catch {
        ocConfig = {};
      }
    }

    const agents = (ocConfig.agents ?? {}) as Record<string, unknown>;
    const defaults = (agents.defaults ?? {}) as Record<string, unknown>;

    const providerName = getProviderName(ctx.model.provider);
    const modelRef = `${providerName}/${ctx.model.modelId}`;

    defaults.model = modelRef;
    agents.defaults = defaults;
    ocConfig.agents = agents;

    writeFileSync(OPENCLAW_CONFIG, JSON.stringify(ocConfig, null, 2) + "\n", "utf-8");
    p.log.success(`Default model set to ${modelRef}`);
    logger.info(`Wrote agents.defaults.model: ${modelRef}`);
  } catch (err) {
    p.log.warn(`Could not set default model: ${err}`);
    logger.error(`Default model write failed: ${err}`);
  }
}

function getProviderName(provider: string): string {
  switch (provider) {
    case "anthropic": return "anthropic";
    case "openai": return "openai";
    case "google": return "google-generative-ai";
    case "xai": return "xai";
    case "deepseek": return "deepseek";
    case "mistral": return "mistral";
    case "perplexity": return "perplexity";
    case "moonshot": return "moonshot";
    case "groq": return "groq";
    case "openrouter": return "openrouter";
    default: return provider;
  }
}

function buildOnboardArgs(ctx: SetupContext): string[] {
  const args = [
    "--mode", "local",
    "--flow", "quickstart",
    "--gateway-port", String(ctx.gatewayPort),
    "--gateway-bind", "loopback",
    "--install-daemon",
    "--daemon-runtime", "node",
    "--secret-input-mode", "plaintext",
    "--accept-risk",
  ];

  if (!ctx.model) return args;

  const method = ctx.model.authMethod || "api-key";

  // Anthropic subscription methods
  if (ctx.model.provider === "anthropic" && method === "oauth") {
    args.push("--auth-choice", "anthropic-oauth");
    return args;
  }
  if (ctx.model.provider === "anthropic" && method === "setup-token") {
    args.push("--auth-choice", "anthropic-token");
    return args;
  }

  // OpenAI subscription methods
  if (ctx.model.provider === "openai" && method === "codex-oauth") {
    args.push("--auth-choice", "openai-code-oauth");
    return args;
  }
  if (ctx.model.provider === "openai" && method === "codex-reuse") {
    args.push("--auth-choice", "openai-code-subscription");
    return args;
  }

  // API key methods
  switch (ctx.model.provider) {
    case "anthropic":
      args.push("--auth-choice", "anthropic-api-key");
      args.push("--anthropic-api-key", ctx.model.apiKey);
      break;
    case "openai":
      args.push("--auth-choice", "openai-api-key");
      args.push("--openai-api-key", ctx.model.apiKey);
      break;
    case "google":
      args.push("--auth-choice", "gemini-api-key");
      args.push("--gemini-api-key", ctx.model.apiKey);
      break;
    case "mistral":
      args.push("--auth-choice", "mistral-api-key");
      args.push("--mistral-api-key", ctx.model.apiKey);
      break;
    case "moonshot":
      args.push("--auth-choice", "moonshot-api-key");
      args.push("--moonshot-api-key", ctx.model.apiKey);
      break;
    case "xai":
      args.push("--auth-choice", "custom-api-key");
      args.push("--custom-base-url", "https://api.x.ai/v1");
      args.push("--custom-model-id", ctx.model.modelId || "grok-4");
      args.push("--custom-api-key", ctx.model.apiKey);
      args.push("--custom-provider-id", "xai");
      args.push("--custom-compatibility", "openai");
      break;
    case "deepseek":
      args.push("--auth-choice", "custom-api-key");
      args.push("--custom-base-url", "https://api.deepseek.com/v1");
      args.push("--custom-model-id", ctx.model.modelId || "deepseek-chat");
      args.push("--custom-api-key", ctx.model.apiKey);
      args.push("--custom-provider-id", "deepseek");
      args.push("--custom-compatibility", "openai");
      break;
    case "perplexity":
      args.push("--auth-choice", "custom-api-key");
      args.push("--custom-base-url", "https://api.perplexity.ai");
      args.push("--custom-model-id", ctx.model.modelId || "sonar-pro");
      args.push("--custom-api-key", ctx.model.apiKey);
      args.push("--custom-provider-id", "perplexity");
      args.push("--custom-compatibility", "openai");
      break;
    case "groq":
      args.push("--auth-choice", "custom-api-key");
      args.push("--custom-base-url", "https://api.groq.com/openai/v1");
      args.push("--custom-model-id", ctx.model.modelId || "llama-3.3-70b-versatile");
      args.push("--custom-api-key", ctx.model.apiKey);
      args.push("--custom-provider-id", "groq");
      args.push("--custom-compatibility", "openai");
      break;
    case "openrouter":
      args.push("--auth-choice", "custom-api-key");
      args.push("--custom-base-url", "https://openrouter.ai/api/v1");
      args.push("--custom-model-id", ctx.model.modelId || "anthropic/claude-sonnet-4-6");
      args.push("--custom-api-key", ctx.model.apiKey);
      args.push("--custom-provider-id", "openrouter");
      args.push("--custom-compatibility", "openai");
      break;
    default:
      args.push("--auth-choice", "custom-api-key");
      args.push("--custom-api-key", ctx.model.apiKey);
      args.push("--custom-compatibility", "openai");
      break;
  }

  return args;
}

async function installGatewayService(): Promise<void> {
  const checkResult = await runShell("openclaw gateway status 2>&1");
  const needs = checkResult.stdout.includes("not installed") ||
    checkResult.stdout.includes("not loaded") ||
    checkResult.stdout.includes("not found");

  if (needs) {
    const s = p.spinner();
    s.start("Installing gateway service...");
    const result = await runShell("openclaw gateway install 2>&1", { timeout: 30_000 });
    if (result.exitCode === 0) {
      s.stop("Gateway service installed");
    } else {
      s.stop("Could not install gateway service");
      p.log.info("Install manually: openclaw gateway install");
      logger.warn(`gateway install: ${result.stderr || result.stdout}`);
    }
  }
}

async function startGateway(ctx: SetupContext): Promise<void> {
  const statusResult = await run("openclaw", ["gateway", "status"]);
  if (statusResult.stdout.toLowerCase().includes("running") &&
      !statusResult.stdout.toLowerCase().includes("not")) {
    p.log.success("Gateway is running");
    return;
  }

  const s = p.spinner();
  s.start("Starting gateway...");
  const result = await runShell("openclaw gateway start 2>&1", { timeout: 30_000 });
  if (result.exitCode === 0) {
    s.stop("Gateway started");
    logger.info("Gateway started");
  } else {
    s.stop("Could not start gateway");
    p.log.info("Start manually: openclaw gateway start");
    logger.warn(`Gateway start: ${result.stderr || result.stdout}`);
  }
}
