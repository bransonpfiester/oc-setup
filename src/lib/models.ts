import { logger } from "../utils/logger.js";

export type ModelProvider = "anthropic" | "openai" | "openrouter" | "skip";

export interface ModelConfig {
  provider: ModelProvider;
  label: string;
  defaultModel: string;
  hint: string;
}

export const MODEL_PROVIDERS: ModelConfig[] = [
  {
    provider: "anthropic",
    label: "Anthropic (Claude)",
    defaultModel: "claude-sonnet-4-5-20250514",
    hint: "~$20/mo",
  },
  {
    provider: "openai",
    label: "OpenAI (GPT-4o)",
    defaultModel: "gpt-4o",
    hint: "~$20/mo",
  },
  {
    provider: "openrouter",
    label: "OpenRouter (multiple models)",
    defaultModel: "anthropic/claude-sonnet-4-5-20250514",
    hint: "pay-per-use",
  },
];

export async function validateApiKey(
  provider: ModelProvider,
  apiKey: string,
): Promise<boolean> {
  const key = apiKey.trim();
  try {
    switch (provider) {
      case "anthropic":
        return await validateAnthropic(key);
      case "openai":
        return await validateOpenAI(key);
      case "openrouter":
        return await validateOpenRouter(key);
      default:
        return false;
    }
  } catch (err) {
    logger.error(`API key validation failed for ${provider}: ${err}`);
    return false;
  }
}

async function validateAnthropic(apiKey: string): Promise<boolean> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  // 200 = valid key, 401 = invalid, other codes still mean key is valid format-wise
  if (res.status === 401 || res.status === 403) return false;
  return true;
}

async function validateOpenAI(apiKey: string): Promise<boolean> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  return res.status !== 401;
}

async function validateOpenRouter(apiKey: string): Promise<boolean> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  return res.status !== 401;
}
