import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { success, badRequest, internal } from "@/lib/api-helpers";
import type {
  HealthDependency,
  HealthDependenciesResponse,
  ServiceStatus,
} from "@/types/api";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

async function checkExternalApi(
  url: string,
  timeoutMs = 5000,
): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - start };
  }
}

/**
 * @description Check the health status of all service dependencies.
 * @param _request - The incoming Next.js request (unused)
 * @returns HealthDependenciesResponse with individual dependency statuses and overall health flag
 */
export async function GET(_request: NextRequest) {
  try {
    const dependencies: HealthDependency[] = [];

    dependencies.push({
      name: "node_runtime",
      type: "service",
      status: "healthy",
      latencyMs: 0,
      version: process.version,
    });

    const fsStart = Date.now();
    let fsStatus: ServiceStatus = "healthy";
    try {
      fs.accessSync(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      fsStatus = "unhealthy";
    }
    dependencies.push({
      name: "filesystem",
      type: "filesystem",
      status: fsStatus,
      latencyMs: Date.now() - fsStart,
    });

    const [anthropicResult, openaiResult] = await Promise.all([
      checkExternalApi("https://api.anthropic.com"),
      checkExternalApi("https://api.openai.com"),
    ]);

    dependencies.push({
      name: "anthropic_api",
      type: "external_api",
      ...anthropicResult,
    });

    dependencies.push({
      name: "openai_api",
      type: "external_api",
      ...openaiResult,
    });

    const configPath = path.join(os.homedir(), ".openclaw");
    const configStart = Date.now();
    let configStatus: ServiceStatus = "healthy";
    try {
      fs.accessSync(configPath, fs.constants.R_OK);
    } catch {
      configStatus = "degraded";
    }
    dependencies.push({
      name: "config_store",
      type: "filesystem",
      status: configStatus,
      latencyMs: Date.now() - configStart,
      details: { path: configPath },
    });

    const allHealthy = dependencies.every((d) => d.status === "healthy");
    const response: HealthDependenciesResponse = { dependencies, allHealthy };

    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
