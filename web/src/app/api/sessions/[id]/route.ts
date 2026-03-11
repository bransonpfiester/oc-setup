import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { SessionDetailResponse, SessionSummary } from "@/types/api";
import { success, badRequest, notFound, internal } from "@/lib/api-helpers";
import { sessionsStore, sessionEventsStore } from "@/lib/stores/sessions";

/**
 * @description Retrieve detailed information for a single session including events and summary.
 * @param request - Incoming request
 * @param params.id - The session identifier
 * @returns SessionDetailResponse with session, events, and computed summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = sessionsStore.get(id);
    if (!session) {
      return notFound(`Session '${id}' not found`);
    }

    const events = sessionEventsStore.get(id) ?? [];

    const summary: SessionSummary = {
      totalMessages: events.filter((e) => e.type === "message").length,
      totalTokens: events.reduce((sum, e) => sum + e.tokens, 0),
      totalCost: session.totalCost,
      averageLatency:
        events.length > 0
          ? events.reduce((sum, e) => sum + e.latencyMs, 0) / events.length
          : 0,
      errorCount: events.filter((e) => e.type === "error").length,
    };

    const response: SessionDetailResponse = { session, events, summary };
    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
