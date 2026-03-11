import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as executeCommand } from "../../src/app/api/commands/execute/route";
import { GET as getCommandStatus } from "../../src/app/api/commands/[id]/status/route";
import { GET as getCommandLogs } from "../../src/app/api/commands/[id]/logs/route";
import { commandsStore } from "../../src/lib/stores/commands";

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

function routeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Commands API", () => {
  describe("POST /api/commands/execute", () => {
    it("executes a valid whitelisted command", async () => {
      const res = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({
            command: "setupclaw",
            args: ["--provider", "anthropic"],
          }),
        }),
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.commandId).toBeDefined();
      expect(json.data.status).toBe("queued");
      expect(json.data.startedAt).toBeDefined();
    });

    it("returns 400 for forbidden (non-whitelisted) command", async () => {
      const res = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({
            command: "rm",
            args: ["-rf", "/"],
          }),
        }),
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("accepts npm as a valid command", async () => {
      const res = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({
            command: "npm",
            args: ["install"],
          }),
        }),
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.status).toBe("queued");
    });

    it("stores the command in the commands store", async () => {
      const res = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({
            command: "openclaw",
            args: ["start"],
          }),
        }),
      );

      const json = await res.json();
      expect(commandsStore.has(json.data.commandId)).toBe(true);
    });

    it("returns estimatedDuration matching timeout", async () => {
      const res = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({
            command: "node",
            args: ["--version"],
            timeout: 5000,
          }),
        }),
      );

      const json = await res.json();
      expect(json.data.estimatedDuration).toBe(5000);
    });

    it("returns 400 when command field is missing", async () => {
      const res = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({ args: ["test"] }),
        }),
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/commands/:id/status", () => {
    it("returns status for a pre-seeded command", async () => {
      const res = await getCommandStatus(
        createRequest("/api/commands/cmd_001/status"),
        routeCtx("cmd_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.commandId).toBe("cmd_001");
      expect(json.data.command).toBe("setupclaw");
      expect(json.data.status).toBe("completed");
      expect(json.data.exitCode).toBe(0);
    });

    it("returns 404 for non-existent command", async () => {
      const res = await getCommandStatus(
        createRequest("/api/commands/cmd_nonexistent/status"),
        routeCtx("cmd_nonexistent"),
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("includes progress information when available", async () => {
      const res = await getCommandStatus(
        createRequest("/api/commands/cmd_001/status"),
        routeCtx("cmd_001"),
      );
      const json = await res.json();

      expect(json.data.progress).toBeDefined();
      expect(json.data.progress.percentage).toBe(100);
      expect(json.data.progress.totalSteps).toBe(5);
    });

    it("returns running status for in-progress command", async () => {
      const res = await getCommandStatus(
        createRequest("/api/commands/cmd_002/status"),
        routeCtx("cmd_002"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe("running");
      expect(json.data.exitCode).toBeNull();
    });

    it("status response includes timing information", async () => {
      const res = await getCommandStatus(
        createRequest("/api/commands/cmd_001/status"),
        routeCtx("cmd_001"),
      );
      const json = await res.json();

      expect(json.data.startedAt).toBeDefined();
      expect(json.data.completedAt).toBeDefined();
      expect(json.data.duration).toBeDefined();
    });
  });

  describe("GET /api/commands/:id/logs", () => {
    it("returns logs for a pre-seeded command", async () => {
      const res = await getCommandLogs(
        createRequest("/api/commands/cmd_001/logs"),
        routeCtx("cmd_001"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.commandId).toBe("cmd_001");
      expect(Array.isArray(json.data.logs)).toBe(true);
      expect(json.data.logs.length).toBeGreaterThan(0);
      expect(json.data.totalLines).toBe(json.data.logs.length);
    });

    it("returns 404 for non-existent command", async () => {
      const res = await getCommandLogs(
        createRequest("/api/commands/cmd_nonexistent/logs"),
        routeCtx("cmd_nonexistent"),
      );

      expect(res.status).toBe(404);
    });

    it("log entries have expected fields", async () => {
      const res = await getCommandLogs(
        createRequest("/api/commands/cmd_001/logs"),
        routeCtx("cmd_001"),
      );
      const json = await res.json();

      for (const log of json.data.logs) {
        expect(log).toHaveProperty("id");
        expect(log).toHaveProperty("commandId");
        expect(log).toHaveProperty("stream");
        expect(log).toHaveProperty("content");
        expect(log).toHaveProperty("timestamp");
        expect(log).toHaveProperty("lineNumber");
        expect(["stdout", "stderr"]).toContain(log.stream);
      }
    });

    it("includes truncated flag", async () => {
      const res = await getCommandLogs(
        createRequest("/api/commands/cmd_001/logs"),
        routeCtx("cmd_001"),
      );
      const json = await res.json();
      expect(typeof json.data.truncated).toBe("boolean");
    });

    it("logs for newly executed command contain initial entry", async () => {
      const execRes = await executeCommand(
        createRequest("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify({
            command: "npx",
            args: ["--help"],
          }),
        }),
      );
      const execJson = await execRes.json();

      const logsRes = await getCommandLogs(
        createRequest(`/api/commands/${execJson.data.commandId}/logs`),
        routeCtx(execJson.data.commandId),
      );
      const logsJson = await logsRes.json();

      expect(logsJson.data.logs.length).toBeGreaterThanOrEqual(1);
      expect(logsJson.data.logs[0].content).toContain("queued");
    });
  });
});
