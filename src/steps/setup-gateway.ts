import * as p from "@clack/prompts";
import { runShell, run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function setupGateway(ctx: SetupContext): Promise<void> {
  await runDoctorFix();
  await runOnboard(ctx);
  await installGatewayService();
  await startGateway(ctx);
}

async function runDoctorFix(): Promise<void> {
  await runShell("openclaw doctor --fix 2>&1", { timeout: 30_000 });
}

async function runOnboard(ctx: SetupContext): Promise<void> {
  const s = p.spinner();
  s.start("Running OpenClaw onboarding...");

  const args = buildOnboardArgs(ctx);
  const cmd = `openclaw onboard ${args.join(" ")}`;

  logger.info(`Running: ${cmd.replace(/--\S+-api-key\s+\S+/g, "--***-api-key ***")}`);

  const result = await runShell(cmd, { timeout: 120_000 });

  if (result.exitCode === 0) {
    s.stop("OpenClaw onboarding complete");
    logger.info("openclaw onboard succeeded");
  } else {
    s.stop("Onboarding had issues");
    logger.warn(`onboard exit ${result.exitCode}: ${result.stderr || result.stdout}`);

    if (result.stdout.includes("already") || result.stderr.includes("already")) {
      p.log.info("OpenClaw appears to be already configured.");
    } else {
      p.log.warn("Onboarding encountered issues.");
      p.log.info("You can run manually: openclaw onboard");
    }
  }
}

function buildOnboardArgs(ctx: SetupContext): string[] {
  const args = [
    "--non-interactive",
    "--mode", "local",
    "--flow", "quickstart",
    "--gateway-port", String(ctx.gatewayPort),
    "--gateway-bind", "loopback",
    "--install-daemon",
    "--daemon-runtime", "node",
    "--secret-input-mode", "plaintext",
    "--skip-skills",
  ];

  if (!ctx.model) return args;

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
