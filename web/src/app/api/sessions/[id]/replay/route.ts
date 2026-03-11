import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { SessionReplayResponse } from "@/types/api";
import { sessionReplay, parseBody } from "@/lib/validation";
import { success, badRequest, notFound, internal } from "@/lib/api-helpers";
import { sessionsStore, sessionEventsStore } from "@/lib/stores/sessions";

/**
 * @description Replay a session's events with adjustable playback speed.
 * @param request - Incoming request with SessionReplayRequest body
 * @param params.id - The session identifier to replay
 * @returns SessionReplayResponse with adjusted events and total duration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = sessionsStore.get(id);
    if (!session) {
      return notFound(`Session '${id}' not found`);
    }

    const body = parseBody(sessionReplay, await request.json());
    const originalEvents = sessionEventsStore.get(id) ?? [];

    let events =
      body.fromStep != null
        ? originalEvents.slice(body.fromStep)
        : [...originalEvents];

    events = events.map((evt) => ({
      ...evt,
      latencyMs: Math.round(evt.latencyMs / body.speed),
    }));

    const totalDuration = events.reduce((sum, e) => sum + e.latencyMs, 0);

    const response: SessionReplayResponse = {
      sessionId: id,
      events,
      totalDuration,
      playbackSpeed: body.speed,
    };

    return success(response);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
