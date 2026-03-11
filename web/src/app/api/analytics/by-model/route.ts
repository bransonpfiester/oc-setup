import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { AnalyticsByModelResponse, ModelStats } from "@/types/api";
import { success, badRequest, internal } from "@/lib/api-helpers";

const MODEL_DATA: ModelStats[] = [
  {
    modelId: "claude-sonnet-4-20250514",
    modelName: "Claude Sonnet 4",
    provider: "anthropic",
    sessions: 3240,
    tokens: 8400000,
    cost: 252.0,
    averageLatency: 380,
    errorRate: 0.8,
    satisfaction: 4.7,
    percentage: 32.1,
  },
  {
    modelId: "gpt-4o",
    modelName: "GPT-4o",
    provider: "openai",
    sessions: 2680,
    tokens: 7100000,
    cost: 284.0,
    averageLatency: 420,
    errorRate: 1.2,
    satisfaction: 4.5,
    percentage: 26.5,
  },
  {
    modelId: "gpt-4o-mini",
    modelName: "GPT-4o Mini",
    provider: "openai",
    sessions: 1850,
    tokens: 4200000,
    cost: 42.0,
    averageLatency: 280,
    errorRate: 0.6,
    satisfaction: 4.3,
    percentage: 18.3,
  },
  {
    modelId: "claude-3-5-haiku-20241022",
    modelName: "Claude 3.5 Haiku",
    provider: "anthropic",
    sessions: 1420,
    tokens: 3600000,
    cost: 36.0,
    averageLatency: 240,
    errorRate: 0.5,
    satisfaction: 4.2,
    percentage: 14.1,
  },
  {
    modelId: "gemini-2.0-flash",
    modelName: "Gemini 2.0 Flash",
    provider: "google",
    sessions: 910,
    tokens: 2100000,
    cost: 21.0,
    averageLatency: 310,
    errorRate: 1.5,
    satisfaction: 4.0,
    percentage: 9.0,
  },
];

/**
 * @description Return analytics broken down by AI model, including usage counts,
 *   average latency, error rates, and cost estimates.
 * @param _request - Incoming request (no query params required)
 * @returns AnalyticsByModelResponse with per-model statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

    const response: AnalyticsByModelResponse = {
      period: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      },
      models: MODEL_DATA,
      totalModels: MODEL_DATA.length,
    };

    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
