import * as p from "@clack/prompts";
import {
  MODEL_PROVIDERS,
  validateApiKey,
  type ModelProvider,
} from "../lib/models.js";
import { readConfig, writeConfig } from "../lib/config.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function setupModel(ctx: SetupContext): Promise<void> {
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

  const apiKey = await p.text({
    message: `Paste your ${providerConfig.label} API key:`,
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

  if (!valid) {
    s.stop("Validation failed");
    p.log.error("API key appears to be invalid. Check and try again.");
    logger.error(`API key validation failed for ${provider}`);
    process.exit(1);
  }

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
}
