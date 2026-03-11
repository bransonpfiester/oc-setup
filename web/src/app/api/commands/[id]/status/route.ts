import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
  requireParam,
} from "@/lib/api-helpers";
import { commandsStore } from "@/lib/stores/commands";

/**
 * @route GET /api/commands/{id}/status
 * @description Poll the execution status of a previously submitted command.
 *   Returns current state, exit code (when finished), and progress info.
 * @param id - Command identifier returned from /api/commands/execute
 * @returns {CommandStatusResponse} Current command status
 */
export const GET = withErrorHandling(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  const record = commandsStore.get(id);
  if (!record) {
    throw errorResponse("NOT_FOUND", `Command '${id}' not found`, 404);
  }

  return successResponse(record.status);
});
