import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext, Channel } from "../../src/steps/context.js";
import { createEmptyContext } from "../helpers/mock-factories.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn(), message: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("picocolors", () => ({
  default: {
    bold: vi.fn((s: string) => s),
    cyan: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    red: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
  },
}));

vi.mock("../../src/steps/context.js", () => ({
  createContext: vi.fn(),
}));

vi.mock("../../src/steps/detect-os.js", () => ({ detectOS: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/install-node.js", () => ({ checkNode: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/install-openclaw.js", () => ({ installOpenClaw: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/setup-channel.js", () => ({ collectChannelInputs: vi.fn().mockResolvedValue(undefined), configureChannel: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/setup-model.js", () => ({ setupModel: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/setup-personality.js", () => ({ setupPersonality: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/setup-gateway.js", () => ({ setupGateway: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/setup-direct.js", () => ({ setupDirect: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/setup-service.js", () => ({ setupService: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/steps/verify.js", () => ({ verify: vi.fn().mockResolvedValue(undefined) }));

vi.mock("../../src/lib/templates.js", () => ({
  getPreset: vi.fn(),
}));

vi.mock("../../src/lib/models.js", () => ({
  MODEL_PROVIDERS: [
    { provider: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-4-5-20250514", hint: "~$20/mo" },
    { provider: "openai", label: "OpenAI", defaultModel: "gpt-4o", hint: "~$20/mo" },
    { provider: "openrouter", label: "OpenRouter", defaultModel: "anthropic/claude-sonnet-4-5-20250514", hint: "pay-per-use" },
  ],
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { createContext } from "../../src/steps/context.js";
import { getPreset } from "../../src/lib/templates.js";
import { logger } from "../../src/utils/logger.js";
import { initCommand } from "../../src/commands/init.js";

const mockCreateContext = vi.mocked(createContext);
const mockGetPreset = vi.mocked(getPreset);

function encode(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

describe("decodeConfig", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockCreateContext.mockReturnValue(ctx);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("skips config for empty payload (falsy string)", async () => {
    await initCommand("");

    expect(p.log.warn).not.toHaveBeenCalled();
    expect(p.log.success).not.toHaveBeenCalledWith(expect.stringContaining("pre-filled"));
  });

  it("decodes valid config with all fields", async () => {
    const cfg = {
      name: "Bob", channel: "telegram", userId: "999",
      token: "tok123", provider: "anthropic", apiKey: "sk-key",
      modelId: "claude-3", authMethod: "api-key",
      preset: "business", skills: ["research"],
    };
    mockGetPreset.mockReturnValue({
      key: "business", label: "Business",
      description: "Direct and efficient.", focusAreas: ["Email monitoring"],
    });

    await initCommand(encode(cfg));

    expect(p.log.success).toHaveBeenCalledWith(expect.stringContaining("pre-filled"));
    expect(ctx.userName).toBe("Bob");
    expect(ctx.channel).toBe("telegram");
    expect(ctx.telegramUserId).toBe("999");
    expect(ctx.telegram).toEqual({ token: "tok123", botUsername: "" });
    expect(ctx.model).toEqual({
      provider: "anthropic", apiKey: "sk-key", modelId: "claude-3", authMethod: "api-key",
    });
    expect(ctx.skills).toEqual(["research"]);
    expect(ctx.personality.description).toBe("Direct and efficient.");
  });

  it("decodes partial config with name only", async () => {
    await initCommand(encode({ name: "OnlyName" }));

    expect(ctx.userName).toBe("OnlyName");
    expect(ctx.agentName).toBe("OnlyName");
    expect(ctx.channel).toBe("telegram");
  });

  it("returns null for invalid base64", async () => {
    await initCommand("!!!invalid-base64!!!");

    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("Could not decode"));
  });

  it("returns null for valid base64 with invalid JSON", async () => {
    const badJson = Buffer.from("not json at all{{{").toString("base64");

    await initCommand(badJson);

    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("Could not decode"));
  });
});

describe("applyConfig", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockCreateContext.mockReturnValue(ctx);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("sets userName and agentName from name", async () => {
    await initCommand(encode({ name: "Alice" }));

    expect(ctx.userName).toBe("Alice");
    expect(ctx.agentName).toBe("Alice");
  });

  it("sets channel only", async () => {
    await initCommand(encode({ channel: "discord" }));

    expect(ctx.channel).toBe("discord");
    expect(ctx.userName).toBe("");
  });

  it("sets userId only", async () => {
    await initCommand(encode({ userId: "42" }));

    expect(ctx.telegramUserId).toBe("42");
  });

  it("sets telegram token when no channel specified", async () => {
    await initCommand(encode({ token: "my-tok" }));

    expect(ctx.telegram).toEqual({ token: "my-tok", botUsername: "" });
  });

  it("sets telegram token for telegram channel", async () => {
    await initCommand(encode({ channel: "telegram", token: "tg-tok" }));

    expect(ctx.telegram).toEqual({ token: "tg-tok", botUsername: "" });
  });

  it("sets discord token for discord channel", async () => {
    await initCommand(encode({ channel: "discord", token: "dc-tok" }));

    expect(ctx.discord).toEqual({ token: "dc-tok" });
    expect(ctx.telegram).toBeNull();
  });

  it("sets model with provider and apiKey", async () => {
    await initCommand(encode({ provider: "openai", apiKey: "sk-openai" }));

    expect(ctx.model).toEqual({
      provider: "openai", apiKey: "sk-openai", modelId: "gpt-4o", authMethod: "api-key",
    });
  });

  it("sets model with non-api-key authMethod (no apiKey needed)", async () => {
    await initCommand(encode({ provider: "anthropic", authMethod: "setup-token" }));

    expect(ctx.model).toEqual({
      provider: "anthropic", apiKey: "", modelId: "claude-sonnet-4-5-20250514", authMethod: "setup-token",
    });
  });

  it("overrides modelId when provided", async () => {
    await initCommand(encode({ provider: "anthropic", apiKey: "k", modelId: "custom-model" }));

    expect(ctx.model!.modelId).toBe("custom-model");
  });

  it("sets skills array", async () => {
    await initCommand(encode({ skills: ["a", "b", "c"] }));

    expect(ctx.skills).toEqual(["a", "b", "c"]);
  });

  it("does not apply empty skills array", async () => {
    await initCommand(encode({ skills: [] }));

    expect(ctx.skills).toEqual([]);
  });

  it("applies valid preset", async () => {
    mockGetPreset.mockReturnValue({
      key: "creative", label: "Creative",
      description: "Imaginative.", focusAreas: ["Writing"],
    });

    await initCommand(encode({ preset: "creative" }));

    expect(ctx.personality.description).toBe("Imaginative.");
    expect(ctx.personality.focusAreas).toEqual(["Writing"]);
  });

  it("ignores invalid preset", async () => {
    mockGetPreset.mockReturnValue(undefined);

    await initCommand(encode({ preset: "nonexistent" }));

    expect(ctx.personality.description).toBe("");
    expect(ctx.personality.focusAreas).toEqual([]);
  });

  it("does not set model when provider missing", async () => {
    await initCommand(encode({ apiKey: "key-only" }));

    expect(ctx.model).toBeNull();
  });

  it("does not set model when api-key auth and no apiKey", async () => {
    await initCommand(encode({ provider: "openai" }));

    expect(ctx.model).toBeNull();
  });
});

describe("getChannelHint (via initCommand output)", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockCreateContext.mockReturnValue(ctx);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("shows telegram hint with bot username", async () => {
    ctx.channel = "telegram";
    ctx.telegram = { token: "t", botUsername: "my_bot" };

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("@my_bot on Telegram"));
  });

  it("shows telegram hint without bot info", async () => {
    ctx.channel = "telegram";
    ctx.telegram = null;

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Send a message to your bot on Telegram"));
  });

  it("shows whatsapp hint", async () => {
    ctx.channel = "whatsapp";

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("WhatsApp number"));
  });

  it("shows discord hint", async () => {
    ctx.channel = "discord";

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("bot in Discord"));
  });

  it("shows signal hint", async () => {
    ctx.channel = "signal";

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("agent on Signal"));
  });

  it("shows imessage hint", async () => {
    ctx.channel = "imessage";

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("iMessage"));
  });

  it("shows googlechat hint", async () => {
    ctx.channel = "googlechat";

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Google Chat"));
  });

  it("shows mattermost hint", async () => {
    ctx.channel = "mattermost";

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Mattermost"));
  });

  it("shows webchat hint with port", async () => {
    ctx.channel = "webchat";
    ctx.gatewayPort = 9999;

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("localhost:9999"));
  });

  it("shows default hint for unknown channel", async () => {
    ctx.channel = "unknown-channel" as Channel;

    await initCommand();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Your agent is ready"));
  });
});
