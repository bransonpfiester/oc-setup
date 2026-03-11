import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type {
  MonthlyAnalytics,
  AnalyticsMonthlyResponse,
  AnalyticsSummary,
} from "@/types/api";
import { analyticsFilter, parseSearchParams } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

function generateMonthlyData(
  months: number,
  from: Date,
): MonthlyAnalytics[] {
  const data: MonthlyAnalytics[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(from);
    date.setMonth(date.getMonth() + i);
    const monthStr = date.toISOString().slice(0, 7);

    const baseSessions = 1100 + i * 120;
    const prevSessions = i > 0 ? 1100 + (i - 1) * 120 : baseSessions;
    const growthRate =
      prevSessions > 0
        ? Math.round(
            ((baseSessions - prevSessions) / prevSessions) * 10000,
          ) / 100
        : 0;

    const cost = Math.round((68 + i * 8) * 100) / 100;

    data.push({
      month: monthStr,
      sessions: baseSessions,
      commands: 3200 + i * 280,
      tokens: 2400000 + i * 180000,
      cost,
      errors: 72 + Math.round(Math.sin(i) * 15),
      uniqueUsers: 185 + i * 18,
      growthRate,
      projectedCost: Math.round(cost * 1.08 * 100) / 100,
    });
  }
  return data;
}

/**
 * @description Retrieve monthly analytics aggregates (default last 6 months).
 * @param request - Incoming request with optional from/to and limit query params
 * @returns AnalyticsMonthlyResponse with monthly data points and summary
 */
export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchParams(
      analyticsFilter,
      request.nextUrl.searchParams,
    );

    const to = filters.to ? new Date(filters.to) : new Date();
    const defaultMonths = 6;
    const months = filters.from
      ? Math.min(Math.ceil(filters.limit / 30), 24)
      : defaultMonths;
    const from = filters.from
      ? new Date(filters.from)
      : new Date(
          to.getFullYear(),
          to.getMonth() - defaultMonths,
          1,
        );

    const data = generateMonthlyData(months, from);

    const summary: AnalyticsSummary = {
      totalSessions: data.reduce((s, d) => s + d.sessions, 0),
      totalCommands: data.reduce((s, d) => s + d.commands, 0),
      totalTokens: data.reduce((s, d) => s + d.tokens, 0),
      totalCost:
        Math.round(data.reduce((s, d) => s + d.cost, 0) * 100) / 100,
      totalErrors: data.reduce((s, d) => s + d.errors, 0),
      averageSessionDuration: 198,
      mostActiveDay:
        data.reduce((best, d) => (d.sessions > best.sessions ? d : best))
          .month + "-15",
    };

    const response: AnalyticsMonthlyResponse = {
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
