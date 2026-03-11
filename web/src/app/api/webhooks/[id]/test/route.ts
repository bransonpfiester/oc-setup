import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
  requireParam,
} from "@/lib/api-helpers";
import type { WebhookTestResponse, WebhookTestPayload } from "@/types/api";
import { webhooksStore } from "@/lib/stores/webhooks";

/**
 * @route POST /api/webhooks/{id}/test
 * @description Send a test payload to a webhook endpoint to verify connectivity.
 *   Does not count against delivery statistics. Uses a synthetic event payload.
 * @param id - Webhook identifier
 * @returns {WebhookTestResponse} Delivery result including status code and latency
 */
export const POST = withErrorHandling(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  requireParam({ id }, "id");

  const webhook = webhooksStore.get(id);
  if (!webhook) {
    throw errorResponse("NOT_FOUND", `Webhook '${id}' not found`, 404);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const payload: WebhookTestPayload = {
    event: (body.event as string) ?? "webhook.test",
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test delivery from OpenClaw API",
      webhookId: id,
    },
  };

  try {
    const start = Date.now();
    const fetchRes = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...webhook.headers },
      body: JSON.stringify(payload),
    });

    const response: WebhookTestResponse = {
      webhookId: id,
      delivered: true,
      statusCode: fetchRes.status,
      responseTime: Date.now() - start,
      error: null,
      payload,
    };
    return successResponse(response);
  } catch (err) {
    const response: WebhookTestResponse = {
      webhookId: id,
      delivered: false,
      statusCode: null,
      responseTime: null,
      error: err instanceof Error ? err.message : "Unknown error",
      payload,
    };
    return successResponse(response);
  }
});
