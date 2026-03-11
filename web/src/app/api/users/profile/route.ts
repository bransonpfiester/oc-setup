import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { success, badRequest, internal } from "@/lib/api-helpers";
import type { UserProfile } from "@/types/api";

const MOCK_PROFILE: UserProfile = {
  id: "usr_00000000-0000-0000-0000-000000000001",
  email: "user@openclaw.dev",
  displayName: "OpenClaw User",
  avatarUrl: null,
  role: "admin",
  organization: null,
  createdAt: "2025-01-01T00:00:00Z",
  lastLoginAt: new Date().toISOString(),
  stats: {
    totalSessions: 42,
    totalCommands: 187,
    totalTokensUsed: 1_250_000,
    favoriteModel: "claude-sonnet-4-20250514",
  },
};

/**
 * @description Return the current user's profile (mock data until auth is integrated).
 * @param _request - The incoming Next.js request (unused)
 * @returns UserProfile with display name, role, stats, and preferred settings
 */
export async function GET(_request: NextRequest) {
  try {
    return success({
      ...MOCK_PROFILE,
      lastLoginAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
