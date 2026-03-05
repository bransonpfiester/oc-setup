import * as p from "@clack/prompts";
import { runShell, run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function setupGateway(ctx: SetupContext): Promise<void> {
  const s = p.spinner();
  s.start("Running OpenClaw onboarding...");

  const providerFlag = getAuthFlag(ctx);
  const envVars = buildEnvVars(ctx);

  const onboardCmd = [
    "openclaw onboard --non-interactive",
    "--flow quickstart",
    "--install-daemon",
    providerFlag,
  ]
    .filter(Boolean)
    .join(" ");

  logger.info(`Running: ${onboardCmd}`);

  const result = await runShell(onboardCmd, {
    timeout: 120_000,
    env: envVars,
  });

  if (result.exitCode !== 0) {
    s.stop("OpenClaw onboarding had issues");
    logger.warn(`onboard stderr: ${result.stderr}`);
    logger.warn(`onboard stdout: ${result.stdout}`);

    if (result.stderr.includes("already") || result.stdout.includes("already")) {
      p.log.info("OpenClaw appears to be already configured.");
    } else {
      p.log.warn("Onboarding encountered issues. Trying to start gateway directly...");
      await startGatewayDirect(ctx);
      return;
    }
  } else {
    s.stop("OpenClaw onboarding complete");
    logger.info("openclaw onboard finished successfully");
  }

  const statusResult = await run("openclaw", ["gateway", "status"]);
  if (statusResult.exitCode === 0 && statusResult.stdout.toLowerCase().includes("running")) {
    p.log.success("Gateway is running");
    const pidMatch = statusResult.stdout.match(/pid[:\s]+(\d+)/i);
    if (pidMatch) ctx.gatewayPid = parseInt(pidMatch[1], 10);
  } else {
    p.log.info("Starting gateway...");
    await startGatewayDirect(ctx);
  }
}

async function startGatewayDirect(ctx: SetupContext): Promise<void> {
  const result = await runShell(
    `openclaw gateway start --port ${ctx.gatewayPort}`,
    { timeout: 30_000 },
  );

  if (result.exitCode !== 0) {
    p.log.warn("Gateway did not start automatically.");
    p.log.info("Start it manually: openclaw gateway start");
    logger.warn(`Gateway direct start failed: ${result.stderr}`);
    return;
  }

  const pidMatch = result.stdout.match(/pid[:\s]+(\d+)/i);
  if (pidMatch) ctx.gatewayPid = parseInt(pidMatch[1], 10);

  p.log.success(`Gateway running on port ${ctx.gatewayPort}`);
  logger.info(`Gateway started on port ${ctx.gatewayPort}`);
}

function getAuthFlag(ctx: SetupContext): string {
  if (!ctx.model) return "";

  switch (ctx.model.provider) {
    case "anthropic":
      return "--auth-choice anthropic-api-key";
    case "openai":
      return "--auth-choice openai-api-key";
    case "google":
      return "--auth-choice gemini-api-key";
    case "xai":
      return "--auth-choice custom-api-key --custom-compatibility openai";
    case "mistral":
      return "--auth-choice mistral-api-key";
    case "deepseek":
      return "--auth-choice custom-api-key --custom-base-url https://api.deepseek.com/v1 --custom-compatibility openai";
    case "perplexity":
      return "--auth-choice custom-api-key --custom-base-url https://api.perplexity.ai --custom-compatibility openai";
    case "moonshot":
      return "--auth-choice custom-api-key --custom-base-url https://api.moonshot.ai/v1 --custom-compatibility openai";
    case "groq":
      return "--auth-choice custom-api-key --custom-base-url https://api.groq.com/openai/v1 --custom-compatibility openai";
    case "openrouter":
      return "--auth-choice custom-api-key --custom-base-url https://openrouter.ai/api/v1 --custom-compatibility openai";
    default:
      return "";
  }
}

function buildEnvVars(ctx: SetupContext): Record<string, string> {
  const env: Record<string, string> = {};

  if (ctx.telegram) {
    env.TELEGRAM_BOT_TOKEN = ctx.telegram.token;
  }

  if (ctx.model) {
    switch (ctx.model.provider) {
      case "anthropic":
        env.ANTHROPIC_API_KEY = ctx.model.apiKey;
        break;
      case "openai":
        env.OPENAI_API_KEY = ctx.model.apiKey;
        break;
      case "google":
        env.GEMINI_API_KEY = ctx.model.apiKey;
        break;
      case "mistral":
        env.MISTRAL_API_KEY = ctx.model.apiKey;
        break;
      default:
        env.CUSTOM_API_KEY = ctx.model.apiKey;
        break;
    }
  }

  return env;
}
