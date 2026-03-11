import { describe, it, expect, vi } from "vitest";

vi.mock("@clack/prompts", () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
  runInteractive: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  detectPlatform: vi.fn(),
  paths: vi.fn(),
  installHint: vi.fn(),
}));

vi.mock("../../src/lib/config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock("../../src/lib/telegram.js", () => ({
  isValidTokenFormat: vi.fn(),
  validateToken: vi.fn(),
}));

vi.mock("../../src/lib/models.js", () => ({
  MODEL_PROVIDERS: [],
  validateApiKey: vi.fn(),
}));

vi.mock("../../src/lib/templates.js", () => ({
  PRESETS: [],
  getPreset: vi.fn(),
  generateSoulMd: vi.fn(),
  generateUserMd: vi.fn(),
  generateHeartbeatMd: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

import { createContext } from "../../src/steps/context.js";
import type { SetupContext, Channel } from "../../src/steps/context.js";

describe("SetupContext type shape", () => {
  it("os property is an object with exactly 3 keys", () => {
    const ctx = createContext();
    expect(typeof ctx.os).toBe("object");
    expect(ctx.os).not.toBeNull();
    const keys = Object.keys(ctx.os);
    expect(keys).toHaveLength(3);
    expect(keys).toEqual(expect.arrayContaining(["platform", "arch", "display"]));
  });

  it("personality property has exactly 2 keys", () => {
    const ctx = createContext();
    expect(typeof ctx.personality).toBe("object");
    expect(ctx.personality).not.toBeNull();
    const keys = Object.keys(ctx.personality);
    expect(keys).toHaveLength(2);
    expect(keys).toEqual(expect.arrayContaining(["description", "focusAreas"]));
  });

  it("focusAreas is an array", () => {
    const ctx = createContext();
    expect(Array.isArray(ctx.personality.focusAreas)).toBe(true);
    expect(ctx.personality.focusAreas).toBeInstanceOf(Array);
  });

  it("skills is an array", () => {
    const ctx = createContext();
    expect(Array.isArray(ctx.skills)).toBe(true);
    expect(ctx.skills).toBeInstanceOf(Array);
  });

  it("gatewayPort is a number", () => {
    const ctx = createContext();
    expect(typeof ctx.gatewayPort).toBe("number");
    expect(Number.isFinite(ctx.gatewayPort)).toBe(true);
  });

  it("channel type can be set to each valid value", () => {
    const validChannels: Channel[] = [
      "telegram", "whatsapp", "discord", "signal",
      "imessage", "googlechat", "mattermost", "webchat",
    ];
    const ctx = createContext();
    for (const ch of validChannels) {
      ctx.channel = ch;
      expect(ctx.channel).toBe(ch);
    }
  });

  it("telegram can be set to object with token and botUsername", () => {
    const ctx = createContext();
    expect(ctx.telegram).toBeNull();
    ctx.telegram = { token: "123:ABC", botUsername: "my_bot" };
    expect(ctx.telegram).toEqual({ token: "123:ABC", botUsername: "my_bot" });
    expect(ctx.telegram.token).toBe("123:ABC");
    expect(ctx.telegram.botUsername).toBe("my_bot");
  });

  it("discord can be set to object with token", () => {
    const ctx = createContext();
    expect(ctx.discord).toBeNull();
    ctx.discord = { token: "discord-token-value" };
    expect(ctx.discord).toEqual({ token: "discord-token-value" });
    expect(ctx.discord.token).toBe("discord-token-value");
  });

  it("mattermost can be set to object with url and token", () => {
    const ctx = createContext();
    expect(ctx.mattermost).toBeNull();
    ctx.mattermost = { url: "https://mm.example.com", token: "mm-token" };
    expect(ctx.mattermost).toEqual({ url: "https://mm.example.com", token: "mm-token" });
    expect(ctx.mattermost.url).toBe("https://mm.example.com");
    expect(ctx.mattermost.token).toBe("mm-token");
  });

  it("model can be set with all 4 fields", () => {
    const ctx = createContext();
    expect(ctx.model).toBeNull();
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-test",
      modelId: "claude-sonnet-4-5-20250514",
      authMethod: "api-key",
    };
    expect(ctx.model).toBeDefined();
    expect(ctx.model!.provider).toBe("anthropic");
    expect(ctx.model!.apiKey).toBe("sk-ant-test");
    expect(ctx.model!.modelId).toBe("claude-sonnet-4-5-20250514");
    expect(ctx.model!.authMethod).toBe("api-key");
  });

  it("context is mutable (can assign values)", () => {
    const ctx = createContext();
    ctx.userName = "Alice";
    ctx.agentName = "Buddy";
    ctx.nodeVersion = "v22.0.0";
    ctx.gatewayPort = 9999;
    ctx.gatewayPid = 1234;

    expect(ctx.userName).toBe("Alice");
    expect(ctx.agentName).toBe("Buddy");
    expect(ctx.nodeVersion).toBe("v22.0.0");
    expect(ctx.gatewayPort).toBe(9999);
    expect(ctx.gatewayPid).toBe(1234);
  });

  it("multiple contexts are independent", () => {
    const ctx1 = createContext();
    const ctx2 = createContext();

    ctx1.userName = "Alice";
    ctx1.skills.push("search");
    ctx1.personality.focusAreas.push("Email");
    ctx1.os.platform = "macos";

    expect(ctx2.userName).toBe("");
    expect(ctx2.skills).toHaveLength(0);
    expect(ctx2.personality.focusAreas).toHaveLength(0);
    expect(ctx2.os.platform).toBe("");
  });

  it("context with all fields populated", () => {
    const ctx = createContext();
    ctx.os = { platform: "macos", arch: "arm64", display: "macOS (arm64)" };
    ctx.nodeVersion = "v22.5.1";
    ctx.openclawVersion = "2.0.0";
    ctx.userName = "TestUser";
    ctx.agentName = "TestAgent";
    ctx.timezone = "America/New_York";
    ctx.channel = "telegram";
    ctx.telegramUserId = "123456789";
    ctx.telegram = { token: "tok", botUsername: "bot" };
    ctx.discord = { token: "disc" };
    ctx.mattermost = { url: "https://mm.test", token: "mmt" };
    ctx.model = { provider: "openai", apiKey: "sk-x", modelId: "gpt-4o", authMethod: "api-key" };
    ctx.personality = { description: "Helpful", focusAreas: ["Email", "Calendar"] };
    ctx.skills = ["search", "calendar"];
    ctx.gatewayPort = 9000;
    ctx.gatewayPid = 5678;

    expect(ctx.os.platform).toBe("macos");
    expect(ctx.nodeVersion).toBe("v22.5.1");
    expect(ctx.openclawVersion).toBe("2.0.0");
    expect(ctx.userName).toBe("TestUser");
    expect(ctx.skills).toHaveLength(2);
    expect(ctx.gatewayPid).toBe(5678);
  });

  it("default context serializes to JSON correctly", () => {
    const ctx = createContext();
    const json = JSON.stringify(ctx);
    const parsed = JSON.parse(json) as SetupContext;

    expect(parsed.os).toEqual({ platform: "", arch: "", display: "" });
    expect(parsed.nodeVersion).toBe("");
    expect(parsed.openclawVersion).toBeNull();
    expect(parsed.telegram).toBeNull();
    expect(parsed.discord).toBeNull();
    expect(parsed.mattermost).toBeNull();
    expect(parsed.model).toBeNull();
    expect(parsed.channel).toBe("telegram");
    expect(parsed.gatewayPort).toBe(18789);
    expect(parsed.gatewayPid).toBeNull();
    expect(parsed.skills).toEqual([]);
    expect(parsed.personality).toEqual({ description: "", focusAreas: [] });
  });

  it("context clone does not share nested references", () => {
    const ctx = createContext();
    const clone = JSON.parse(JSON.stringify(ctx)) as SetupContext;

    clone.os.platform = "linux";
    clone.personality.focusAreas.push("Research");
    clone.skills.push("web-search");

    expect(ctx.os.platform).toBe("");
    expect(ctx.personality.focusAreas).toHaveLength(0);
    expect(ctx.skills).toHaveLength(0);
  });

  it("os sub-properties are all strings", () => {
    const ctx = createContext();
    expect(typeof ctx.os.platform).toBe("string");
    expect(typeof ctx.os.arch).toBe("string");
    expect(typeof ctx.os.display).toBe("string");
  });

  it("setting telegram to null clears it", () => {
    const ctx = createContext();
    ctx.telegram = { token: "abc", botUsername: "bot" };
    expect(ctx.telegram).not.toBeNull();
    ctx.telegram = null;
    expect(ctx.telegram).toBeNull();
  });

  it("setting model to null clears it", () => {
    const ctx = createContext();
    ctx.model = { provider: "openai", apiKey: "k", modelId: "m", authMethod: "api-key" };
    expect(ctx.model).not.toBeNull();
    ctx.model = null;
    expect(ctx.model).toBeNull();
  });

  it("spreading context creates a shallow copy", () => {
    const ctx = createContext();
    const spread = { ...ctx };
    expect(spread.channel).toBe("telegram");
    expect(spread.gatewayPort).toBe(18789);
    spread.userName = "changed";
    expect(ctx.userName).toBe("");
    spread.os.platform = "linux";
    expect(ctx.os.platform).toBe("linux");
  });
});
