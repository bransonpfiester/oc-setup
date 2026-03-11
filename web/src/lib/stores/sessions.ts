import type { Session, SessionEvent } from "@/types/api";

const now = new Date().toISOString();
const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
const twoHoursAgo = new Date(Date.now() - 7_200_000).toISOString();
const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();

export const sessionsStore = new Map<string, Session>([
  [
    "sess_001",
    {
      id: "sess_001",
      userId: "user_alpha",
      providerId: "anthropic",
      modelId: "claude-sonnet-4-20250514",
      status: "completed",
      title: "OpenClaw Gateway Setup",
      messageCount: 12,
      totalTokens: 15420,
      totalCost: 0.046,
      duration: 245,
      tags: ["setup", "gateway"],
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    },
  ],
  [
    "sess_002",
    {
      id: "sess_002",
      userId: "user_alpha",
      providerId: "openai",
      modelId: "gpt-4o",
      status: "active",
      title: "Telegram Bot Configuration",
      messageCount: 5,
      totalTokens: 8200,
      totalCost: 0.025,
      duration: 120,
      tags: ["config", "telegram"],
      createdAt: oneHourAgo,
      updatedAt: now,
    },
  ],
  [
    "sess_003",
    {
      id: "sess_003",
      userId: "user_beta",
      providerId: "anthropic",
      modelId: "claude-3-5-haiku-20241022",
      status: "failed",
      title: "Discord Channel Integration",
      messageCount: 3,
      totalTokens: 4100,
      totalCost: 0.008,
      duration: 60,
      tags: ["config", "discord", "error"],
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo,
    },
  ],
  [
    "sess_004",
    {
      id: "sess_004",
      userId: "user_gamma",
      providerId: "openai",
      modelId: "gpt-4o-mini",
      status: "expired",
      title: "API Key Rotation Check",
      messageCount: 2,
      totalTokens: 1800,
      totalCost: 0.003,
      duration: 30,
      tags: ["maintenance"],
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo,
    },
  ],
]);

export const sessionEventsStore = new Map<string, SessionEvent[]>([
  [
    "sess_001",
    [
      {
        id: "evt_001",
        type: "message",
        role: "user",
        content: "Set up the OpenClaw gateway with Anthropic provider",
        tokens: 42,
        latencyMs: 0,
        timestamp: twoHoursAgo,
        metadata: {},
      },
      {
        id: "evt_002",
        type: "message",
        role: "assistant",
        content:
          "I'll configure the OpenClaw gateway with the Anthropic provider. Let me verify your API key and set up the gateway configuration.",
        tokens: 156,
        latencyMs: 820,
        timestamp: twoHoursAgo,
        metadata: { model: "claude-sonnet-4-20250514" },
      },
      {
        id: "evt_003",
        type: "function_call",
        role: "assistant",
        content: "setupclaw --provider anthropic --channel telegram",
        tokens: 28,
        latencyMs: 150,
        timestamp: twoHoursAgo,
        metadata: { function: "execute_command" },
      },
      {
        id: "evt_004",
        type: "function_result",
        role: "system",
        content: "Gateway configured successfully on port 3000",
        tokens: 18,
        latencyMs: 2400,
        timestamp: oneHourAgo,
        metadata: { exitCode: 0 },
      },
      {
        id: "evt_005",
        type: "message",
        role: "assistant",
        content:
          "The gateway has been configured successfully! It's running on port 3000 with TLS enabled.",
        tokens: 98,
        latencyMs: 650,
        timestamp: oneHourAgo,
        metadata: {},
      },
    ],
  ],
  [
    "sess_002",
    [
      {
        id: "evt_010",
        type: "message",
        role: "user",
        content: "Help me configure the Telegram bot for OpenClaw",
        tokens: 35,
        latencyMs: 0,
        timestamp: oneHourAgo,
        metadata: {},
      },
      {
        id: "evt_011",
        type: "message",
        role: "assistant",
        content:
          "I'll help you set up the Telegram bot integration. First, I need your Telegram Bot Token from @BotFather.",
        tokens: 120,
        latencyMs: 740,
        timestamp: oneHourAgo,
        metadata: { model: "gpt-4o" },
      },
    ],
  ],
  [
    "sess_003",
    [
      {
        id: "evt_020",
        type: "message",
        role: "user",
        content: "Connect Discord to the OpenClaw agent",
        tokens: 28,
        latencyMs: 0,
        timestamp: oneDayAgo,
        metadata: {},
      },
      {
        id: "evt_021",
        type: "error",
        role: "system",
        content:
          "Discord API returned 401 Unauthorized. The bot token appears to be invalid.",
        tokens: 42,
        latencyMs: 1200,
        timestamp: oneDayAgo,
        metadata: { errorCode: "DISCORD_AUTH_FAILED" },
      },
    ],
  ],
]);
