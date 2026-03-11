import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext } from "../helpers/mock-factories.js";

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

vi.mock("../../src/lib/templates.js", () => ({
  PRESETS: [
    { key: "general", label: "General", description: "Friendly.", focusAreas: ["Research"] },
  ],
  getPreset: vi.fn((key: string) =>
    key === "general" ? { key: "general", label: "General", description: "Friendly.", focusAreas: ["Research"] } : undefined,
  ),
  generateSoulMd: vi.fn((inputs) => `# SOUL for ${inputs.userName}`),
  generateUserMd: vi.fn((inputs) => `# USER for ${inputs.userName}`),
  generateHeartbeatMd: vi.fn((inputs) => `# HEARTBEAT for ${inputs.userName}`),
}));

vi.mock("../../src/lib/platform.js", () => ({
  paths: vi.fn(() => ({
    home: "/mock/home",
    openclawDir: "/mock/home/.openclaw",
    configFile: "/mock/home/.openclaw/config.json",
    logsDir: "/mock/home/.openclaw/logs",
    soulFile: "/mock/home/.openclaw/SOUL.md",
    userFile: "/mock/home/.openclaw/USER.md",
    heartbeatFile: "/mock/home/.openclaw/HEARTBEAT.md",
    launchdPlist: "/mock/home/Library/LaunchAgents/com.openclaw.gateway.plist",
    systemdUnit: "/mock/home/.config/systemd/user/openclaw-gateway.service",
  })),
}));

vi.mock("../../src/lib/config.js", () => ({
  writeConfig: vi.fn(),
}));

vi.mock("node:fs", () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => "{}"),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { writeFileSync, mkdirSync } from "node:fs";
import { generateSoulMd, generateUserMd, generateHeartbeatMd } from "../../src/lib/templates.js";
import { writeConfig } from "../../src/lib/config.js";
import { logger } from "../../src/utils/logger.js";
import { setupPersonality } from "../../src/steps/setup-personality.js";

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockWriteConfig = vi.mocked(writeConfig);
const mockGenerateSoulMd = vi.mocked(generateSoulMd);
const mockGenerateUserMd = vi.mocked(generateUserMd);
const mockGenerateHeartbeatMd = vi.mocked(generateHeartbeatMd);
const mockSpinner = vi.mocked(p.spinner);
const mockLogger = vi.mocked(logger);

describe("setupPersonality – writeFiles internals", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext({
      personality: { description: "Pre-configured", focusAreas: ["Research"] },
    });
  });

  it("writeFiles creates openclawDir", async () => {
    await setupPersonality(ctx);

    expect(mockMkdirSync).toHaveBeenCalledWith("/mock/home/.openclaw", { recursive: true });
  });

  it("writeFiles uses correct SOUL.md path", async () => {
    await setupPersonality(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/SOUL.md",
      expect.any(String),
      "utf-8",
    );
  });

  it("writeFiles uses correct USER.md path", async () => {
    await setupPersonality(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/USER.md",
      expect.any(String),
      "utf-8",
    );
  });

  it("writeFiles uses correct HEARTBEAT.md path", async () => {
    await setupPersonality(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/HEARTBEAT.md",
      expect.any(String),
      "utf-8",
    );
  });

  it("writeFiles calls generateSoulMd with correct inputs", async () => {
    ctx.userName = "Alice";
    ctx.agentName = "Alice";
    ctx.timezone = "Europe/London";
    ctx.personality.description = "Sharp and witty";
    ctx.personality.focusAreas = ["Writing", "Research"];

    await setupPersonality(ctx);

    expect(mockGenerateSoulMd).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: "Alice",
        agentName: "Alice",
        timezone: "Europe/London",
        personalityDescription: "Sharp and witty",
        focusAreas: ["Writing", "Research"],
      }),
    );
  });

  it("writeFiles calls generateUserMd with correct inputs", async () => {
    ctx.userName = "Bob";
    ctx.agentName = "Bob";
    ctx.personality.focusAreas = ["Code/development"];

    await setupPersonality(ctx);

    expect(mockGenerateUserMd).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: "Bob",
        agentName: "Bob",
        focusAreas: ["Code/development"],
      }),
    );
  });

  it("writeFiles calls generateHeartbeatMd with correct inputs", async () => {
    ctx.userName = "Charlie";
    ctx.personality.focusAreas = ["Email monitoring"];

    await setupPersonality(ctx);

    expect(mockGenerateHeartbeatMd).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: "Charlie",
        focusAreas: ["Email monitoring"],
      }),
    );
  });

  it("writeFiles calls writeConfig with user data", async () => {
    ctx.userName = "Dave";
    ctx.agentName = "Dave";
    ctx.timezone = "America/Chicago";

    await setupPersonality(ctx);

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        user: {
          name: "Dave",
          agentName: "Dave",
          timezone: "America/Chicago",
        },
      }),
    );
  });

  it("writeFiles calls writeConfig with personality data", async () => {
    ctx.personality = { description: "Focused", focusAreas: ["Calendar management"] };

    await setupPersonality(ctx);

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        personality: {
          description: "Focused",
          focusAreas: ["Calendar management"],
        },
      }),
    );
  });

  it("spinner shows 'Generating configuration files...'", async () => {
    await setupPersonality(ctx);

    const spinnerInstance = mockSpinner.mock.results[0]!.value;
    expect(spinnerInstance.start).toHaveBeenCalledWith("Generating configuration files...");
  });

  it("spinner stops with success message", async () => {
    await setupPersonality(ctx);

    const spinnerInstance = mockSpinner.mock.results[0]!.value;
    expect(spinnerInstance.stop).toHaveBeenCalledWith(
      expect.stringContaining("SOUL.md"),
    );
  });

  it("logger called after writing", async () => {
    await setupPersonality(ctx);

    expect(mockLogger.info).toHaveBeenCalledWith("Personality files generated");
  });

  it("writeFiles with empty userName", async () => {
    ctx.userName = "";
    ctx.agentName = "";

    await setupPersonality(ctx);

    expect(mockGenerateSoulMd).toHaveBeenCalledWith(
      expect.objectContaining({ userName: "" }),
    );
    expect(mockWriteFileSync).toHaveBeenCalledTimes(3);
  });

  it("writeFiles with single focusArea", async () => {
    ctx.personality = { description: "Minimal", focusAreas: ["Research"] };

    await setupPersonality(ctx);

    expect(mockGenerateSoulMd).toHaveBeenCalledWith(
      expect.objectContaining({ focusAreas: ["Research"] }),
    );
  });

  it("writeFiles with many focusAreas", async () => {
    ctx.personality = {
      description: "Omniscient",
      focusAreas: [
        "Email monitoring", "Calendar management", "Social media",
        "Code/development", "Research", "Writing",
      ],
    };

    await setupPersonality(ctx);

    expect(mockGenerateSoulMd).toHaveBeenCalledWith(
      expect.objectContaining({
        focusAreas: expect.arrayContaining(["Email monitoring", "Writing"]),
      }),
    );
  });

  it("config includes timezone", async () => {
    ctx.timezone = "Asia/Tokyo";

    await setupPersonality(ctx);

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ timezone: "Asia/Tokyo" }),
      }),
    );
  });
});
