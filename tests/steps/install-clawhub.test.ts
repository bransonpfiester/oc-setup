import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";

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

import { installClawHub } from "../../src/steps/install-clawhub.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { run } from "../../src/utils/exec.js";
import { createEmptyContext } from "../helpers/mock-factories.js";

describe("installClawHub", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    vi.mocked(p.spinner).mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    }) as any);
  });

  it("finds existing clawhub", async () => {
    vi.mocked(run).mockResolvedValueOnce({
      stdout: "0.5.0", stderr: "", exitCode: 0,
    });

    await installClawHub(ctx);

    expect(p.log.success).toHaveBeenCalledWith("ClawHub 0.5.0 found");
  });

  it("installs when not found", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "not found", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(run).toHaveBeenCalledWith(
      "npm", ["install", "-g", "clawhub"],
      expect.objectContaining({ timeout: 120_000 }),
    );
  });

  it("shows spinner during install", async () => {
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing ClawHub...");
  });

  it("handles install failure gracefully (no process.exit)", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "npm ERR!", exitCode: 1 });

    await installClawHub(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      "Could not install ClawHub automatically.",
    );
  });

  it("shows warning and manual install hint on failure", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(p.log.info).toHaveBeenCalledWith(
      "Install manually later: npm install -g clawhub",
    );
  });

  it("installs skills when skills array is non-empty", async () => {
    ctx.skills = ["web-search"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(run).toHaveBeenCalledWith(
      "clawhub", ["install", "web-search"],
      expect.objectContaining({ timeout: 60_000 }),
    );
  });

  it("skips skills when array is empty", async () => {
    ctx.skills = [];
    vi.mocked(run).mockResolvedValueOnce({
      stdout: "1.0.0", stderr: "", exitCode: 0,
    });

    await installClawHub(ctx);

    const clawhubInstallCalls = vi.mocked(run).mock.calls.filter(
      (call) => call[0] === "clawhub" && call[1]?.[0] === "install",
    );
    expect(clawhubInstallCalls).toHaveLength(0);
  });

  it("all skills installed successfully", async () => {
    ctx.skills = ["search", "calendar"];
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("2 skills installed");
  });

  it("some skills fail", async () => {
    ctx.skills = ["search", "broken", "calendar"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("broken"),
    );
  });

  it("all skills fail", async () => {
    ctx.skills = ["bad1", "bad2"];
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("0 installed, 2 failed");
  });

  it("skill install uses 60s timeout", async () => {
    ctx.skills = ["search"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(run).toHaveBeenCalledWith(
      "clawhub", ["install", "search"],
      expect.objectContaining({ timeout: 60_000 }),
    );
  });

  it("success message includes correct count", async () => {
    ctx.skills = ["a", "b", "c"];
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("3 skills installed");
  });

  it("failure message includes failed skill names", async () => {
    ctx.skills = ["good", "bad-skill"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("bad-skill"),
    );
  });

  it("logger called with install results", async () => {
    ctx.skills = ["search", "broken"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("search"),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("broken"),
    );
  });

  it("single skill install", async () => {
    ctx.skills = ["solo"];
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("1 skill installed");
    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 1 skill...");
  });
});
