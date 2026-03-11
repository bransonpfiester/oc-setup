import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as listSessions } from "../../src/app/api/sessions/route";
import { GET as getSession } from "../../src/app/api/sessions/[id]/route";
import { POST as replaySession } from "../../src/app/api/sessions/[id]/replay/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

function routeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Sessions API", () => {
  describe("GET /api/sessions", () => {
    it("returns a list of sessions", async () => {
      const res = await listSessions(createRequest("/api/sessions"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it("sessions have expected fields", async () => {
      const res = await listSessions(createRequest("/api/sessions"));
      const json = await res.json();

      const sessions = Array.isArray(json.data) ? json.data : json.data.items ?? json.data;
      expect(sessions.length).toBeGreaterThan(0);

      const session = sessions[0];
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("userId");
      expect(session).toHaveProperty("providerId");
      expect(session).toHaveProperty("modelId");
      expect(session).toHaveProperty("status");
      expect(session).toHaveProperty("title");
    });

    it("contains pre-seeded sessions from the store", async () => {
      const res = await listSessions(createRequest("/api/sessions"));
      const json = await res.json();

      const sessions = Array.isArray(json.data) ? json.data : json.data.items ?? json.data;
      const ids = sessions.map((s: { id: string }) => s.id);
      expect(ids).toContain("sess_001");
      expect(ids).toContain("sess_002");
    });

    it("respects pagination params", async () => {
      const res = await listSessions(
        createRequest("/api/sessions?page=1&limit=2"),
      );
      const json = await res.json();

      const items = Array.isArray(json.data) ? json.data : json.data.items ?? json.data;
      expect(items.length).toBeLessThanOrEqual(2);
    });

    it("sessions have valid status values", async () => {
      const res = await listSessions(createRequest("/api/sessions"));
      const json = await res.json();

      const validStatuses = ["active", "completed", "failed", "expired"];
      const sessions = Array.isArray(json.data) ? json.data : json.data.items ?? json.data;
      for (const session of sessions) {
        expect(validStatuses).toContain(session.status);
      }
    });
  });

  describe("GET /api/sessions/:id", () => {
    it("returns session detail for existing session", async () => {
      const res = await getSession(
        createRequest("/api/sessions/sess_001"),
        routeCtx("sess_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.session).toBeDefined();
      expect(json.data.session.id).toBe("sess_001");
      expect(json.data.events).toBeDefined();
      expect(json.data.summary).toBeDefined();
    });

    it("returns 404 for non-existent session", async () => {
      const res = await getSession(
        createRequest("/api/sessions/nonexistent"),
        routeCtx("nonexistent"),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("session detail includes events array", async () => {
      const res = await getSession(
        createRequest("/api/sessions/sess_001"),
        routeCtx("sess_001"),
      );
      const json = await res.json();

      expect(Array.isArray(json.data.events)).toBe(true);
      expect(json.data.events.length).toBeGreaterThan(0);

      const event = json.data.events[0];
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("role");
      expect(event).toHaveProperty("content");
      expect(event).toHaveProperty("tokens");
    });

    it("session summary has correct structure", async () => {
      const res = await getSession(
        createRequest("/api/sessions/sess_001"),
        routeCtx("sess_001"),
      );
      const json = await res.json();

      expect(json.data.summary).toHaveProperty("totalMessages");
      expect(json.data.summary).toHaveProperty("totalTokens");
      expect(json.data.summary).toHaveProperty("totalCost");
      expect(json.data.summary).toHaveProperty("averageLatency");
      expect(json.data.summary).toHaveProperty("errorCount");
    });
  });

  describe("POST /api/sessions/:id/replay", () => {
    it("replays a valid session with default speed", async () => {
      const res = await replaySession(
        createRequest("/api/sessions/sess_001/replay", {
          method: "POST",
          body: JSON.stringify({ speed: 1 }),
        }),
        routeCtx("sess_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.sessionId).toBe("sess_001");
      expect(json.data.events).toBeDefined();
      expect(json.data.playbackSpeed).toBe(1);
      expect(typeof json.data.totalDuration).toBe("number");
    });

    it("returns 404 for non-existent session", async () => {
      const res = await replaySession(
        createRequest("/api/sessions/nonexistent/replay", {
          method: "POST",
          body: JSON.stringify({ speed: 1 }),
        }),
        routeCtx("nonexistent"),
      );

      expect(res.status).toBe(404);
    });

    it("adjusts event latency by playback speed", async () => {
      const normalRes = await replaySession(
        createRequest("/api/sessions/sess_001/replay", {
          method: "POST",
          body: JSON.stringify({ speed: 1 }),
        }),
        routeCtx("sess_001"),
      );
      const normalJson = await normalRes.json();

      const fastRes = await replaySession(
        createRequest("/api/sessions/sess_001/replay", {
          method: "POST",
          body: JSON.stringify({ speed: 2 }),
        }),
        routeCtx("sess_001"),
      );
      const fastJson = await fastRes.json();

      expect(fastJson.data.playbackSpeed).toBe(2);
      if (normalJson.data.events.length > 0 && fastJson.data.events.length > 0) {
        expect(fastJson.data.totalDuration).toBeLessThanOrEqual(
          normalJson.data.totalDuration,
        );
      }
    });

    it("supports fromStep parameter", async () => {
      const res = await replaySession(
        createRequest("/api/sessions/sess_001/replay", {
          method: "POST",
          body: JSON.stringify({ speed: 1, startFromEvent: 2 }),
        }),
        routeCtx("sess_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();

      const fullRes = await replaySession(
        createRequest("/api/sessions/sess_001/replay", {
          method: "POST",
          body: JSON.stringify({ speed: 1 }),
        }),
        routeCtx("sess_001"),
      );
      const fullJson = await fullRes.json();

      expect(json.data.events.length).toBeLessThan(
        fullJson.data.events.length,
      );
    });
  });
});
