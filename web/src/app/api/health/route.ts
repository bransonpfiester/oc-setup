import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { success, badRequest, internal } from "@/lib/api-helpers";
import type { HealthStatus, HealthCheck, ServiceStatus } from "@/types/api";
import * as fs from "node:fs";

/**
 * @description Return the current health status of the OpenClaw API service.
 * @param _request - The incoming Next.js request (unused)
 * @returns HealthStatus with service status, version, uptime, environment, and component checks
 */
export async function GET(_request: NextRequest) {
  try {
    const checks: HealthCheck[] = [];

    checks.push({
      name: "node_runtime",
      status: "healthy",
      latencyMs: 0,
      message: `Node ${process.version}`,
    });

    const fsStart = Date.now();
    let fsStatus: ServiceStatus = "healthy";
    let fsMessage = "Filesystem accessible";
    try {
      fs.accessSync(process.cwd(), fs.constants.R_OK);
    } catch {
      fsStatus = "unhealthy";
      fsMessage = "Cannot access working directory";
    }
    checks.push({
      name: "filesystem",
      status: fsStatus,
      latencyMs: Date.now() - fsStart,
      message: fsMessage,
    });

    const memUsage = process.memoryUsage();
    const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const memStatus: ServiceStatus =
      heapPercent > 90 ? "degraded" : "healthy";
    checks.push({
      name: "memory",
      status: memStatus,
      latencyMs: 0,
      message: `Heap usage: ${heapPercent.toFixed(1)}%`,
    });

    const overallStatus: ServiceStatus = checks.some(
      (c) => c.status === "unhealthy",
    )
      ? "unhealthy"
      : checks.some((c) => c.status === "degraded")
        ? "degraded"
        : "healthy";

    const health: HealthStatus = {
      status: overallStatus,
      version: "2.0.2",
      uptime: Math.floor(process.uptime() * 1000),
      environment: process.env.NODE_ENV ?? "development",
      checks,
    };

    return success(health);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
