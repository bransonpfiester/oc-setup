import * as p from "@clack/prompts";
import { runShell, run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function setupGateway(ctx: SetupContext): Promise<void> {
  await cleanBadConfig();
  await tryOnboard(ctx);
  await installGatewayService();
  await startGateway(ctx);
}

async function cleanBadConfig(): Promise<void> {
  const result = await runShell("openclaw doctor --fix 2>&1", { timeout: 30_000 });
  if (result.exitCode === 0) {
    logger.info("openclaw doctor --fix ran successfully");
  }
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
    s.stop("Onboarding had issues, setting up manually");
    logger.warn(`onboard exit ${result.exitCode}: ${result.stderr || result.stdout}`);
  }
}

async function installGatewayService(): Promise<void> {
  const checkResult = await runShell("openclaw gateway status 2>&1");
  if (
    checkResult.stdout.includes("Service not installed") ||
    checkResult.stdout.includes("not loaded") ||
    checkResult.stdout.includes("not found")
  ) {
    const s = p.spinner();
    s.start("Installing gateway service...");

    const installResult = await runShell("openclaw gateway install 2>&1", { timeout: 30_000 });

    if (installResult.exitCode === 0) {
      s.stop("Gateway service installed");
      logger.info("Gateway service installed");
    } else {
      s.stop("Gateway service install had issues");
      logger.warn(`gateway install: ${installResult.stderr || installResult.stdout}`);
      p.log.info("Install manually: openclaw gateway install");
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

  const startResult = await runShell("openclaw gateway start 2>&1", { timeout: 30_000 });

  if (startResult.exitCode === 0) {
    s.stop("Gateway started");
    logger.info("Gateway started successfully");
  } else {
    s.stop("Gateway start had issues");
    logger.warn(`Gateway start: ${startResult.stderr || startResult.stdout}`);

    await runShell("openclaw gateway launch 2>&1", { timeout: 30_000 });
    p.log.info("If the gateway isn't running, start manually: openclaw gateway start");
  }
}

function getAuthFlag(ctx: SetupContext): string {
  if (!ctx.model) return "";
  switch (ctx.model.provider) {
    case "anthropic": return "--auth-choice anthropic-api-key";
    case "openai": return "--auth-choice openai-api-key";
    case "google": return "--auth-choice gemini-api-key";
    case "mistral": return "--auth-choice mistral-api-key";
    case "xai": return `--auth-choice custom-api-key --custom-base-url https://api.x.ai/v1 --custom-compatibility openai`;
    case "deepseek": return `--auth-choice custom-api-key --custom-base-url https://api.deepseek.com/v1 --custom-compatibility openai`;
    case "perplexity": return `--auth-choice custom-api-key --custom-base-url https://api.perplexity.ai --custom-compatibility openai`;
    case "moonshot": return `--auth-choice custom-api-key --custom-base-url https://api.moonshot.ai/v1 --custom-compatibility openai`;
    case "groq": return `--auth-choice custom-api-key --custom-base-url https://api.groq.com/openai/v1 --custom-compatibility openai`;
    case "openrouter": return `--auth-choice custom-api-key --custom-base-url https://openrouter.ai/api/v1 --custom-compatibility openai`;
    default: return "";
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
