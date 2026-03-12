import { logger } from "../utils/logger.js";

export type ModelProvider =
  | "anthropic" | "openai" | "openrouter"
  | "google" | "xai" | "deepseek" | "mistral"
  | "perplexity" | "moonshot" | "groq" | "skip";

export interface ModelConfig {
  provider: ModelProvider;
  label: string;
  defaultModel: string;
  hint: string;
}

export const MODEL_PROVIDERS: ModelConfig[] = [
  { provider: "anthropic", label: "Anthropic (Claude)", defaultModel: "claude-sonnet-4-5-20250514", hint: "~$20/mo" },
  { provider: "openai", label: "OpenAI (GPT-4o)", defaultModel: "gpt-4o", hint: "~$20/mo" },
  { provider: "openrouter", label: "OpenRouter (multiple models)", defaultModel: "anthropic/claude-sonnet-4-5-20250514", hint: "pay-per-use" },
  { provider: "google", label: "Google (Gemini)", defaultModel: "gemini-2.0-flash", hint: "~$10/mo" },
  { provider: "xai", label: "xAI (Grok)", defaultModel: "grok-4", hint: "~$15/mo" },
  { provider: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat", hint: "~$2/mo" },
  { provider: "mistral", label: "Mistral", defaultModel: "mistral-large-latest", hint: "~$10/mo" },
  { provider: "perplexity", label: "Perplexity (Sonar)", defaultModel: "sonar-pro", hint: "pay-per-use" },
  { provider: "groq", label: "Groq (Llama)", defaultModel: "llama-3.3-70b-versatile", hint: "free tier" },
  { provider: "moonshot", label: "Moonshot", defaultModel: "moonshot-v1-8k", hint: "pay-per-use" },
];

export async function validateApiKey(
  provider: ModelProvider,
  apiKey: string,
): Promise<boolean> {
  const key = apiKey.trim();
  if (!key) return false;

  try {
    switch (provider) {
      case "anthropic":
        return await validateAnthropic(key);
      case "openai":
        return await validateOpenAI(key);
      case "openrouter":
        return await validateOpenRouter(key);
      case "google":
        return await validateGoogle(key);
      case "xai":
        return await validateOpenAICompatible(key, "https://api.x.ai/v1/models");
      case "deepseek":
        return await validateOpenAICompatible(key, "https://api.deepseek.com/v1/models");
      case "mistral":
        return await validateOpenAICompatible(key, "https://api.mistral.ai/v1/models");
      case "perplexity":
        return await validateOpenAICompatible(key, "https://api.perplexity.ai/models");
      case "groq":
        return await validateOpenAICompatible(key, "https://api.groq.com/openai/v1/models");
      case "moonshot":
        return await validateOpenAICompatible(key, "https://api.moonshot.cn/v1/models");
      case "skip":
        return true;
      default:
        logger.warn(`No validation endpoint for provider: ${provider}`);
        return true;
    }
  } catch (err) {
    logger.error(`API key validation failed for ${provider}: ${err}`);
    return false;
  }
}

async function validateAnthropic(apiKey: string): Promise<boolean> {
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) return false;
  if (res.status >= 200 && res.status < 300) return true;
  if (res.status === 429) return true;
  return false;
}

async function validateOpenAI(apiKey: string): Promise<boolean> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) return false;
  if (res.status >= 200 && res.status < 300) return true;
  if (res.status === 429) return true;
  return false;
}

async function validateOpenRouter(apiKey: string): Promise<boolean> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) return false;
  if (res.status >= 200 && res.status < 300) return true;
  if (res.status === 429) return true;
  return false;
}

async function validateGoogle(apiKey: string): Promise<boolean> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403 || res.status === 400) return false;
  if (res.status >= 200 && res.status < 300) return true;
  if (res.status === 429) return true;
  return false;
}

async function validateOpenAICompatible(apiKey: string, url: string): Promise<boolean> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) return false;
  if (res.status >= 200 && res.status < 300) return true;
  if (res.status === 429) return true;
  return false;
}
