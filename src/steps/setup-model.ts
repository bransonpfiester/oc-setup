import * as p from "@clack/prompts";
import {
  MODEL_PROVIDERS,
  validateApiKey,
  type ModelProvider,
} from "../lib/models.js";
import { writeConfig } from "../lib/config.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const MAX_RETRIES = 3;

export async function setupModel(ctx: SetupContext): Promise<void> {
  if (ctx.model) {
    if (ctx.model.authMethod && ctx.model.authMethod !== "api-key") {
      p.log.success(`Using ${ctx.model.provider} via ${ctx.model.authMethod}`);
      return;
    }
    const s = p.spinner();
    s.start(`Validating pre-configured ${ctx.model.provider} API key...`);
    const valid = await validateApiKey(
      ctx.model.provider as ModelProvider,
      ctx.model.apiKey,
    );
    if (valid) {
      s.stop("API key validated");
      return;
    }
    s.stop("Pre-configured API key is invalid");
    p.log.warn("The provided API key didn't validate. Let's enter a new one.");
    ctx.model = null;
  }

  const providerOptions = [
    { value: "anthropic", label: "Anthropic (Claude)", hint: "API key or Claude subscription" },
    { value: "openai", label: "OpenAI", hint: "API key or Codex subscription" },
    { value: "google", label: "Google Gemini" },
    { value: "xai", label: "xAI (Grok)" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "mistral", label: "Mistral AI" },
    { value: "perplexity", label: "Perplexity" },
    { value: "moonshot", label: "Kimi / Moonshot" },
    { value: "groq", label: "Groq" },
    { value: "openrouter", label: "OpenRouter (400+ models)" },
    { value: "skip", label: "I'll configure this later" },
  ];

  const provider = await p.select({
    message: "Which AI provider?",
    options: providerOptions,
  });

  if (p.isCancel(provider)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  if (provider === "skip") {
    p.log.info("You can configure your AI provider later with: openclaw onboard");
    ctx.model = null;
    return;
  }

  if (provider === "anthropic") {
    await setupAnthropic(ctx);
    return;
  }

  if (provider === "openai") {
    await setupOpenAI(ctx);
    return;
  }

  const providerConfig = MODEL_PROVIDERS.find((m) => m.provider === provider);
  await collectApiKey(ctx, provider as string, providerConfig?.defaultModel ?? "");
}

async function setupAnthropic(ctx: SetupContext): Promise<void> {
  const authChoice = await p.select({
    message: "How do you want to authenticate with Anthropic?",
    options: [
      { value: "api-key", label: "API key", hint: "from console.anthropic.com" },
      { value: "setup-token", label: "Claude subscription (setup token)", hint: "run 'claude setup-token' to get one" },
      { value: "oauth", label: "Claude Code CLI (OAuth)", hint: "reuses existing Claude Code login" },
    ],
  });

  if (p.isCancel(authChoice)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  if (authChoice === "api-key") {
    await collectApiKey(ctx, "anthropic", "claude-sonnet-4-6");
    return;
  }

  if (authChoice === "setup-token") {
    p.note(
      [
        "To get a setup token:",
        "1. Make sure you have a Claude Pro/Max subscription",
        "2. Run: claude setup-token",
        "3. Copy the token it gives you",
      ].join("\n"),
      "Anthropic Setup Token",
    );

    const token = await p.text({
      message: "Paste your setup token:",
      placeholder: "clst_...",
      validate(value) {
        if (!value.trim()) return "Token is required";
      },
    });

    if (p.isCancel(token)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    ctx.model = {
      provider: "anthropic",
      apiKey: token.trim(),
      modelId: "claude-sonnet-4-6",
      authMethod: "setup-token",
    };
    logger.info("Anthropic auth: setup-token");
    return;
  }

  if (authChoice === "oauth") {
    p.log.info("OpenClaw onboarding will reuse your existing Claude Code CLI credentials.");
    ctx.model = {
      provider: "anthropic",
      apiKey: "",
      modelId: "claude-sonnet-4-6",
      authMethod: "oauth",
    };
    logger.info("Anthropic auth: oauth (Claude Code CLI)");
    return;
  }
}

async function setupOpenAI(ctx: SetupContext): Promise<void> {
  const authChoice = await p.select({
    message: "How do you want to authenticate with OpenAI?",
    options: [
      { value: "api-key", label: "API key", hint: "from platform.openai.com" },
      { value: "codex-oauth", label: "Codex subscription (OAuth)", hint: "opens browser to log in" },
      { value: "codex-reuse", label: "Codex CLI (reuse existing)", hint: "reuses ~/.codex/auth.json" },
    ],
  });

  if (p.isCancel(authChoice)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  if (authChoice === "api-key") {
    await collectApiKey(ctx, "openai", "gpt-5.2");
    return;
  }

  if (authChoice === "codex-oauth") {
    p.log.info("OpenClaw onboarding will open your browser to authenticate with OpenAI.");
    ctx.model = {
      provider: "openai",
      apiKey: "",
      modelId: "gpt-5.3-codex",
      authMethod: "codex-oauth",
    };
    logger.info("OpenAI auth: codex-oauth");
    return;
  }

  if (authChoice === "codex-reuse") {
    p.log.info("OpenClaw onboarding will reuse your existing Codex CLI credentials.");
    ctx.model = {
      provider: "openai",
      apiKey: "",
      modelId: "gpt-5.3-codex",
      authMethod: "codex-reuse",
    };
    logger.info("OpenAI auth: codex-reuse");
    return;
  }
}

async function collectApiKey(
  ctx: SetupContext,
  provider: string,
  defaultModel: string,
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const apiKey = await p.text({
      message: attempt > 1
        ? `Paste your API key (attempt ${attempt}/${MAX_RETRIES}):`
        : "Paste your API key:",
      placeholder: provider === "anthropic" ? "sk-ant-..." : "sk-...",
      validate(value) {
        if (!value.trim()) return "API key is required";
      },
    });

    if (p.isCancel(apiKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    const s = p.spinner();
    s.start("Validating API key...");

    const valid = await validateApiKey(provider as ModelProvider, apiKey);

    if (valid) {
      s.stop("API key validated");
      logger.info(`API key validated for ${provider}`);
      ctx.model = {
        provider,
        apiKey: apiKey.trim(),
        modelId: defaultModel,
        authMethod: "api-key",
      };
      return;
    }

    s.stop("Validation failed");

    if (attempt < MAX_RETRIES) {
      p.log.warn("API key appears to be invalid. Check and try again.");
    } else {
      p.log.error(`Failed after ${MAX_RETRIES} attempts.`);
      logger.error(`API key validation failed for ${provider} after max retries`);
      process.exit(1);
    }
  }
}
