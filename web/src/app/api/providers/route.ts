import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { ProviderStatus } from "@/types/api";
import { success, badRequest, internal } from "@/lib/api-helpers";

interface ProviderSummary {
  id: string;
  name: string;
  status: ProviderStatus;
  defaultModel: string;
  description: string;
  pricingHint: string;
  website: string;
}

const providers: ProviderSummary[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    status: "active",
    defaultModel: "claude-sonnet-4-20250514",
    description:
      "Claude family of AI assistants — strong reasoning, long context, and safety-focused design.",
    pricingHint: "From $0.25 / 1M input tokens (Haiku) to $3 / 1M input tokens (Sonnet)",
    website: "https://anthropic.com",
  },
  {
    id: "openai",
    name: "OpenAI",
    status: "active",
    defaultModel: "gpt-4o",
    description:
      "GPT model family — versatile multimodal models for chat, code, and vision tasks.",
    pricingHint: "From $0.15 / 1M input tokens (GPT-4o Mini) to $5 / 1M input tokens (GPT-4o)",
    website: "https://openai.com",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    status: "active",
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    description:
      "Unified gateway to multiple AI providers — access Anthropic, OpenAI, Google and more through a single API.",
    pricingHint: "Varies by model; passthrough provider pricing with small markup",
    website: "https://openrouter.ai",
  },
];

/**
 * @description List all available AI providers with their status, default model,
 *   pricing hints, and website links.
 * @param _req - The incoming request (unused)
 * @returns Array of provider summaries
 */
export async function GET(_req: NextRequest) {
  try {
    return success(providers);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
