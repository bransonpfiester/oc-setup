import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type {
  WeeklyAnalytics,
  AnalyticsWeeklyResponse,
  AnalyticsSummary,
} from "@/types/api";
import { analyticsFilter, parseSearchParams } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

function generateWeeklyData(weeks: number, from: Date): WeeklyAnalytics[] {
  const data: WeeklyAnalytics[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(from);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const baseSessions = 280 + i * 25;
    const prevSessions = i > 0 ? 280 + (i - 1) * 25 : baseSessions;
    const growthRate =
      prevSessions > 0
        ? Math.round(
            ((baseSessions - prevSessions) / prevSessions) * 10000,
          ) / 100
        : 0;

    data.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      sessions: baseSessions,
      commands: 840 + i * 60,
      tokens: 590000 + i * 40000,
      cost: Math.round((17.5 + i * 1.2) * 100) / 100,
      errors: 18 + Math.round(Math.sin(i) * 5),
      uniqueUsers: 52 + i * 4,
      growthRate,
    });
  }
  return data;
}

/**
 * @description Retrieve weekly analytics aggregates (default last 4 weeks).
 * @param request - Incoming request with optional from/to and limit query params
 * @returns AnalyticsWeeklyResponse with weekly data points and summary
 */
export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchParams(
      analyticsFilter,
      request.nextUrl.searchParams,
    );

    const to = filters.to ? new Date(filters.to) : new Date();
    const weeks = Math.min(Math.ceil(filters.limit / 7), 52);
    const defaultWeeks = 4;
    const actualWeeks = filters.from ? weeks : defaultWeeks;
    const from = filters.from
      ? new Date(filters.from)
      : new Date(to.getTime() - actualWeeks * 7 * 86_400_000);

    const data = generateWeeklyData(actualWeeks, from);

    const summary: AnalyticsSummary = {
      totalSessions: data.reduce((s, d) => s + d.sessions, 0),
      totalCommands: data.reduce((s, d) => s + d.commands, 0),
      totalTokens: data.reduce((s, d) => s + d.tokens, 0),
      totalCost:
        Math.round(data.reduce((s, d) => s + d.cost, 0) * 100) / 100,
      totalErrors: data.reduce((s, d) => s + d.errors, 0),
      averageSessionDuration: 192,
      mostActiveDay: data[data.length - 1]?.weekStart ?? "",
    };

    const response: AnalyticsWeeklyResponse = {
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
