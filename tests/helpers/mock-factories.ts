import type { SetupContext, Channel } from "../../src/steps/context.js";
import type { OpenClawConfig } from "../../src/lib/config.js";
import type { PlatformInfo } from "../../src/lib/platform.js";
import type { TelegramBotInfo } from "../../src/lib/telegram.js";
import type { TemplateInputs, PersonalityPreset } from "../../src/lib/templates.js";

export function createMockContext(overrides: Partial<SetupContext> = {}): SetupContext {
  return {
    os: { platform: "macos", arch: "arm64", display: "macOS (arm64)" },
    nodeVersion: "v22.0.0",
    openclawVersion: "1.0.0",
    userName: "TestUser",
    agentName: "TestAgent",
    timezone: "America/New_York",
    channel: "telegram" as Channel,
    telegramUserId: "123456789",
    telegram: { token: "12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR", botUsername: "test_bot" },
    discord: null,
    mattermost: null,
    model: {
      provider: "anthropic",
      apiKey: "sk-ant-test-key-12345",
      modelId: "claude-sonnet-4-5-20250514",
      authMethod: "api-key",
    },
    personality: {
      description: "Helpful and friendly",
      focusAreas: ["Email monitoring", "Calendar management"],
    },
    skills: [],
    gatewayPort: 18789,
    gatewayPid: null,
    ...overrides,
  };
}

export function createEmptyContext(): SetupContext {
  return {
    os: { platform: "", arch: "", display: "" },
    nodeVersion: "",
    openclawVersion: null,
    userName: "",
    agentName: "",
    timezone: "UTC",
    channel: "telegram",
    telegramUserId: "",
    telegram: null,
    discord: null,
    mattermost: null,
    model: null,
    personality: { description: "", focusAreas: [] },
    skills: [],
    gatewayPort: 18789,
    gatewayPid: null,
  };
}

export function createMockConfig(overrides: Partial<OpenClawConfig> = {}): OpenClawConfig {
  return {
    version: "1.0.0",
    user: {
      name: "TestUser",
      agentName: "TestAgent",
      timezone: "America/New_York",
    },
    telegram: {
      token: "12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR",
      botUsername: "test_bot",
    },
    model: {
      provider: "anthropic",
      apiKey: "sk-ant-test-key",
      modelId: "claude-sonnet-4-5-20250514",
    },
    gateway: {
      port: 18789,
      pid: 1234,
    },
    personality: {
      description: "Helpful assistant",
      focusAreas: ["Email monitoring"],
    },
    ...overrides,
  };
}

export function createMockPlatformInfo(overrides: Partial<PlatformInfo> = {}): PlatformInfo {
  return {
    platform: "macos",
    arch: "arm64",
    display: "macOS (arm64)",
    serviceManager: "launchd",
    ...overrides,
  };
}

export function createMockTelegramBotInfo(overrides: Partial<TelegramBotInfo> = {}): TelegramBotInfo {
  return {
    id: 12345678,
    username: "test_bot",
    firstName: "Test Bot",
    ...overrides,
  };
}

export function createMockTemplateInputs(overrides: Partial<TemplateInputs> = {}): TemplateInputs {
  return {
    userName: "TestUser",
    agentName: "TestAgent",
    timezone: "America/New_York",
    personalityDescription: "Helpful and friendly",
    focusAreas: ["Email monitoring", "Calendar management"],
    ...overrides,
  };
}

export function createMockPreset(overrides: Partial<PersonalityPreset> = {}): PersonalityPreset {
  return {
    key: "general",
    label: "General",
    description: "Friendly and helpful all-rounder.",
    focusAreas: ["Email monitoring", "Calendar management", "Research"],
    ...overrides,
  };
}

export const VALID_TELEGRAM_TOKENS = [
  "12345678:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqRss",
  "98765432:ZZYYxxWWvvUUttSSrrQQppOOnnMMllKKjjI",
  "11111111:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_bb",
];

export const INVALID_TELEGRAM_TOKENS = [
  "",
  "not-a-token",
  "1234:short",
  "abc:AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR",
  "12345678",
  ":AABBccDDeeFFggHHiiJJkkLLmmNNooPPqqR",
  "12345678:",
  "12345678:short",
];

export const VALID_API_KEYS = {
  anthropic: "sk-ant-api03-valid-key-12345",
  openai: "sk-valid-openai-key-12345",
  openrouter: "sk-or-valid-key-12345",
};

export const ALL_CHANNELS: Channel[] = [
  "telegram", "whatsapp", "discord", "signal",
  "imessage", "googlechat", "mattermost", "webchat",
];

export const ALL_PROVIDERS = [
  "anthropic", "openai", "google", "xai", "deepseek",
  "mistral", "perplexity", "moonshot", "groq", "openrouter",
];
