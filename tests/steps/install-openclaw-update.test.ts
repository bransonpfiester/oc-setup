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

import { installOpenClaw } from "../../src/steps/install-openclaw.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { run } from "../../src/utils/exec.js";
import { createEmptyContext } from "../helpers/mock-factories.js";

describe("installOpenClaw — update flow", () => {
  let ctx: SetupContext;
  let spinnerObj: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ctx = createEmptyContext();
    spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("checkForUpdate skipped when npm view fails", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "network err", exitCode: 1 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("Could not check for updates");
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("npm view failed"),
    );
  });

  it("checkForUpdate skipped when stdout is empty", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "  ", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("Could not check for updates");
  });

  it("shows up-to-date message when versions match", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("OpenClaw 2.0.0 is up to date");
  });

  it("shows available update with version arrow", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("1.0.0"),
    );
  });

  it("update spinner shows target version", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "3.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "3.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith(
      expect.stringContaining("3.0.0"),
    );
  });

  it("update failure shows manual command", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installOpenClaw(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("npm install -g openclaw@latest"),
    );
  });

  it("normalizeVersion: v1.0.0 matches 1.0.0 (up-to-date)", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "v1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("up to date"),
    );
  });

  it("normalizeVersion: 1.0.0 matches 1.0.0 (up-to-date)", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("up to date"),
    );
  });

  it("normalizeVersion: v2.0.0 with whitespace matches 2.0.0", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "  v2.0.0  ", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("up to date"),
    );
  });

  it("version comparison with v prefix on both", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "v3.1.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "v3.1.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("up to date"),
    );
  });

  it("version comparison without prefix on both", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "4.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "4.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("up to date"),
    );
  });

  it("after successful update, version is refreshed", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(ctx.openclawVersion).toBe("2.0.0");
    expect(run).toHaveBeenLastCalledWith("openclaw", ["--version"]);
  });

  it("update uses 120_000ms timeout", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(run).toHaveBeenCalledWith(
      "npm", ["install", "-g", "openclaw@latest"],
      expect.objectContaining({ timeout: 120_000 }),
    );
  });

  it("initial version check uses default timeout", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(run).toHaveBeenNthCalledWith(1, "openclaw", ["--version"]);
  });

  it("logger messages for update success", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("1.0.0"),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("2.0.0"),
    );
  });

  it("logger messages for update failure", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "fail", exitCode: 1 });

    await installOpenClaw(ctx);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("update failed"),
    );
  });
});
