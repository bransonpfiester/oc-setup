import type { Webhook } from "@/types/api";

export const webhooksStore = new Map<string, Webhook>();

webhooksStore.set("wh_001", {
  id: "wh_001",
  url: "https://hooks.example.com/prod",
  events: ["session.created", "session.completed"],
  secret: "whsec_a1b2c3d4e5f6",
  status: "active",
  description: "Production webhook",
  headers: {},
  retryPolicy: { maxRetries: 3, retryIntervalMs: 5000, backoffMultiplier: 2 },
  lastTriggeredAt: "2025-03-09T12:00:00Z",
  deliveryStats: { totalDeliveries: 150, successfulDeliveries: 148, failedDeliveries: 2, averageLatencyMs: 120 },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-03-09T12:00:00Z",
});

webhooksStore.set("wh_002", {
  id: "wh_002",
  url: "https://hooks.example.com/staging",
  events: ["command.executed", "error.critical"],
  secret: "whsec_x9y8z7w6v5u4",
  status: "active",
  description: "Staging webhook",
  headers: { "X-Custom": "staging" },
  retryPolicy: { maxRetries: 5, retryIntervalMs: 10000, backoffMultiplier: 3 },
  lastTriggeredAt: null,
  deliveryStats: { totalDeliveries: 20, successfulDeliveries: 20, failedDeliveries: 0, averageLatencyMs: 95 },
  createdAt: "2025-02-01T00:00:00Z",
  updatedAt: "2025-02-01T00:00:00Z",
});
