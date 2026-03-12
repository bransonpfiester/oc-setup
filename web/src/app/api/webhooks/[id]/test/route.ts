import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
  requireParam,
} from "@/lib/api-helpers";
import type { WebhookTestResponse, WebhookTestPayload } from "@/types/api";
import { webhooksStore } from "@/lib/stores/webhooks";

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return false;
    if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) return false;
    if (hostname.startsWith("172.")) {
      const second = parseInt(hostname.split(".")[1]);
      if (second >= 16 && second <= 31) return false;
    }
    if (hostname === "169.254.169.254") return false;
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

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

  if (!isAllowedWebhookUrl(webhook.url)) {
    throw errorResponse("INVALID_URL", "Webhook URL targets a private or restricted address", 400);
  }

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
