import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandling,
  requireParam,
} from "@/lib/api-helpers";
import { statUpdateSchema } from "@/types/api";
import type { Stat, StatDetailResponse } from "@/types/api";
import { statsStore, statHistoryStore } from "@/lib/stores/stats";

/**
 * @route GET /api/stats/{id}
 * @description Retrieve a single stat by ID, including its value history.
 * @param id - The unique stat identifier
 * @returns {StatDetailResponse} Stat with history data
 */
export const GET = withErrorHandling(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  const stat = statsStore.get(id);
  if (!stat) {
    throw errorResponse("NOT_FOUND", `Stat with id '${id}' not found`, 404);
  }

  const response: StatDetailResponse = {
    stat,
    history: statHistoryStore.get(id) ?? [],
  };

  return successResponse(response);
});

/**
 * @route PUT /api/stats/{id}
 * @description Update an existing stat. Partial updates are supported.
 * @param id - The unique stat identifier
 * @body {StatUpdate} Fields to update
 * @returns {Stat} The updated stat
 */
export const PUT = withErrorHandling(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  const existing = statsStore.get(id);
  if (!existing) {
    throw errorResponse("NOT_FOUND", `Stat with id '${id}' not found`, 404);
  }

  const body = await parseBody(req, statUpdateSchema);

  if (body.value !== undefined && body.value !== existing.value) {
    const history = statHistoryStore.get(id) ?? [];
    history.push({ value: existing.value, timestamp: existing.updatedAt });
    statHistoryStore.set(id, history);
  }

  const updated: Stat = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString(),
  };
  statsStore.set(id, updated);

  return successResponse(updated);
});

/**
 * @route DELETE /api/stats/{id}
 * @description Permanently delete a stat and its history.
 * @param id - The unique stat identifier
 * @returns {{ deleted: true }} Confirmation of deletion
 */
export const DELETE = withErrorHandling(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  if (!statsStore.has(id)) {
    throw errorResponse("NOT_FOUND", `Stat with id '${id}' not found`, 404);
  }

  statsStore.delete(id);
  statHistoryStore.delete(id);

  return successResponse({ deleted: true });
});
