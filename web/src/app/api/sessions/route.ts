import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { paginationParams, parseSearchParams } from "@/lib/validation";
import { success, badRequest, internal, paginateArray } from "@/lib/api-helpers";
import { sessionsStore } from "@/lib/stores/sessions";

/**
 * @description List all sessions with pagination support.
 * @param request - Incoming request with optional page/pageSize query params
 * @returns Paginated list of Session objects
 */
export async function GET(request: NextRequest) {
  try {
    const { page, pageSize } = parseSearchParams(
      paginationParams,
      request.nextUrl.searchParams,
    );

    const sessions = Array.from(sessionsStore.values());
    return success(paginateArray(sessions, page, pageSize));
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
