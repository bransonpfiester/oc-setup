import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getProfile } from "../../src/app/api/users/profile/route";
import {
  GET as getPreferences,
  PUT as updatePreferences,
} from "../../src/app/api/users/preferences/route";
import { GET as getHistory } from "../../src/app/api/users/history/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("Users API", () => {
  describe("GET /api/users/profile", () => {
    it("returns user profile with expected fields", async () => {
      const res = await getProfile(createRequest("/api/users/profile"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("id");
      expect(json.data).toHaveProperty("email");
      expect(json.data).toHaveProperty("displayName");
      expect(json.data).toHaveProperty("role");
      expect(json.data).toHaveProperty("createdAt");
      expect(json.data).toHaveProperty("lastLoginAt");
    });

    it("returns user stats in profile", async () => {
      const res = await getProfile(createRequest("/api/users/profile"));
      const json = await res.json();

      expect(json.data.stats).toBeDefined();
      expect(typeof json.data.stats.totalSessions).toBe("number");
      expect(typeof json.data.stats.totalCommands).toBe("number");
      expect(typeof json.data.stats.totalTokensUsed).toBe("number");
    });

    it("returns admin role for mock user", async () => {
      const res = await getProfile(createRequest("/api/users/profile"));
      const json = await res.json();
      expect(json.data.role).toBe("admin");
    });

    it("returns a valid ISO timestamp for lastLoginAt", async () => {
      const res = await getProfile(createRequest("/api/users/profile"));
      const json = await res.json();

      const date = new Date(json.data.lastLoginAt);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe("GET /api/users/preferences", () => {
    it("returns preferences with expected structure", async () => {
      const res = await getPreferences(
        createRequest("/api/users/preferences"),
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveProperty("theme");
      expect(json.data).toHaveProperty("language");
      expect(json.data).toHaveProperty("timezone");
      expect(json.data).toHaveProperty("notifications");
      expect(json.data).toHaveProperty("defaults");
    });

    it("returns a valid theme value", async () => {
      const res = await getPreferences(
        createRequest("/api/users/preferences"),
      );
      const json = await res.json();

      expect(["light", "dark", "system"]).toContain(json.data.theme);
    });

    it("notifications have boolean fields", async () => {
      const res = await getPreferences(
        createRequest("/api/users/preferences"),
      );
      const json = await res.json();

      expect(typeof json.data.notifications.email).toBe("boolean");
      expect(typeof json.data.notifications.webhookAlerts).toBe("boolean");
    });
  });

  describe("PUT /api/users/preferences", () => {
    it("updates theme preference", async () => {
      const res = await updatePreferences(
        createRequest("/api/users/preferences", {
          method: "PUT",
          body: JSON.stringify({ theme: "dark" }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.theme).toBe("dark");
    });

    it("performs partial update without overwriting other fields", async () => {
      await updatePreferences(
        createRequest("/api/users/preferences", {
          method: "PUT",
          body: JSON.stringify({ theme: "system" }),
        }),
      );

      const res = await updatePreferences(
        createRequest("/api/users/preferences", {
          method: "PUT",
          body: JSON.stringify({ language: "fr" }),
        }),
      );

      const json = await res.json();
      expect(json.data.language).toBe("fr");
      expect(json.data.theme).toBeDefined();
    });

    it("deep-merges notification preferences", async () => {
      const res = await updatePreferences(
        createRequest("/api/users/preferences", {
          method: "PUT",
          body: JSON.stringify({
            notifications: { email: false },
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.notifications.email).toBe(false);
      expect(json.data.notifications).toHaveProperty("webhookAlerts");
    });

    it("returns 400 for invalid theme value", async () => {
      const res = await updatePreferences(
        createRequest("/api/users/preferences", {
          method: "PUT",
          body: JSON.stringify({ theme: "neon" }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("updates default provider", async () => {
      const res = await updatePreferences(
        createRequest("/api/users/preferences", {
          method: "PUT",
          body: JSON.stringify({
            defaults: { providerId: "openai" },
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.defaults.providerId).toBe("openai");
    });
  });

  describe("GET /api/users/history", () => {
    it("returns history entries", async () => {
      const res = await getHistory(createRequest("/api/users/history"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      const entries = json.data.items ?? json.data;
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it("each history entry has expected fields", async () => {
      const res = await getHistory(createRequest("/api/users/history"));
      const json = await res.json();

      const entries = json.data.items ?? json.data;
      for (const entry of entries) {
        expect(entry).toHaveProperty("id");
        expect(entry).toHaveProperty("type");
        expect(entry).toHaveProperty("description");
        expect(entry).toHaveProperty("timestamp");
      }
    });

    it("respects pageSize parameter", async () => {
      const res = await getHistory(
        createRequest("/api/users/history?limit=3"),
      );
      const json = await res.json();

      const entries = json.data.items ?? json.data;
      expect(entries.length).toBeLessThanOrEqual(3);
    });

    it("entries have valid event types", async () => {
      const res = await getHistory(createRequest("/api/users/history"));
      const json = await res.json();

      const validTypes = [
        "session_start",
        "session_end",
        "command_execute",
        "config_change",
        "model_switch",
        "webhook_create",
        "error",
      ];

      const entries = json.data.items ?? json.data;
      for (const entry of entries) {
        expect(validTypes).toContain(entry.type);
      }
    });
  });
});
