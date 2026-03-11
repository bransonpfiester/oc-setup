import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as listWebhooks,
  POST as registerWebhook,
} from "../../src/app/api/webhooks/route";
import { DELETE as deleteWebhook } from "../../src/app/api/webhooks/[id]/route";
import { POST as testWebhook } from "../../src/app/api/webhooks/[id]/test/route";
import { webhooksStore } from "../../src/lib/stores/webhooks";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

function routeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Webhooks API", () => {
  describe("GET /api/webhooks", () => {
    it("returns a list of webhooks", async () => {
      const res = await listWebhooks(createRequest("/api/webhooks"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it("contains pre-seeded webhooks", async () => {
      const res = await listWebhooks(createRequest("/api/webhooks"));
      const json = await res.json();

      const items = Array.isArray(json.data) ? json.data : json.data.items ?? json.data;
      const ids = items.map((w: { id: string }) => w.id);
      expect(ids).toContain("wh_001");
      expect(ids).toContain("wh_002");
    });

    it("each webhook has expected fields", async () => {
      const res = await listWebhooks(createRequest("/api/webhooks"));
      const json = await res.json();

      const items = Array.isArray(json.data) ? json.data : json.data.items ?? json.data;
      for (const wh of items) {
        expect(wh).toHaveProperty("id");
        expect(wh).toHaveProperty("url");
        expect(wh).toHaveProperty("events");
        expect(wh).toHaveProperty("status");
        expect(wh).toHaveProperty("secret");
      }
    });
  });

  describe("POST /api/webhooks", () => {
    it("registers a new webhook with valid data", async () => {
      const res = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "https://hooks.example.com/test",
            events: ["session.completed", "config.updated"],
            description: "Test hook",
          }),
        }),
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.id).toBeDefined();
      expect(json.data.url).toBe("https://hooks.example.com/test");
      expect(json.data.events).toContain("session.completed");
      expect(json.data.secret).toBeDefined();
      expect(json.data.status).toBe("active");
    });

    it("generates secret when not provided", async () => {
      const res = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "https://hooks.example.com/auto-secret",
            events: ["command.executed"],
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.secret).toBeDefined();
      expect(json.data.secret.startsWith("whsec_")).toBe(true);
    });

    it("returns 400 when URL is invalid", async () => {
      const res = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "not-a-url",
            events: ["config.updated"],
          }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("returns 400 when events array is empty", async () => {
      const res = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "https://hooks.example.com/empty",
            events: [],
          }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("stores the webhook in the store", async () => {
      const res = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "https://hooks.example.com/stored",
            events: ["health.degraded"],
          }),
        }),
      );

      const json = await res.json();
      expect(webhooksStore.has(json.data.id)).toBe(true);
    });
  });

  describe("DELETE /api/webhooks/:id", () => {
    it("deletes an existing webhook and returns 204", async () => {
      const createRes = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "https://hooks.example.com/to-delete",
            events: ["command.failed"],
          }),
        }),
      );
      const { data: created } = await createRes.json();

      const res = await deleteWebhook(
        createRequest(`/api/webhooks/${created.id}`, { method: "DELETE" }),
        routeCtx(created.id),
      );

      expect(res.status).toBe(204);
      expect(webhooksStore.has(created.id)).toBe(false);
    });

    it("returns 404 for non-existent webhook", async () => {
      const res = await deleteWebhook(
        createRequest("/api/webhooks/wh_nonexistent", { method: "DELETE" }),
        routeCtx("wh_nonexistent"),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("removes the webhook from the store", async () => {
      const createRes = await registerWebhook(
        createRequest("/api/webhooks", {
          method: "POST",
          body: JSON.stringify({
            url: "https://hooks.example.com/remove-test",
            events: ["command.failed"],
          }),
        }),
      );
      const { data: created } = await createRes.json();

      const sizeBefore = webhooksStore.size;
      await deleteWebhook(
        createRequest(`/api/webhooks/${created.id}`, { method: "DELETE" }),
        routeCtx(created.id),
      );
      expect(webhooksStore.size).toBe(sizeBefore - 1);
    });
  });

  describe("POST /api/webhooks/:id/test", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("sends test delivery to existing webhook", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 200 }),
      );

      const res = await testWebhook(
        createRequest("/api/webhooks/wh_001/test", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        routeCtx("wh_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.webhookId).toBe("wh_001");
      expect(json.data.delivered).toBe(true);
      expect(json.data.statusCode).toBe(200);
      expect(json.data.payload).toBeDefined();
    });

    it("returns 404 for non-existent webhook", async () => {
      const res = await testWebhook(
        createRequest("/api/webhooks/wh_nonexistent/test", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        routeCtx("wh_nonexistent"),
      );

      expect(res.status).toBe(404);
    });

    it("reports delivery failure when fetch throws", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new Error("Connection refused"),
      );

      const res = await testWebhook(
        createRequest("/api/webhooks/wh_001/test", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        routeCtx("wh_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.delivered).toBe(false);
      expect(json.data.error).toBeDefined();
    });

    it("includes payload with event and timestamp", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 200 }),
      );

      const res = await testWebhook(
        createRequest("/api/webhooks/wh_001/test", {
          method: "POST",
          body: JSON.stringify({
            event: "setup.completed",
          }),
        }),
        routeCtx("wh_001"),
      );

      const json = await res.json();
      expect(json.data.payload.event).toBe("setup.completed");
      expect(json.data.payload.timestamp).toBeDefined();
    });
  });
});
