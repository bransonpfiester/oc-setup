import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { Model, ComparisonMetric } from "@/types/api";
import { modelComparison, parseBody } from "@/lib/validation";
import { success, badRequest, notFound, internal } from "@/lib/api-helpers";
import { MODEL_REGISTRY } from "../route";

const DEFAULT_CRITERIA: ComparisonMetric[] = [
  "price",
  "speed",
  "quality",
  "context",
  "features",
];

interface ModelComparisonEntry {
  model: Model;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

interface ModelComparisonResult {
  models: ModelComparisonEntry[];
  recommendation: {
    modelId: string;
    reason: string;
    confidence: number;
  } | null;
}

function scoreModel(model: Model, metric: ComparisonMetric): number {
  switch (metric) {
    case "price": {
      const costPer1K =
        (model.inputPricePerToken + model.outputPricePerToken) * 1000;
      if (costPer1K < 0.002) return 95;
      if (costPer1K < 0.01) return 80;
      if (costPer1K < 0.02) return 60;
      return 40;
    }
    case "speed":
      return model.maxOutputTokens >= 16_384 ? 90 : 75;
    case "quality":
      return model.contextWindow >= 200_000 ? 95 : 85;
    case "context":
      if (model.contextWindow >= 1_000_000) return 100;
      if (model.contextWindow >= 200_000) return 90;
      if (model.contextWindow >= 128_000) return 80;
      return 60;
    case "features":
      return Math.min(100, model.capabilities.length * 18);
  }
}

function deriveStrengths(model: Model): string[] {
  const strengths: string[] = [];
  if (model.contextWindow >= 200_000) strengths.push("Very large context window");
  if (model.maxOutputTokens >= 16_384) strengths.push("High max output tokens");
  if (model.capabilities.includes("vision")) strengths.push("Vision / image input support");
  if (model.capabilities.includes("function_calling")) strengths.push("Native function calling");
  if (model.capabilities.includes("json_mode")) strengths.push("Structured JSON output mode");
  const costPer1K = (model.inputPricePerToken + model.outputPricePerToken) * 1000;
  if (costPer1K < 0.002) strengths.push("Very low cost per token");
  return strengths;
}

function deriveWeaknesses(model: Model): string[] {
  const weaknesses: string[] = [];
  if (model.contextWindow < 200_000) weaknesses.push("Smaller context window than competitors");
  if (model.maxOutputTokens <= 4096) weaknesses.push("Limited max output length");
  if (!model.capabilities.includes("json_mode")) weaknesses.push("No dedicated JSON output mode");
  const costPer1K = (model.inputPricePerToken + model.outputPricePerToken) * 1000;
  if (costPer1K >= 0.02) weaknesses.push("Higher cost per token");
  return weaknesses;
}

/**
 * @description Compare two or more models across selected criteria. Returns
 *   scored comparisons with strengths, weaknesses, and an overall recommendation.
 * @param req - The incoming request containing `modelIds` and optional `criteria`
 * @returns Comparison results with per-model scores and a recommendation
 */
export async function POST(req: NextRequest) {
  try {
    const body = parseBody(modelComparison, await req.json());

    const registryMap = new Map(MODEL_REGISTRY.map((m) => [m.id, m]));
    const unknown = body.modelIds.filter(
      (id: string) => !registryMap.has(id),
    );

    if (unknown.length > 0) {
      return notFound(`Unknown model(s): ${unknown.join(", ")}`);
    }

    const criteria: ComparisonMetric[] =
      body.criteria && body.criteria.length > 0
        ? (body.criteria as ComparisonMetric[])
        : DEFAULT_CRITERIA;

    const comparisons: ModelComparisonEntry[] = body.modelIds.map(
      (id: string) => {
        const model = registryMap.get(id)!;
        const scores: Record<string, number> = {};

        for (const metric of criteria) {
          scores[metric] = Math.round(scoreModel(model, metric));
        }

        return {
          model,
          scores,
          strengths: deriveStrengths(model),
          weaknesses: deriveWeaknesses(model),
        };
      },
    );

    let recommendation: ModelComparisonResult["recommendation"] = null;
    if (comparisons.length >= 2) {
      const best = comparisons.reduce((a, b) => {
        const avgA =
          Object.values(a.scores).reduce((s, v) => s + v, 0) /
          Object.values(a.scores).length;
        const avgB =
          Object.values(b.scores).reduce((s, v) => s + v, 0) /
          Object.values(b.scores).length;
        return avgA >= avgB ? a : b;
      });

      const avgScore =
        Object.values(best.scores).reduce((s, v) => s + v, 0) /
        Object.values(best.scores).length;

      recommendation = {
        modelId: best.model.id,
        reason: `${best.model.displayName} scores highest across the selected criteria with an average of ${Math.round(avgScore)}`,
        confidence: Math.min(0.99, avgScore / 100),
      };
    }

    const result: ModelComparisonResult = { models: comparisons, recommendation };
    return success(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
