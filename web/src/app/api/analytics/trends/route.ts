import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type {
  AnalyticsTrendsResponse,
  TrendData,
  TrendInsight,
  AnalyticsDataPoint,
  TrendDirection,
} from "@/types/api";
import { analyticsFilter, parseSearchParams } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

function generateSeries(
  days: number,
  from: Date,
  baseValue: number,
  growthPerDay: number,
): AnalyticsDataPoint[] {
  const points: AnalyticsDataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    const noise = Math.sin(i * 0.7) * baseValue * 0.15;
    points.push({
      timestamp: date.toISOString(),
      value: Math.round(baseValue + i * growthPerDay + noise),
    });
  }
  return points;
}

function computeDirection(change: number): TrendDirection {
  if (change > 2) return "up";
  if (change < -2) return "down";
  return "stable";
}

const METRIC_CONFIGS: Record<
  string,
  { base: number; growth: number; label: string }
> = {
  setups: { base: 42, growth: 1.5, label: "Daily Setups" },
  sessions: { base: 85, growth: 2.8, label: "Daily Sessions" },
  commands: { base: 210, growth: 6.0, label: "Daily Commands" },
  tokens: { base: 95000, growth: 3200, label: "Daily Tokens" },
  errors: { base: 8, growth: -0.1, label: "Daily Errors" },
  cost: { base: 3, growth: 0.08, label: "Daily Cost ($)" },
};

/**
 * @description Generate trend analysis for a given metric over a date range.
 *   Supports metrics: setups, sessions, commands, tokens, errors, cost.
 *   Returns the data series plus computed min/max/average and trend direction.
 * @param request - Incoming request with optional metric, from, to query params
 * @returns AnalyticsTrendsResponse with trend series, summary, and insights
 */
export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchParams(
      analyticsFilter,
      request.nextUrl.searchParams,
    );
    const metricName =
      request.nextUrl.searchParams.get("metric") ?? "setups";

    const to = filters.to ? new Date(filters.to) : new Date();
    const days = Math.min(filters.limit, 365);
    const from = filters.from
      ? new Date(filters.from)
      : new Date(to.getTime() - days * 86_400_000);

    const actualDays = Math.min(
      Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
      days,
    );

    const config = METRIC_CONFIGS[metricName] ?? METRIC_CONFIGS.setups;
    const series = generateSeries(
      actualDays,
      from,
      config.base,
      config.growth,
    );

    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / (secondHalf.length || 1);
    const changePercent =
      firstAvg > 0
        ? Math.round(((secondAvg - firstAvg) / firstAvg) * 10000) / 100
        : 0;
    const direction = computeDirection(changePercent);

    const trend: TrendData = {
      metric: metricName,
      current: values[values.length - 1] ?? 0,
      previous: values[0] ?? 0,
      change: (values[values.length - 1] ?? 0) - (values[0] ?? 0),
      changePercentage: changePercent,
      direction,
      series,
    };

    const insights: TrendInsight[] = [];
    if (direction === "up") {
      insights.push({
        type: "positive",
        metric: metricName,
        message: `${config.label} increased by ${Math.abs(changePercent)}% over the period`,
        significance: Math.min(Math.abs(changePercent) / 10, 1),
      });
    } else if (direction === "down") {
      const insightType = metricName === "errors" ? "positive" : "negative";
      insights.push({
        type: insightType,
        metric: metricName,
        message: `${config.label} decreased by ${Math.abs(changePercent)}% over the period`,
        significance: Math.min(Math.abs(changePercent) / 10, 1),
      });
    } else {
      insights.push({
        type: "neutral",
        metric: metricName,
        message: `${config.label} remained stable over the period`,
        significance: 0.2,
      });
    }

    if (max > average * 1.5) {
      insights.push({
        type: "neutral",
        metric: metricName,
        message: `Peak of ${max} detected — ${Math.round((max / average) * 100 - 100)}% above average`,
        significance: 0.6,
      });
    }

    const response: AnalyticsTrendsResponse = {
      period: {
        startDate: from.toISOString(),
        endDate: to.toISOString(),
      },
      trends: [trend],
      insights,
    };

    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
