import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createEmptyContext, createMockContext } from "../helpers/mock-factories.js";
import { mockProcessExit } from "../helpers/test-utils.js";

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
    { key: "business", label: "Business", description: "Direct and efficient.", focusAreas: ["Email monitoring", "Calendar management", "Research"] },
    { key: "creative", label: "Creative", description: "Imaginative and supportive.", focusAreas: ["Writing", "Research"] },
    { key: "developer", label: "Developer", description: "Technical and precise.", focusAreas: ["Code/development", "Research"] },
    { key: "general", label: "General", description: "Friendly and helpful all-rounder.", focusAreas: ["Email monitoring", "Calendar management", "Research"] },
  ],
  getPreset: vi.fn((key: string) => {
    const presets: Record<string, { key: string; label: string; description: string; focusAreas: string[] }> = {
      business: { key: "business", label: "Business", description: "Direct and efficient.", focusAreas: ["Email monitoring", "Calendar management", "Research"] },
      developer: { key: "developer", label: "Developer", description: "Technical and precise.", focusAreas: ["Code/development", "Research"] },
      general: { key: "general", label: "General", description: "Friendly and helpful all-rounder.", focusAreas: ["Email monitoring", "Calendar management", "Research"] },
    };
    return presets[key];
  }),
  generateSoulMd: vi.fn(() => "# SOUL.md\ntest"),
  generateUserMd: vi.fn(() => "# USER.md\ntest"),
  generateHeartbeatMd: vi.fn(() => "# HEARTBEAT.md\ntest"),
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
import { setupPersonality } from "../../src/steps/setup-personality.js";

const mockSelect = vi.mocked(p.select);
const mockText = vi.mocked(p.text);
const mockMultiselect = vi.mocked(p.multiselect);
const mockIsCancel = vi.mocked(p.isCancel);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockWriteConfig = vi.mocked(writeConfig);

describe("setupPersonality", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockIsCancel.mockReturnValue(false);
  });

  it("pre-configured personality writes files immediately", async () => {
    ctx.personality = {
      description: "Already configured",
      focusAreas: ["Research", "Writing"],
    };

    await setupPersonality(ctx);

    expect(p.log.success).toHaveBeenCalledWith("Personality pre-configured");
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockText).not.toHaveBeenCalled();
  });

  it("asks for user name", async () => {
    mockText.mockResolvedValueOnce("Alice");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "What's your name?",
      }),
    );
  });

  it("cancel during name exits", async () => {
    mockProcessExit();
    mockText.mockResolvedValueOnce(Symbol("cancel") as unknown as string);
    mockIsCancel.mockReturnValueOnce(true);

    await expect(setupPersonality(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalledWith("Setup cancelled.");
  });

  it("detects timezone", async () => {
    mockText.mockResolvedValueOnce("Bob");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(ctx.timezone).toBeTruthy();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("Timezone"),
    );
  });

  it("shows preset selection", async () => {
    mockText.mockResolvedValueOnce("Charlie");
    mockSelect.mockResolvedValueOnce("developer");
    mockMultiselect.mockResolvedValueOnce(["Code/development"]);

    await setupPersonality(ctx);

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Pick a personality for your agent:",
      }),
    );
  });

  it("cancel during preset selection exits", async () => {
    mockProcessExit();
    mockText.mockResolvedValueOnce("Dave");
    mockIsCancel.mockReturnValueOnce(false);
    mockSelect.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(true);

    await expect(setupPersonality(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalled();
  });

  it("shows focus area multiselect", async () => {
    mockText.mockResolvedValueOnce("Eve");
    mockSelect.mockResolvedValueOnce("business");
    mockMultiselect.mockResolvedValueOnce(["Email monitoring", "Calendar management"]);

    await setupPersonality(ctx);

    expect(mockMultiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "What do you mainly need help with?",
        required: true,
      }),
    );
  });

  it("cancel during focus areas exits", async () => {
    mockProcessExit();
    mockText.mockResolvedValueOnce("Frank");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await expect(setupPersonality(ctx)).rejects.toThrow("process.exit");
  });

  it("writes SOUL.md", async () => {
    mockText.mockResolvedValueOnce("Grace");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/SOUL.md",
      expect.any(String),
      "utf-8",
    );
  });

  it("writes USER.md", async () => {
    mockText.mockResolvedValueOnce("Hank");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/USER.md",
      expect.any(String),
      "utf-8",
    );
  });

  it("writes HEARTBEAT.md", async () => {
    mockText.mockResolvedValueOnce("Ivy");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw/HEARTBEAT.md",
      expect.any(String),
      "utf-8",
    );
  });

  it("calls writeConfig with user and personality", async () => {
    mockText.mockResolvedValueOnce("Jake");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ name: "Jake" }),
        personality: expect.objectContaining({ focusAreas: ["Research"] }),
      }),
    );
  });

  it("sets userName and agentName on context", async () => {
    mockText.mockResolvedValueOnce("Kate");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(ctx.userName).toBe("Kate");
    expect(ctx.agentName).toBe("Kate");
  });

  it("sets timezone on context", async () => {
    mockText.mockResolvedValueOnce("Leo");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Research"]);

    await setupPersonality(ctx);

    expect(ctx.timezone).toBeTruthy();
    expect(typeof ctx.timezone).toBe("string");
  });

  it("sets personality description from preset", async () => {
    mockText.mockResolvedValueOnce("Mia");
    mockSelect.mockResolvedValueOnce("developer");
    mockMultiselect.mockResolvedValueOnce(["Code/development"]);

    await setupPersonality(ctx);

    expect(ctx.personality.description).toBe("Technical and precise.");
  });

  it("sets focusAreas from selection", async () => {
    mockText.mockResolvedValueOnce("Noah");
    mockSelect.mockResolvedValueOnce("general");
    mockMultiselect.mockResolvedValueOnce(["Writing", "Social media"]);

    await setupPersonality(ctx);

    expect(ctx.personality.focusAreas).toEqual(["Writing", "Social media"]);
  });
});
