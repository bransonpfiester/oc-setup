import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getDailyAnalytics } from "../../src/app/api/analytics/daily/route";
import { GET as getWeeklyAnalytics } from "../../src/app/api/analytics/weekly/route";
import { GET as getMonthlyAnalytics } from "../../src/app/api/analytics/monthly/route";
import { GET as getByLanguage } from "../../src/app/api/analytics/by-language/route";
import { GET as getByModel } from "../../src/app/api/analytics/by-model/route";
import { GET as getTrends } from "../../src/app/api/analytics/trends/route";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("Analytics API", () => {
  describe("GET /api/analytics/daily", () => {
    it("returns daily data with default 30 days", async () => {
      const res = await getDailyAnalytics(
        createRequest("/api/analytics/daily"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.period).toBeDefined();
      expect(json.data.data).toBeDefined();
      expect(json.data.summary).toBeDefined();
      expect(Array.isArray(json.data.data)).toBe(true);
      expect(json.data.data.length).toBe(30);
    });

    it("each daily entry has expected fields", async () => {
      const res = await getDailyAnalytics(
        createRequest("/api/analytics/daily"),
      );
      const json = await res.json();

      for (const entry of json.data.data) {
        expect(entry).toHaveProperty("date");
        expect(entry).toHaveProperty("sessions");
        expect(entry).toHaveProperty("commands");
        expect(entry).toHaveProperty("tokens");
        expect(entry).toHaveProperty("cost");
        expect(entry).toHaveProperty("errors");
        expect(entry).toHaveProperty("uniqueUsers");
        expect(entry).toHaveProperty("averageLatency");
      }
    });

    it("respects custom days parameter", async () => {
      const res = await getDailyAnalytics(
        createRequest("/api/analytics/daily?days=7"),
      );
      const json = await res.json();

      expect(json.data.data.length).toBe(7);
    });

    it("summary has aggregate totals", async () => {
      const res = await getDailyAnalytics(
        createRequest("/api/analytics/daily"),
      );
      const json = await res.json();

      expect(typeof json.data.summary.totalSessions).toBe("number");
      expect(typeof json.data.summary.totalCommands).toBe("number");
      expect(typeof json.data.summary.totalTokens).toBe("number");
      expect(typeof json.data.summary.totalCost).toBe("number");
      expect(typeof json.data.summary.totalErrors).toBe("number");
      expect(json.data.summary.mostActiveDay).toBeDefined();
    });

    it("period has startDate and endDate", async () => {
      const res = await getDailyAnalytics(
        createRequest("/api/analytics/daily"),
      );
      const json = await res.json();

      expect(json.data.period.startDate).toBeDefined();
      expect(json.data.period.endDate).toBeDefined();
    });
  });

  describe("GET /api/analytics/weekly", () => {
    it("returns weekly data with default 12 weeks", async () => {
      const res = await getWeeklyAnalytics(
        createRequest("/api/analytics/weekly"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.data.length).toBe(12);
    });

    it("each weekly entry has weekStart and weekEnd", async () => {
      const res = await getWeeklyAnalytics(
        createRequest("/api/analytics/weekly"),
      );
      const json = await res.json();

      for (const entry of json.data.data) {
        expect(entry).toHaveProperty("weekStart");
        expect(entry).toHaveProperty("weekEnd");
        expect(entry).toHaveProperty("sessions");
        expect(entry).toHaveProperty("growthRate");
      }
    });

    it("respects custom weeks parameter", async () => {
      const res = await getWeeklyAnalytics(
        createRequest("/api/analytics/weekly?weeks=4"),
      );
      const json = await res.json();

      expect(json.data.data.length).toBe(4);
    });

    it("includes summary with totals", async () => {
      const res = await getWeeklyAnalytics(
        createRequest("/api/analytics/weekly"),
      );
      const json = await res.json();

      expect(json.data.summary).toBeDefined();
      expect(json.data.summary.totalSessions).toBeGreaterThan(0);
    });
  });

  describe("GET /api/analytics/monthly", () => {
    it("returns monthly data with default 12 months", async () => {
      const res = await getMonthlyAnalytics(
        createRequest("/api/analytics/monthly"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.data.length).toBe(12);
    });

    it("each monthly entry has month and projectedCost", async () => {
      const res = await getMonthlyAnalytics(
        createRequest("/api/analytics/monthly"),
      );
      const json = await res.json();

      for (const entry of json.data.data) {
        expect(entry).toHaveProperty("month");
        expect(entry).toHaveProperty("projectedCost");
        expect(typeof entry.projectedCost).toBe("number");
      }
    });

    it("respects custom months parameter", async () => {
      const res = await getMonthlyAnalytics(
        createRequest("/api/analytics/monthly?months=6"),
      );
      const json = await res.json();

      expect(json.data.data.length).toBe(6);
    });

    it("monthly data entries have growth rate", async () => {
      const res = await getMonthlyAnalytics(
        createRequest("/api/analytics/monthly"),
      );
      const json = await res.json();

      for (const entry of json.data.data) {
        expect(typeof entry.growthRate).toBe("number");
      }
    });
  });

  describe("GET /api/analytics/by-language", () => {
    it("returns language statistics", async () => {
      const res = await getByLanguage(
        createRequest("/api/analytics/by-language"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.languages).toBeDefined();
      expect(Array.isArray(json.data.languages)).toBe(true);
      expect(json.data.totalLanguages).toBeGreaterThan(0);
    });

    it("each language stat has expected fields", async () => {
      const res = await getByLanguage(
        createRequest("/api/analytics/by-language"),
      );
      const json = await res.json();

      for (const lang of json.data.languages) {
        expect(lang).toHaveProperty("language");
        expect(lang).toHaveProperty("sessions");
        expect(lang).toHaveProperty("tokens");
        expect(lang).toHaveProperty("cost");
        expect(lang).toHaveProperty("percentage");
        expect(lang).toHaveProperty("trend");
        expect(["up", "down", "stable"]).toContain(lang.trend);
      }
    });

    it("percentages sum to approximately 100", async () => {
      const res = await getByLanguage(
        createRequest("/api/analytics/by-language"),
      );
      const json = await res.json();

      const totalPercentage = json.data.languages.reduce(
        (sum: number, lang: { percentage: number }) => sum + lang.percentage,
        0,
      );
      expect(totalPercentage).toBeGreaterThan(95);
      expect(totalPercentage).toBeLessThanOrEqual(101);
    });

    it("includes English as the top language", async () => {
      const res = await getByLanguage(
        createRequest("/api/analytics/by-language"),
      );
      const json = await res.json();

      const english = json.data.languages.find(
        (l: { language: string }) => l.language === "English",
      );
      expect(english).toBeDefined();
      expect(english.sessions).toBeGreaterThan(0);
    });
  });

  describe("GET /api/analytics/by-model", () => {
    it("returns model statistics", async () => {
      const res = await getByModel(
        createRequest("/api/analytics/by-model"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.models).toBeDefined();
      expect(Array.isArray(json.data.models)).toBe(true);
      expect(json.data.totalModels).toBeGreaterThan(0);
    });

    it("each model stat has expected fields", async () => {
      const res = await getByModel(
        createRequest("/api/analytics/by-model"),
      );
      const json = await res.json();

      for (const model of json.data.models) {
        expect(model).toHaveProperty("modelId");
        expect(model).toHaveProperty("modelName");
        expect(model).toHaveProperty("provider");
        expect(model).toHaveProperty("sessions");
        expect(model).toHaveProperty("cost");
        expect(model).toHaveProperty("averageLatency");
        expect(model).toHaveProperty("errorRate");
        expect(model).toHaveProperty("percentage");
      }
    });

    it("includes period with start and end dates", async () => {
      const res = await getByModel(
        createRequest("/api/analytics/by-model"),
      );
      const json = await res.json();

      expect(json.data.period).toBeDefined();
      expect(json.data.period.startDate).toBeDefined();
      expect(json.data.period.endDate).toBeDefined();
    });

    it("model error rates are non-negative", async () => {
      const res = await getByModel(
        createRequest("/api/analytics/by-model"),
      );
      const json = await res.json();

      for (const model of json.data.models) {
        expect(model.errorRate).toBeGreaterThanOrEqual(0);
        expect(typeof model.errorRate).toBe("number");
      }
    });
  });

  describe("GET /api/analytics/trends", () => {
    it("returns trend data with insights", async () => {
      const res = await getTrends(
        createRequest("/api/analytics/trends"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.trends).toBeDefined();
      expect(json.data.insights).toBeDefined();
      expect(Array.isArray(json.data.trends)).toBe(true);
      expect(Array.isArray(json.data.insights)).toBe(true);
    });

    it("each trend has metric, current, previous, and direction", async () => {
      const res = await getTrends(
        createRequest("/api/analytics/trends"),
      );
      const json = await res.json();

      for (const trend of json.data.trends) {
        expect(trend).toHaveProperty("metric");
        expect(trend).toHaveProperty("current");
        expect(trend).toHaveProperty("previous");
        expect(trend).toHaveProperty("change");
        expect(trend).toHaveProperty("changePercentage");
        expect(trend).toHaveProperty("direction");
        expect(["up", "down", "stable"]).toContain(trend.direction);
        expect(trend).toHaveProperty("series");
        expect(Array.isArray(trend.series)).toBe(true);
      }
    });

    it("insights have type, metric, message, and significance", async () => {
      const res = await getTrends(
        createRequest("/api/analytics/trends"),
      );
      const json = await res.json();

      for (const insight of json.data.insights) {
        expect(insight).toHaveProperty("type");
        expect(["positive", "negative", "neutral"]).toContain(insight.type);
        expect(insight).toHaveProperty("metric");
        expect(insight).toHaveProperty("message");
        expect(insight).toHaveProperty("significance");
        expect(insight.significance).toBeGreaterThanOrEqual(0);
        expect(insight.significance).toBeLessThanOrEqual(1);
      }
    });

    it("first trend metric is sessions", async () => {
      const res = await getTrends(
        createRequest("/api/analytics/trends"),
      );
      const json = await res.json();

      expect(json.data.trends.length).toBeGreaterThan(0);
      expect(json.data.trends[0].metric).toBe("sessions");
    });

    it("trend series data points have timestamp and value", async () => {
      const res = await getTrends(
        createRequest("/api/analytics/trends"),
      );
      const json = await res.json();

      const firstTrend = json.data.trends[0];
      expect(firstTrend.series.length).toBeGreaterThan(0);

      for (const point of firstTrend.series) {
        expect(point).toHaveProperty("timestamp");
        expect(point).toHaveProperty("value");
        expect(typeof point.value).toBe("number");
      }
    });

    it("includes period with date range", async () => {
      const res = await getTrends(
        createRequest("/api/analytics/trends"),
      );
      const json = await res.json();

      expect(json.data.period).toBeDefined();
      expect(json.data.period.startDate).toBeDefined();
      expect(json.data.period.endDate).toBeDefined();
    });
  });
});
