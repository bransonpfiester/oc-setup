import { NextRequest } from "next/server";
import {
  successResponse,
  parseBody,
  parseSearchParams,
  withErrorHandling,
  buildPagination,
  generateId,
} from "@/lib/api-helpers";
import { webhookRegisterSchema, paginationSchema } from "@/types/api";
import type { Webhook, WebhookListResponse } from "@/types/api";
import { webhooksStore } from "@/lib/stores/webhooks";
import { randomBytes } from "crypto";

/**
 * @route GET /api/webhooks
 * @description List all registered webhooks with pagination.
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20)
 * @query status - Filter by webhook status
 * @returns {WebhookListResponse} Paginated list of webhooks
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const pagination = parseSearchParams(req, paginationSchema);
  const statusFilter = req.nextUrl.searchParams.get("status");

  let filtered = Array.from(webhooksStore.values());
  if (statusFilter) {
    filtered = filtered.filter((w) => w.status === statusFilter);
  }

  const start = (pagination.page - 1) * pagination.limit;
  const items = filtered.slice(start, start + pagination.limit);

  const response: WebhookListResponse = {
    items,
    pagination: buildPagination(filtered.length, pagination.page, pagination.limit),
  };

  return successResponse(response);
});

/**
 * @route POST /api/webhooks
 * @description Register a new webhook endpoint. Generates a signing secret
 *   if not provided. Supports custom headers and retry policies.
 * @body {WebhookRegisterRequest} Webhook configuration
 * @returns {Webhook} The newly registered webhook
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await parseBody(req, webhookRegisterSchema);

  const now = new Date().toISOString();
  const webhook: Webhook = {
    id: `wh_${generateId()}`,
    url: body.url,
    events: body.events,
    secret: body.secret ?? `whsec_${randomBytes(24).toString("hex")}`,
    status: "active",
    description: body.description ?? "",
    headers: body.headers ?? {},
    retryPolicy: {
      maxRetries: body.retryPolicy?.maxRetries ?? 3,
      retryIntervalMs: body.retryPolicy?.retryIntervalMs ?? 5000,
      backoffMultiplier: body.retryPolicy?.backoffMultiplier ?? 2,
    },
    lastTriggeredAt: null,
    deliveryStats: {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageLatencyMs: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  webhooksStore.set(webhook.id, webhook);
  return successResponse(webhook, 201);
});
