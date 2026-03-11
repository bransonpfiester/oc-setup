import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { RateLimitConfig } from "@/types/api";
import { success, badRequest, notFound, internal } from "@/lib/api-helpers";

interface ProviderDetail {
  id: string;
  name: string;
  status: string;
  description: string;
  website: string;
  documentationUrl: string;
  capabilities: string[];
  models: string[];
  rateLimits: RateLimitConfig;
}

const providerDetails: Record<string, ProviderDetail> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    status: "active",
    description:
      "Claude family of AI assistants with strong reasoning, long context, and safety-focused design.",
    website: "https://anthropic.com",
    documentationUrl: "https://docs.anthropic.com",
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "system_prompt",
      "extended_thinking",
      "pdf_input",
      "citations",
    ],
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-haiku-20240307",
      "claude-3-5-sonnet-20241022",
    ],
    rateLimits: {
      requestsPerMinute: 300,
      tokensPerMinute: 100_000,
      concurrentRequests: 30,
    },
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    status: "active",
    description:
      "GPT model family for chat, code generation, vision, and structured output.",
    website: "https://openai.com",
    documentationUrl: "https://platform.openai.com/docs",
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "json_mode",
      "system_prompt",
      "fine_tuning",
      "batch",
    ],
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    rateLimits: {
      requestsPerMinute: 500,
      tokensPerMinute: 200_000,
      concurrentRequests: 50,
    },
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    status: "active",
    description:
      "Unified gateway to multiple AI providers through a single API key and endpoint.",
    website: "https://openrouter.ai",
    documentationUrl: "https://openrouter.ai/docs",
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "system_prompt",
      "multi_provider",
      "fallback_routing",
    ],
    models: [
      "anthropic/claude-sonnet-4-20250514",
      "openai/gpt-4o",
      "google/gemini-2.0-flash",
    ],
    rateLimits: {
      requestsPerMinute: 600,
      tokensPerMinute: 300_000,
      concurrentRequests: 60,
    },
  },
};

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @description Get detailed information about a specific provider, including
 *   its capabilities, available models, rate limits, and documentation link.
 * @param _req - The incoming request (unused)
 * @param ctx - Route context containing the dynamic `id` segment
 * @returns Full provider detail, or 404 if the provider ID is unknown
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const provider = providerDetails[id];

    if (!provider) {
      return notFound(`Provider '${id}' not found`);
    }

    return success(provider);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
