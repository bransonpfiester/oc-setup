import * as p from "@clack/prompts";
import {
  MODEL_PROVIDERS,
  validateApiKey,
  type ModelProvider,
} from "../lib/models.js";
import { readConfig, writeConfig } from "../lib/config.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const MAX_RETRIES = 3;

export async function setupModel(ctx: SetupContext): Promise<void> {
  if (ctx.model) {
    const s = p.spinner();
    s.start(`Validating pre-configured ${ctx.model.provider} API key...`);
    const valid = await validateApiKey(
      ctx.model.provider as ModelProvider,
      ctx.model.apiKey,
    );
    if (valid) {
      s.stop("API key validated");
      writeConfig({
        model: {
          provider: ctx.model.provider,
          apiKey: ctx.model.apiKey,
          modelId: ctx.model.modelId,
        },
      });
      return;
    }
    s.stop("Pre-configured API key is invalid");
    p.log.warn("The provided API key didn't validate. Let's enter a new one.");
    ctx.model = null;
  }

  const existing = readConfig();
  if (existing.model?.provider && existing.model?.apiKey) {
    const reuse = await p.confirm({
      message: `Existing ${existing.model.provider} configuration found. Keep it?`,
      initialValue: true,
    });
    if (p.isCancel(reuse)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    if (reuse) {
      ctx.model = {
        provider: existing.model.provider,
        apiKey: existing.model.apiKey,
        modelId: existing.model.modelId ?? "",
      };
      p.log.success(`Using existing ${existing.model.provider} configuration`);
      return;
    }
  }

  const providerOptions = [
    ...MODEL_PROVIDERS.map((m) => ({
      value: m.provider as string,
      label: m.label,
      hint: m.hint,
    })),
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
    p.log.info("You can configure your AI provider later with: openclaw config");
    ctx.model = null;
    return;
  }

  const providerConfig = MODEL_PROVIDERS.find((m) => m.provider === provider)!;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const apiKey = await p.text({
      message: attempt > 1
        ? `Paste your ${providerConfig.label} API key (attempt ${attempt}/${MAX_RETRIES}):`
        : `Paste your ${providerConfig.label} API key:`,
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
        provider: provider as string,
        apiKey: apiKey.trim(),
        modelId: providerConfig.defaultModel,
      };
      writeConfig({
        model: {
          provider: provider as string,
          apiKey: apiKey.trim(),
          modelId: providerConfig.defaultModel,
        },
      });
      return;
    }

    s.stop("Validation failed");

    if (attempt < MAX_RETRIES) {
      p.log.warn("API key appears to be invalid. Check and try again.");
    } else {
      p.log.error(
        `Failed after ${MAX_RETRIES} attempts. Run oc-setup again when you have a valid key.`,
      );
      logger.error(`API key validation failed for ${provider} after max retries`);
      process.exit(1);
    }
  }
}
