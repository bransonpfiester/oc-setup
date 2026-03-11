import { describe, it, expect, vi, beforeEach } from "vitest";
import { successResult, failureResult } from "../helpers/mock-exec.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn(), message: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("picocolors", () => ({
  default: {
    bold: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    red: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
  },
}));

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { run, runShell } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { updateCommand } from "../../src/commands/update.js";

const mockRun = vi.mocked(run);
const mockRunShell = vi.mocked(runShell);
const mockLogger = vi.mocked(logger);

describe("updateCommand", () => {
  let mockProcessExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let spinnerStart: ReturnType<typeof vi.fn>;
  let spinnerStop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    spinnerStart = vi.fn();
    spinnerStop = vi.fn();
    vi.mocked(p.spinner).mockReturnValue({ start: spinnerStart, stop: spinnerStop, message: vi.fn() });

    mockRun.mockResolvedValue(successResult("1.0.0"));
    mockRunShell.mockResolvedValue(successResult());
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockProcessExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  it("shows intro", async () => {
    await updateCommand();

    expect(p.intro).toHaveBeenCalledWith(expect.stringContaining("update"));
  });

  it("shows current version when available", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.5.0"))
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(successResult("1.6.0"));

    await updateCommand();

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("1.5.0"));
  });

  it("handles missing current version", async () => {
    mockRun
      .mockResolvedValueOnce(failureResult("not found"))
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(successResult("1.0.0"));

    await updateCommand();

    expect(p.log.info).not.toHaveBeenCalledWith(expect.stringContaining("Current version"));
  });

  it("shows spinner during update", async () => {
    await updateCommand();

    expect(spinnerStart).toHaveBeenCalledWith("Updating OpenClaw...");
  });

  it("update success stops spinner", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(successResult("1.1.0"));

    await updateCommand();

    expect(spinnerStop).toHaveBeenCalledWith(expect.stringContaining("Updated to"));
  });

  it("update failure calls process.exit", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(failureResult("npm error"));

    await expect(updateCommand()).rejects.toThrow("process.exit");

    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it("shows error on update failure", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(failureResult("permission denied"));

    await expect(updateCommand()).rejects.toThrow("process.exit");

    expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining("permission denied"));
  });

  it("checks new version after update", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(successResult("2.0.0"));

    await updateCommand();

    expect(mockRun).toHaveBeenCalledTimes(3);
    expect(spinnerStop).toHaveBeenCalledWith(expect.stringContaining("2.0.0"));
  });

  it("restarts gateway after update", async () => {
    await updateCommand();

    expect(mockRunShell).toHaveBeenCalledWith(
      "openclaw gateway restart",
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it("gateway restart success stops spinner", async () => {
    mockRunShell.mockResolvedValueOnce(successResult());

    await updateCommand();

    expect(spinnerStop).toHaveBeenCalledWith("Gateway restarted");
  });

  it("gateway restart failure shows hint", async () => {
    mockRunShell.mockResolvedValueOnce(failureResult("not running"));

    await updateCommand();

    expect(spinnerStop).toHaveBeenCalledWith(expect.stringContaining("skipped"));
    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Start manually"));
  });

  it("logs update start", async () => {
    await updateCommand();

    expect(mockLogger.info).toHaveBeenCalledWith("Starting update");
  });

  it("logs update completion", async () => {
    await updateCommand();

    expect(mockLogger.info).toHaveBeenCalledWith("Update completed successfully");
  });

  it("npm update uses 120s timeout", async () => {
    await updateCommand();

    expect(mockRun).toHaveBeenCalledWith(
      "npm",
      ["update", "-g", "openclaw"],
      expect.objectContaining({ timeout: 120_000 }),
    );
  });

  it("shows outro on success", async () => {
    await updateCommand();

    expect(p.outro).toHaveBeenCalledWith(expect.stringContaining("Update complete"));
  });

  it("shows 'latest' when new version check fails", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(successResult())
      .mockResolvedValueOnce(failureResult("unknown"));

    await updateCommand();

    expect(spinnerStop).toHaveBeenCalledWith(expect.stringContaining("latest"));
  });

  it("logs error on update failure", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(failureResult("network error"));

    await expect(updateCommand()).rejects.toThrow("process.exit");

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("network error"));
  });

  it("shows restart spinner", async () => {
    await updateCommand();

    expect(spinnerStart).toHaveBeenCalledWith("Restarting gateway...");
  });

  it("creates two spinners", async () => {
    await updateCommand();

    expect(p.spinner).toHaveBeenCalledTimes(2);
  });

  it("update failure stops spinner with failure message", async () => {
    mockRun
      .mockResolvedValueOnce(successResult("1.0.0"))
      .mockResolvedValueOnce(failureResult("fail"));

    await expect(updateCommand()).rejects.toThrow("process.exit");

    expect(spinnerStop).toHaveBeenCalledWith("Update failed");
  });
});
