import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  parseSearchParams,
  withErrorHandling,
  requireParam,
} from "@/lib/api-helpers";
import { paginationSchema } from "@/types/api";
import type { CommandLogsResponse } from "@/types/api";
import { commandsStore } from "@/lib/stores/commands";

/**
 * @route GET /api/commands/{id}/logs
 * @description Retrieve stdout/stderr logs for a command execution.
 *   Supports pagination for large log outputs.
 * @param id - Command identifier
 * @query page - Page number (default: 1)
 * @query limit - Lines per page (default: 20, max: 100)
 * @query stream - Filter by stream: stdout | stderr
 * @returns {CommandLogsResponse} Paginated log output
 */
export const GET = withErrorHandling(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  const record = commandsStore.get(id);
  if (!record) {
    throw errorResponse("NOT_FOUND", `Command '${id}' not found`, 404);
  }

  const pagination = parseSearchParams(req, paginationSchema);
  const streamFilter = req.nextUrl.searchParams.get("stream");

  let filtered = streamFilter
    ? record.logs.filter((l) => l.stream === streamFilter)
    : [...record.logs];

  const totalLines = filtered.length;
  const start = (pagination.page - 1) * pagination.limit;
  filtered = filtered.slice(start, start + pagination.limit);

  const response: CommandLogsResponse = {
    commandId: id,
    logs: filtered,
    totalLines,
    truncated: totalLines > start + pagination.limit,
  };

  return successResponse(response);
});
