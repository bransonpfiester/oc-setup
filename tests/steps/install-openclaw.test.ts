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

describe("installOpenClaw", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    vi.mocked(p.spinner).mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    }) as any);
  });

  it("finds existing openclaw and sets version", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.5.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.5.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(ctx.openclawVersion).toBe("1.5.0");
  });

  it("shows success when already installed", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(p.log.success).toHaveBeenCalledWith("OpenClaw 2.0.0 found");
  });

  it("installs when not found", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "not found", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(run).toHaveBeenCalledWith(
      "npm", ["install", "-g", "openclaw"], { timeout: 120_000 },
    );
  });

  it("shows spinner during install", async () => {
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith(
      "Installing openclaw globally...",
    );
  });

  it("handles install failure (exit code != 0)", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "npm ERR!", exitCode: 1 });

    await expect(installOpenClaw(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to install OpenClaw"),
    );
  });

  it("calls process.exit on install failure", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "error", exitCode: 1 });

    await expect(installOpenClaw(ctx)).rejects.toThrow("process.exit");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("checks version after install", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.1.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(run).toHaveBeenCalledWith("openclaw", ["--version"]);
    expect(ctx.openclawVersion).toBe("2.1.0");
  });

  it("sets openclawVersion to 'installed' when post-install version check returns empty", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(ctx.openclawVersion).toBe("installed");
  });

  it("checks for update when already installed", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(run).toHaveBeenCalledWith(
      "npm", ["view", "openclaw", "version"],
      expect.objectContaining({ timeout: 10_000 }),
    );
  });

  it("update available shows message", async () => {
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
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

  it("already up to date shows message", async () => {
    const spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith(
      expect.stringContaining("up to date"),
    );
  });

  it("update check failure handled gracefully", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "network error", exitCode: 1 });

    await installOpenClaw(ctx);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("npm view failed"),
    );
  });

  it("update install failure handled gracefully", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "2.0.0", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "error", exitCode: 1 });

    await installOpenClaw(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("npm install -g openclaw@latest"),
    );
  });

  it("sets openclawVersion after successful install", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "3.0.0", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(ctx.openclawVersion).toBe("3.0.0");
  });

  it("shows manual install hint on failure", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "fail", exitCode: 1 });

    await expect(installOpenClaw(ctx)).rejects.toThrow("process.exit");
    expect(p.log.info).toHaveBeenCalledWith(
      "Try running manually: npm install -g openclaw",
    );
  });

  it("logger records installed version", async () => {
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "1.2.3", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "1.2.3", stderr: "", exitCode: 0 });

    await installOpenClaw(ctx);

    expect(logger.info).toHaveBeenCalledWith("OpenClaw installed: 1.2.3");
  });
});
