import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { userPreferencesUpdate, parseBody } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

interface StoredPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    webhook: boolean;
    setupAlerts: boolean;
    healthAlerts: boolean;
  };
  defaults: {
    provider: string;
    channel: string;
    model: string;
  };
}

let preferences: StoredPreferences = {
  theme: "system",
  language: "en",
  timezone: "UTC",
  notifications: {
    email: true,
    webhook: false,
    setupAlerts: true,
    healthAlerts: true,
  },
  defaults: {
    provider: "anthropic",
    channel: "telegram",
    model: "claude-sonnet-4-20250514",
  },
};

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = (result as Record<string, unknown>)[key];
    if (
      srcVal != null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal != null &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      (result as Record<string, unknown>)[key] = srcVal;
    }
  }
  return result;
}

/**
 * @description Return the current user preferences.
 * @param _request - The incoming Next.js request (unused)
 * @returns Current user preferences object
 */
export async function GET(_request: NextRequest) {
  try {
    return success(preferences);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}

/**
 * @description Update user preferences via deep merge with existing values.
 * @param request - The incoming Next.js request with partial preferences to update
 * @returns Updated user preferences object after merge
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = parseBody(userPreferencesUpdate, body);

    preferences = deepMerge(preferences, updates as Record<string, unknown>);

    return success(preferences);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
