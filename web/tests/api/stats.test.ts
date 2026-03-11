import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as listStats,
  POST as createStat,
  statsStore,
} from "../../src/app/api/stats/route";
import {
  GET as getStat,
  PUT as updateStat,
  DELETE as deleteStat,
} from "../../src/app/api/stats/[id]/route";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

function routeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Stats API", () => {
  beforeEach(() => {
    statsStore.clear();
  });

  describe("GET /api/stats", () => {
    it("returns empty paginated list when no stats exist", async () => {
      const res = await listStats(createRequest("/api/stats"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toEqual([]);
      expect(json.data.pagination).toBeDefined();
      expect(json.data.pagination.total).toBe(0);
    });

    it("returns paginated stats with default page size", async () => {
      const createReq = (name: string) =>
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name,
            value: 42,
            unit: "ms",
            category: "performance",
          }),
        });

      for (let i = 0; i < 3; i++) {
        await createStat(createReq(`stat-${i}`));
      }

      const res = await listStats(createRequest("/api/stats"));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toHaveLength(3);
      expect(json.data.pagination.total).toBe(3);
    });

    it("filters stats by category", async () => {
      await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "latency",
            value: 100,
            unit: "ms",
            category: "performance",
          }),
        }),
      );
      await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "cost",
            value: 5.5,
            unit: "usd",
            category: "cost",
          }),
        }),
      );

      const res = await listStats(
        createRequest("/api/stats?category=performance"),
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].category).toBe("performance");
    });

    it("respects page and pageSize params", async () => {
      for (let i = 0; i < 5; i++) {
        await createStat(
          createRequest("/api/stats", {
            method: "POST",
            body: JSON.stringify({
              name: `stat-${i}`,
              value: i,
              unit: "count",
              category: "usage",
            }),
          }),
        );
      }

      const res = await listStats(
        createRequest("/api/stats?page=1&pageSize=2"),
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toHaveLength(2);
      expect(json.data.pagination.total).toBe(5);
      expect(json.data.pagination.hasNext).toBe(true);
    });
  });

  describe("POST /api/stats", () => {
    it("creates a stat with valid data", async () => {
      const res = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "response_time",
            value: 250,
            unit: "ms",
            category: "performance",
            tags: ["api", "latency"],
          }),
        }),
      );

      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe("response_time");
      expect(json.data.value).toBe(250);
      expect(json.data.unit).toBe("ms");
      expect(json.data.id).toBeDefined();
      expect(json.data.createdAt).toBeDefined();
      expect(json.data.updatedAt).toBeDefined();
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({ name: "incomplete" }),
        }),
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 400 when name is empty string", async () => {
      const res = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "",
            value: 1,
            unit: "x",
            category: "usage",
          }),
        }),
      );

      expect(res.status).toBe(400);
    });

    it("stores the created stat in the store", async () => {
      const res = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "stored_stat",
            value: 99,
            unit: "count",
            category: "usage",
          }),
        }),
      );

      const json = await res.json();
      expect(statsStore.has(json.data.id)).toBe(true);
      expect(statsStore.get(json.data.id)?.name).toBe("stored_stat");
    });
  });

  describe("GET /api/stats/:id", () => {
    it("returns a stat by ID", async () => {
      const createRes = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "find_me",
            value: 7,
            unit: "count",
            category: "usage",
          }),
        }),
      );
      const { data: created } = await createRes.json();

      const res = await getStat(
        createRequest(`/api/stats/${created.id}`),
        routeCtx(created.id),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(created.id);
      expect(json.data.name).toBe("find_me");
    });

    it("returns 404 for non-existent ID", async () => {
      const res = await getStat(
        createRequest("/api/stats/nonexistent"),
        routeCtx("nonexistent"),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns correct structure for found stat", async () => {
      const createRes = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "structured",
            value: 10,
            unit: "ops",
            category: "performance",
            tags: ["test"],
            metadata: { env: "test" },
          }),
        }),
      );
      const { data: created } = await createRes.json();

      const res = await getStat(
        createRequest(`/api/stats/${created.id}`),
        routeCtx(created.id),
      );
      const json = await res.json();

      expect(json.data).toMatchObject({
        name: "structured",
        value: 10,
        unit: "ops",
        category: "performance",
        tags: ["test"],
        metadata: { env: "test" },
      });
    });
  });

  describe("PUT /api/stats/:id", () => {
    it("updates a stat with partial data", async () => {
      const createRes = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "original",
            value: 1,
            unit: "count",
            category: "usage",
          }),
        }),
      );
      const { data: created } = await createRes.json();

      const res = await updateStat(
        createRequest(`/api/stats/${created.id}`, {
          method: "PUT",
          body: JSON.stringify({ value: 99 }),
        }),
        routeCtx(created.id),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.value).toBe(99);
      expect(json.data.name).toBe("original");
    });

    it("returns 404 when updating non-existent stat", async () => {
      const res = await updateStat(
        createRequest("/api/stats/missing", {
          method: "PUT",
          body: JSON.stringify({ value: 1 }),
        }),
        routeCtx("missing"),
      );

      expect(res.status).toBe(404);
    });

    it("updates the updatedAt timestamp", async () => {
      const createRes = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "ts-check",
            value: 1,
            unit: "count",
            category: "usage",
          }),
        }),
      );
      const { data: created } = await createRes.json();

      await new Promise((r) => setTimeout(r, 10));

      const res = await updateStat(
        createRequest(`/api/stats/${created.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: "ts-updated" }),
        }),
        routeCtx(created.id),
      );
      const json = await res.json();

      expect(json.data.updatedAt).not.toBe(created.updatedAt);
    });
  });

  describe("DELETE /api/stats/:id", () => {
    it("deletes a stat and returns 204", async () => {
      const createRes = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "to_delete",
            value: 1,
            unit: "count",
            category: "usage",
          }),
        }),
      );
      const { data: created } = await createRes.json();

      const res = await deleteStat(
        createRequest(`/api/stats/${created.id}`, { method: "DELETE" }),
        routeCtx(created.id),
      );

      expect(res.status).toBe(204);
      expect(statsStore.has(created.id)).toBe(false);
    });

    it("returns 404 when deleting non-existent stat", async () => {
      const res = await deleteStat(
        createRequest("/api/stats/ghost", { method: "DELETE" }),
        routeCtx("ghost"),
      );

      expect(res.status).toBe(404);
    });

    it("confirms stat is removed from store after deletion", async () => {
      const createRes = await createStat(
        createRequest("/api/stats", {
          method: "POST",
          body: JSON.stringify({
            name: "ephemeral",
            value: 0,
            unit: "x",
            category: "custom",
          }),
        }),
      );
      const { data: created } = await createRes.json();

      expect(statsStore.size).toBe(1);
      await deleteStat(
        createRequest(`/api/stats/${created.id}`, { method: "DELETE" }),
        routeCtx(created.id),
      );
      expect(statsStore.size).toBe(0);
    });
  });
});
