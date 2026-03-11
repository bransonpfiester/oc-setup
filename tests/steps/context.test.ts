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

describe("createContext", () => {
  it("returns object with all required fields", () => {
    const ctx = createContext();
    expect(ctx).toBeDefined();
    expect(ctx).toHaveProperty("os");
    expect(ctx).toHaveProperty("nodeVersion");
    expect(ctx).toHaveProperty("openclawVersion");
    expect(ctx).toHaveProperty("userName");
    expect(ctx).toHaveProperty("agentName");
    expect(ctx).toHaveProperty("timezone");
    expect(ctx).toHaveProperty("channel");
    expect(ctx).toHaveProperty("telegramUserId");
    expect(ctx).toHaveProperty("telegram");
    expect(ctx).toHaveProperty("discord");
    expect(ctx).toHaveProperty("mattermost");
    expect(ctx).toHaveProperty("model");
    expect(ctx).toHaveProperty("personality");
    expect(ctx).toHaveProperty("skills");
    expect(ctx).toHaveProperty("gatewayPort");
    expect(ctx).toHaveProperty("gatewayPid");
  });

  it("os.platform is empty string", () => {
    const ctx = createContext();
    expect(ctx.os.platform).toBe("");
  });

  it("os.arch is empty string", () => {
    const ctx = createContext();
    expect(ctx.os.arch).toBe("");
  });

  it("os.display is empty string", () => {
    const ctx = createContext();
    expect(ctx.os.display).toBe("");
  });

  it("nodeVersion is empty string", () => {
    const ctx = createContext();
    expect(ctx.nodeVersion).toBe("");
  });

  it("openclawVersion is null", () => {
    const ctx = createContext();
    expect(ctx.openclawVersion).toBeNull();
  });

  it("userName is empty string", () => {
    const ctx = createContext();
    expect(ctx.userName).toBe("");
  });

  it("agentName is empty string", () => {
    const ctx = createContext();
    expect(ctx.agentName).toBe("");
  });

  it("timezone uses system timezone", () => {
    const ctx = createContext();
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(ctx.timezone).toBe(systemTimezone);
  });

  it("channel defaults to telegram", () => {
    const ctx = createContext();
    expect(ctx.channel).toBe("telegram");
  });

  it("telegramUserId is empty string", () => {
    const ctx = createContext();
    expect(ctx.telegramUserId).toBe("");
  });

  it("telegram is null", () => {
    const ctx = createContext();
    expect(ctx.telegram).toBeNull();
  });

  it("discord is null", () => {
    const ctx = createContext();
    expect(ctx.discord).toBeNull();
  });

  it("mattermost is null", () => {
    const ctx = createContext();
    expect(ctx.mattermost).toBeNull();
  });

  it("model is null", () => {
    const ctx = createContext();
    expect(ctx.model).toBeNull();
  });

  it("personality has empty description and empty focusAreas array", () => {
    const ctx = createContext();
    expect(ctx.personality.description).toBe("");
    expect(ctx.personality.focusAreas).toEqual([]);
    expect(ctx.personality.focusAreas).toHaveLength(0);
  });

  it("skills is empty array", () => {
    const ctx = createContext();
    expect(ctx.skills).toEqual([]);
    expect(ctx.skills).toHaveLength(0);
    expect(Array.isArray(ctx.skills)).toBe(true);
  });

  it("gatewayPort is 18789", () => {
    const ctx = createContext();
    expect(ctx.gatewayPort).toBe(18789);
  });

  it("gatewayPid is null", () => {
    const ctx = createContext();
    expect(ctx.gatewayPid).toBeNull();
  });

  it("each call returns a new object (not shared reference)", () => {
    const ctx1 = createContext();
    const ctx2 = createContext();
    expect(ctx1).not.toBe(ctx2);
    expect(ctx1).toEqual(ctx2);
    ctx1.userName = "modified";
    expect(ctx2.userName).toBe("");
  });

  it("os object is not shared between calls", () => {
    const ctx1 = createContext();
    const ctx2 = createContext();
    expect(ctx1.os).not.toBe(ctx2.os);
    ctx1.os.platform = "modified";
    expect(ctx2.os.platform).toBe("");
  });

  it("personality object is not shared between calls", () => {
    const ctx1 = createContext();
    const ctx2 = createContext();
    expect(ctx1.personality).not.toBe(ctx2.personality);
    ctx1.personality.description = "modified";
    expect(ctx2.personality.description).toBe("");
  });

  it("focusAreas array is not shared between calls", () => {
    const ctx1 = createContext();
    const ctx2 = createContext();
    expect(ctx1.personality.focusAreas).not.toBe(ctx2.personality.focusAreas);
    ctx1.personality.focusAreas.push("test");
    expect(ctx2.personality.focusAreas).toHaveLength(0);
  });

  it("skills array is not shared between calls", () => {
    const ctx1 = createContext();
    const ctx2 = createContext();
    expect(ctx1.skills).not.toBe(ctx2.skills);
    ctx1.skills.push("skill-a");
    expect(ctx2.skills).toHaveLength(0);
  });

  it("timezone is a non-empty string", () => {
    const ctx = createContext();
    expect(typeof ctx.timezone).toBe("string");
    expect(ctx.timezone.length).toBeGreaterThan(0);
  });

  it("context has all expected top-level keys", () => {
    const ctx = createContext();
    const expectedKeys = [
      "os", "nodeVersion", "openclawVersion", "userName", "agentName",
      "timezone", "channel", "telegramUserId", "telegram", "discord",
      "mattermost", "model", "personality", "skills", "gatewayPort", "gatewayPid",
    ];
    for (const key of expectedKeys) {
      expect(ctx).toHaveProperty(key);
    }
  });

  it("all string fields are typeof string", () => {
    const ctx = createContext();
    expect(typeof ctx.nodeVersion).toBe("string");
    expect(typeof ctx.userName).toBe("string");
    expect(typeof ctx.agentName).toBe("string");
    expect(typeof ctx.timezone).toBe("string");
    expect(typeof ctx.channel).toBe("string");
    expect(typeof ctx.telegramUserId).toBe("string");
  });

  it("all nullable fields are exactly null not undefined", () => {
    const ctx = createContext();
    expect(ctx.openclawVersion).toBe(null);
    expect(ctx.telegram).toBe(null);
    expect(ctx.discord).toBe(null);
    expect(ctx.mattermost).toBe(null);
    expect(ctx.model).toBe(null);
    expect(ctx.gatewayPid).toBe(null);
    expect(ctx.openclawVersion).not.toBeUndefined();
    expect(ctx.telegram).not.toBeUndefined();
  });

  it("gatewayPort is a positive integer", () => {
    const ctx = createContext();
    expect(ctx.gatewayPort).toBeGreaterThan(0);
    expect(Number.isInteger(ctx.gatewayPort)).toBe(true);
  });

  it("os object has exactly 3 keys", () => {
    const ctx = createContext();
    expect(Object.keys(ctx.os)).toHaveLength(3);
    expect(Object.keys(ctx.os)).toContain("platform");
    expect(Object.keys(ctx.os)).toContain("arch");
    expect(Object.keys(ctx.os)).toContain("display");
  });

  it("default context can be serialized to JSON and back", () => {
    const ctx = createContext();
    const json = JSON.stringify(ctx);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.channel).toBe("telegram");
    expect(parsed.gatewayPort).toBe(18789);
    expect(parsed.openclawVersion).toBeNull();
  });

  it("multiple sequential calls return distinct objects", () => {
    const contexts = Array.from({ length: 5 }, () => createContext());
    for (let i = 0; i < contexts.length; i++) {
      for (let j = i + 1; j < contexts.length; j++) {
        expect(contexts[i]).not.toBe(contexts[j]);
        expect(contexts[i].os).not.toBe(contexts[j].os);
        expect(contexts[i].skills).not.toBe(contexts[j].skills);
        expect(contexts[i].personality.focusAreas).not.toBe(contexts[j].personality.focusAreas);
      }
    }
  });
});
