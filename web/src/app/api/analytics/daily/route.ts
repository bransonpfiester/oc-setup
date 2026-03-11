import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type {
  DailyAnalytics,
  AnalyticsDailyResponse,
  AnalyticsSummary,
} from "@/types/api";
import { analyticsFilter, parseSearchParams } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

function generateDailyData(days: number, from: Date): DailyAnalytics[] {
  const data: DailyAnalytics[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1.0;

    data.push({
      date: date.toISOString().slice(0, 10),
      sessions: Math.round((45 + i * 3) * weekdayMultiplier),
      commands: Math.round((120 + i * 8) * weekdayMultiplier),
      tokens: Math.round((85000 + i * 5000) * weekdayMultiplier),
      cost: Math.round((2.5 + i * 0.15) * weekdayMultiplier * 100) / 100,
      errors: Math.round(3 + Math.sin(i) * 2),
      uniqueUsers: Math.round((18 + i) * weekdayMultiplier),
      averageLatency: 320 + Math.round(Math.sin(i * 0.5) * 80),
    });
  }
  return data;
}

/**
 * @description Retrieve daily analytics for a given date range (default last 7 days).
 * @param request - Incoming request with optional from/to and limit query params
 * @returns AnalyticsDailyResponse with daily data points and summary
 */
export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchParams(
      analyticsFilter,
      request.nextUrl.searchParams,
    );

    const to = filters.to ? new Date(filters.to) : new Date();
    const days = Math.min(filters.limit, 365);
    const from = filters.from
      ? new Date(filters.from)
      : new Date(to.getTime() - days * 86_400_000);

    const actualDays = Math.ceil(
      (to.getTime() - from.getTime()) / 86_400_000,
    );
    const data = generateDailyData(Math.min(actualDays, days), from);

    const summary: AnalyticsSummary = {
      totalSessions: data.reduce((s, d) => s + d.sessions, 0),
      totalCommands: data.reduce((s, d) => s + d.commands, 0),
      totalTokens: data.reduce((s, d) => s + d.tokens, 0),
      totalCost:
        Math.round(data.reduce((s, d) => s + d.cost, 0) * 100) / 100,
      totalErrors: data.reduce((s, d) => s + d.errors, 0),
      averageSessionDuration: 185,
      mostActiveDay:
        data.reduce((best, d) => (d.sessions > best.sessions ? d : best))
          .date,
    };

    const response: AnalyticsDailyResponse = {
      period: {
        startDate: from.toISOString(),
        endDate: to.toISOString(),
      },
      data,
      summary,
    };

    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
