import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { configValidate, parseBody } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

interface ValidationError {
  path: string;
  message: string;
  code: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  severity: "info" | "warning" | "error";
}

function hasNested(
  obj: Record<string, unknown>,
  ...keys: string[]
): boolean {
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return false;
    current = (current as Record<string, unknown>)[key];
  }
  return current != null && String(current).length > 0;
}

function normalizeConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const gateway =
    typeof config.gateway === "object" && config.gateway !== null
      ? (config.gateway as Record<string, unknown>)
      : {};

  return {
    ...config,
    version: config.version ?? "2.0.2",
    gateway: {
      host: "0.0.0.0",
      port: 18789,
      tls: false,
      corsOrigins: ["*"],
      ...gateway,
    },
  };
}

/**
 * @description Validate an OpenClaw configuration object for completeness and correctness.
 * @param request - The incoming Next.js request containing a config object and optional strict flag
 * @returns ConfigValidationResult with valid boolean, errors array, warnings array, and normalizedConfig
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseBody(configValidate, body);

    const config = data.config as Record<string, unknown>;
    const strict = data.strict as boolean;

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const requiredFields: Array<{ path: string; check: () => boolean }> = [
      {
        path: "version",
        check: () =>
          typeof config.version === "string" && config.version.length > 0,
      },
      {
        path: "user.name",
        check: () => hasNested(config, "user", "name"),
      },
      {
        path: "user.agentName",
        check: () => hasNested(config, "user", "agentName"),
      },
      {
        path: "channel",
        check: () =>
          typeof config.channel === "string" && config.channel.length > 0,
      },
      {
        path: "model.provider",
        check: () => hasNested(config, "model", "provider"),
      },
      {
        path: "model.modelId",
        check: () => hasNested(config, "model", "modelId"),
      },
      {
        path: "gateway.port",
        check: () => hasNested(config, "gateway", "port"),
      },
    ];

    for (const field of requiredFields) {
      if (!field.check()) {
        errors.push({
          path: field.path,
          message: `Missing required field: ${field.path}`,
          code: "MISSING_REQUIRED",
        });
      }
    }

    if (strict) {
      if (
        typeof config.personality !== "string" ||
        config.personality.length === 0
      ) {
        errors.push({
          path: "personality",
          message: "Personality is required in strict mode",
          code: "MISSING_REQUIRED",
        });
      }
      if (
        typeof config.timezone !== "string" ||
        config.timezone.length === 0
      ) {
        errors.push({
          path: "timezone",
          message: "Timezone is required in strict mode",
          code: "MISSING_REQUIRED",
        });
      }
    }

    if (!config.personality) {
      warnings.push({
        field: "personality",
        message: "No personality configured; a default will be used",
        severity: "info",
      });
    }

    const gateway = config.gateway as Record<string, unknown> | undefined;
    if (gateway && typeof gateway.port === "number" && gateway.port < 1024) {
      warnings.push({
        field: "gateway.port",
        message: "Ports below 1024 require elevated privileges",
        severity: "warning",
      });
    }

    const valid = errors.length === 0;
    const normalizedConfig = valid ? normalizeConfig(config) : null;

    return success({ valid, errors, warnings, normalizedConfig });
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
