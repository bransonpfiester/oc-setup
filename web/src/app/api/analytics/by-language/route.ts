import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { AnalyticsByLanguageResponse, LanguageStats } from "@/types/api";
import { success, badRequest, internal } from "@/lib/api-helpers";

const LANGUAGE_DATA: LanguageStats[] = [
  {
    language: "en-US",
    sessions: 4820,
    tokens: 12500000,
    cost: 375.0,
    percentage: 42.5,
    trend: "up",
  },
  {
    language: "es-ES",
    sessions: 1890,
    tokens: 4800000,
    cost: 144.0,
    percentage: 16.7,
    trend: "up",
  },
  {
    language: "fr-FR",
    sessions: 1340,
    tokens: 3400000,
    cost: 102.0,
    percentage: 11.8,
    trend: "stable",
  },
  {
    language: "de-DE",
    sessions: 1120,
    tokens: 2900000,
    cost: 87.0,
    percentage: 9.9,
    trend: "stable",
  },
  {
    language: "ja-JP",
    sessions: 980,
    tokens: 2600000,
    cost: 78.0,
    percentage: 8.6,
    trend: "up",
  },
  {
    language: "pt-BR",
    sessions: 720,
    tokens: 1800000,
    cost: 54.0,
    percentage: 6.3,
    trend: "down",
  },
];

/**
 * @description Return analytics broken down by user language/locale.
 * @param _request - Incoming request (no query params required)
 * @returns AnalyticsByLanguageResponse with per-language session, token, cost, and trend data
 */
export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

    const response: AnalyticsByLanguageResponse = {
      period: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      },
      languages: LANGUAGE_DATA,
      totalLanguages: LANGUAGE_DATA.length,
    };

    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
