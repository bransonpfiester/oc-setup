import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { Model } from "@/types/api";
import { success, badRequest, internal } from "@/lib/api-helpers";

export const MODEL_REGISTRY: Model[] = [
  {
    id: "claude-sonnet-4-20250514",
    providerId: "anthropic",
    name: "claude-sonnet-4-20250514",
    displayName: "Claude Sonnet 4.5",
    description:
      "Best combination of performance, speed, and cost from Anthropic. Extended thinking capable.",
    type: "multimodal",
    contextWindow: 200_000,
    maxOutputTokens: 8192,
    inputPricePerToken: 0.000003,
    outputPricePerToken: 0.000015,
    capabilities: ["function_calling", "vision", "streaming", "system_prompt"],
    status: "available",
    version: "2025-05-14",
    releasedAt: "2025-05-14T00:00:00Z",
  },
  {
    id: "claude-3-haiku-20240307",
    providerId: "anthropic",
    name: "claude-3-haiku-20240307",
    displayName: "Claude 3 Haiku",
    description:
      "Fastest and most compact Claude model — ideal for high-throughput, low-latency tasks.",
    type: "multimodal",
    contextWindow: 200_000,
    maxOutputTokens: 4096,
    inputPricePerToken: 0.00000025,
    outputPricePerToken: 0.00000125,
    capabilities: ["function_calling", "vision", "streaming", "system_prompt"],
    status: "available",
    version: "2024-03-07",
    releasedAt: "2024-03-07T00:00:00Z",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    providerId: "anthropic",
    name: "claude-3-5-sonnet-20241022",
    displayName: "Claude 3.5 Sonnet",
    description:
      "Previous-generation Sonnet with strong coding and analysis capabilities.",
    type: "multimodal",
    contextWindow: 200_000,
    maxOutputTokens: 8192,
    inputPricePerToken: 0.000003,
    outputPricePerToken: 0.000015,
    capabilities: ["function_calling", "vision", "streaming", "system_prompt"],
    status: "available",
    version: "2024-10-22",
    releasedAt: "2024-10-22T00:00:00Z",
  },
  {
    id: "gpt-4o",
    providerId: "openai",
    name: "gpt-4o",
    displayName: "GPT-4o",
    description:
      "Most capable OpenAI model for complex reasoning, code generation, and multimodal tasks.",
    type: "multimodal",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputPricePerToken: 0.000005,
    outputPricePerToken: 0.000015,
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "json_mode",
      "system_prompt",
    ],
    status: "available",
    version: "2024-08-06",
    releasedAt: "2024-05-13T00:00:00Z",
  },
  {
    id: "gpt-4o-mini",
    providerId: "openai",
    name: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    description:
      "Small, fast, and affordable model for lightweight tasks with strong multimodal support.",
    type: "multimodal",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputPricePerToken: 0.00000015,
    outputPricePerToken: 0.0000006,
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "json_mode",
      "system_prompt",
    ],
    status: "available",
    version: "2024-07-18",
    releasedAt: "2024-07-18T00:00:00Z",
  },
  {
    id: "gpt-4-turbo",
    providerId: "openai",
    name: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    description:
      "High-intelligence model with vision capabilities and 128K context window.",
    type: "multimodal",
    contextWindow: 128_000,
    maxOutputTokens: 4096,
    inputPricePerToken: 0.00001,
    outputPricePerToken: 0.00003,
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "json_mode",
      "system_prompt",
    ],
    status: "available",
    version: "2024-04-09",
    releasedAt: "2024-04-09T00:00:00Z",
  },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    providerId: "openrouter",
    name: "anthropic/claude-sonnet-4-20250514",
    displayName: "Claude Sonnet 4.5 (OpenRouter)",
    description:
      "Anthropic's Claude Sonnet 4.5 accessed via the OpenRouter unified gateway.",
    type: "multimodal",
    contextWindow: 200_000,
    maxOutputTokens: 8192,
    inputPricePerToken: 0.000003,
    outputPricePerToken: 0.000015,
    capabilities: ["function_calling", "vision", "streaming", "system_prompt"],
    status: "available",
    version: "2025-05-14",
    releasedAt: "2025-05-14T00:00:00Z",
  },
  {
    id: "openai/gpt-4o",
    providerId: "openrouter",
    name: "openai/gpt-4o",
    displayName: "GPT-4o (OpenRouter)",
    description:
      "OpenAI's GPT-4o accessed via the OpenRouter unified gateway.",
    type: "multimodal",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputPricePerToken: 0.000005,
    outputPricePerToken: 0.000015,
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "json_mode",
      "system_prompt",
    ],
    status: "available",
    version: "2024-08-06",
    releasedAt: "2024-05-13T00:00:00Z",
  },
  {
    id: "google/gemini-2.0-flash",
    providerId: "openrouter",
    name: "google/gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash (OpenRouter)",
    description:
      "Google's fast multimodal model accessed via the OpenRouter unified gateway.",
    type: "multimodal",
    contextWindow: 1_000_000,
    maxOutputTokens: 8192,
    inputPricePerToken: 0.0000001,
    outputPricePerToken: 0.0000004,
    capabilities: [
      "function_calling",
      "vision",
      "streaming",
      "json_mode",
      "system_prompt",
    ],
    status: "available",
    version: "2025-01-01",
    releasedAt: "2025-01-01T00:00:00Z",
  },
];

/**
 * @description List all available models, optionally filtered by provider ID.
 *   Returns the full model catalog when no filter is applied.
 * @param req - The incoming request with an optional `provider` query parameter
 * @returns Array of model objects matching the filter
 */
export async function GET(req: NextRequest) {
  try {
    const providerFilter = req.nextUrl.searchParams.get("provider");

    let models = [...MODEL_REGISTRY];
    if (providerFilter) {
      models = models.filter((m) => m.providerId === providerFilter);
    }

    return success(models);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
