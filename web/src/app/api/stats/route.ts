import { NextRequest } from "next/server";
import {
  successResponse,
  parseBody,
  parseSearchParams,
  withErrorHandling,
  buildPagination,
  generateId,
} from "@/lib/api-helpers";
import {
  paginationSchema,
  sortSchema,
  statCreateSchema,
} from "@/types/api";
import type { Stat, StatListResponse } from "@/types/api";
import { statsStore } from "@/lib/stores/stats";

export { statsStore };

/**
 * @route GET /api/stats
 * @description List all stats with pagination, filtering, and sorting.
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query sortBy - Field to sort by (default: createdAt)
 * @query sortOrder - Sort direction: asc | desc (default: desc)
 * @query category - Filter by stat category
 * @returns {StatListResponse} Paginated list of stats
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const pagination = parseSearchParams(req, paginationSchema);
  const sort = parseSearchParams(req, sortSchema);
  const category = req.nextUrl.searchParams.get("category");

  let filtered = Array.from(statsStore.values());
  if (category) {
    filtered = filtered.filter((s) => s.category === category);
  }

  filtered.sort((a, b) => {
    const aVal = a[sort.sortBy as keyof Stat] ?? "";
    const bVal = b[sort.sortBy as keyof Stat] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal));
    return sort.sortOrder === "asc" ? cmp : -cmp;
  });

  const start = (pagination.page - 1) * pagination.limit;
  const items = filtered.slice(start, start + pagination.limit);

  const response: StatListResponse = {
    items,
    pagination: buildPagination(filtered.length, pagination.page, pagination.limit),
  };

  return successResponse(response);
});

/**
 * @route POST /api/stats
 * @description Create a new stat entry.
 * @body {StatCreate} Stat data to create
 * @returns {Stat} The newly created stat
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await parseBody(req, statCreateSchema);

  const now = new Date().toISOString();
  const stat: Stat = {
    id: generateId(),
    ...body,
    tags: body.tags ?? [],
    metadata: body.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };

  statsStore.set(stat.id, stat);
  return successResponse(stat, 201);
});
