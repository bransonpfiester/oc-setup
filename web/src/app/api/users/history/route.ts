import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  paginationParams,
  parseSearchParams,
} from "@/lib/validation";
import {
  paginated,
  badRequest,
  internal,
} from "@/lib/api-helpers";
import type { UserHistoryEntry, HistoryEventType } from "@/types/api";

function mockEntry(
  id: string,
  type: HistoryEventType,
  description: string,
  resourceId: string | null,
  metadata: Record<string, unknown>,
  hoursAgo: number,
): UserHistoryEntry {
  return {
    id,
    type,
    description,
    resourceId,
    metadata,
    timestamp: new Date(
      Date.now() - hoursAgo * 3_600_000,
    ).toISOString(),
  };
}

const MOCK_HISTORY: UserHistoryEntry[] = [
  mockEntry(
    crypto.randomUUID(),
    "session_start",
    "Started a new chat session with Claude Sonnet 4",
    "sess_001",
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    1,
  ),
  mockEntry(
    crypto.randomUUID(),
    "command_execute",
    "Ran 'openclaw start' to launch the gateway",
    "cmd_001",
    { command: "openclaw start", exitCode: 0 },
    2,
  ),
  mockEntry(
    crypto.randomUUID(),
    "config_change",
    "Updated gateway port from 18789 to 3000",
    "cfg_001",
    { field: "gateway.port", oldValue: 18789, newValue: 3000 },
    5,
  ),
  mockEntry(
    crypto.randomUUID(),
    "model_switch",
    "Switched model from GPT-4o to Claude Sonnet 4",
    null,
    { from: "gpt-4o", to: "claude-sonnet-4-20250514" },
    8,
  ),
  mockEntry(
    crypto.randomUUID(),
    "session_end",
    "Chat session completed after 23 messages",
    "sess_001",
    { messageCount: 23, tokensUsed: 14500, duration: 1800 },
    12,
  ),
  mockEntry(
    crypto.randomUUID(),
    "webhook_create",
    "Registered webhook for config.updated events",
    "wh_001",
    { url: "https://example.com/hook", events: ["config.updated"] },
    24,
  ),
  mockEntry(
    crypto.randomUUID(),
    "error",
    "API key validation failed for OpenAI provider",
    null,
    { provider: "openai", errorCode: "INVALID_API_KEY" },
    36,
  ),
  mockEntry(
    crypto.randomUUID(),
    "session_start",
    "Started a new chat session with GPT-4o",
    "sess_002",
    { provider: "openai", model: "gpt-4o" },
    48,
  ),
  mockEntry(
    crypto.randomUUID(),
    "command_execute",
    "Ran 'openclaw config validate' on current config",
    "cmd_002",
    { command: "openclaw config validate", exitCode: 0 },
    60,
  ),
  mockEntry(
    crypto.randomUUID(),
    "config_change",
    "Updated personality prompt for agent",
    "cfg_002",
    { field: "personality", changeType: "update" },
    72,
  ),
];

/**
 * @description Return paginated user activity history with various event types.
 * @param request - The incoming Next.js request with optional page/pageSize query params
 * @returns Paginated list of UserHistoryEntry objects
 */
export async function GET(request: NextRequest) {
  try {
    const { page, pageSize } = parseSearchParams(
      paginationParams,
      request.nextUrl.searchParams,
    );

    return paginated(
      MOCK_HISTORY.slice((page - 1) * pageSize, page * pageSize),
      MOCK_HISTORY.length,
      page,
      pageSize,
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
