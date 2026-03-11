import { NextRequest } from "next/server";
import {
  errorResponse,
  withErrorHandling,
  requireParam,
} from "@/lib/api-helpers";
import { webhooksStore } from "@/lib/stores/webhooks";

/**
 * @route DELETE /api/webhooks/{id}
 * @description Permanently delete a webhook registration. All pending
 *   deliveries for this webhook will be cancelled.
 * @param id - Webhook identifier
 * @returns 204 No Content on success
 */
export const DELETE = withErrorHandling(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  if (!webhooksStore.has(id)) {
    throw errorResponse("NOT_FOUND", `Webhook '${id}' not found`, 404);
  }

  webhooksStore.delete(id);
  return new Response(null, { status: 204 });
});
