import { describe, it, expect, vi, beforeEach } from "vitest";
import { successResult } from "../helpers/mock-exec.js";

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

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => true),
  cpSync: vi.fn(),
  rmSync: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  paths: vi.fn(() => ({
    openclawDir: "/mock/home/.openclaw",
    configFile: "/mock/home/.openclaw/config.json",
  })),
}));

vi.mock("../../src/utils/exec.js", () => ({
  runShell: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

vi.mock("../../src/commands/init.js", () => ({
  initCommand: vi.fn().mockResolvedValue(undefined),
}));

import * as p from "@clack/prompts";
import { existsSync, cpSync, rmSync } from "node:fs";
import { paths } from "../../src/lib/platform.js";
import { runShell } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { initCommand } from "../../src/commands/init.js";
import { resetCommand } from "../../src/commands/reset.js";

const mockConfirm = vi.mocked(p.confirm);
const mockIsCancel = vi.mocked(p.isCancel);
const mockExistsSync = vi.mocked(existsSync);
const mockCpSync = vi.mocked(cpSync);
const mockRmSync = vi.mocked(rmSync);
const mockRunShell = vi.mocked(runShell);
const mockInitCommand = vi.mocked(initCommand);
const mockLogger = vi.mocked(logger);

describe("resetCommand", () => {
  let spinnerStart: ReturnType<typeof vi.fn>;
  let spinnerStop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    spinnerStart = vi.fn();
    spinnerStop = vi.fn();
    vi.mocked(p.spinner).mockReturnValue({ start: spinnerStart, stop: spinnerStop, message: vi.fn() });

    mockConfirm.mockResolvedValue(true);
    mockIsCancel.mockReturnValue(false);
    mockExistsSync.mockReturnValue(true);
    mockRunShell.mockResolvedValue(successResult());
    mockInitCommand.mockResolvedValue(undefined);

    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("shows intro", async () => {
    await resetCommand();

    expect(p.intro).toHaveBeenCalledWith(expect.stringContaining("reset"));
  });

  it("shows warning message", async () => {
    await resetCommand();

    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("back up"));
  });

  it("asks for confirmation", async () => {
    await resetCommand();

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("sure") }),
    );
  });

  it("cancels on decline", async () => {
    mockConfirm.mockResolvedValueOnce(false);

    await resetCommand();

    expect(p.cancel).toHaveBeenCalledWith("Reset cancelled.");
    expect(mockInitCommand).not.toHaveBeenCalled();
  });

  it("cancels on isCancel", async () => {
    mockIsCancel.mockReturnValueOnce(true);
    mockConfirm.mockResolvedValueOnce(Symbol("cancel") as any);

    await resetCommand();

    expect(p.cancel).toHaveBeenCalledWith("Reset cancelled.");
    expect(mockInitCommand).not.toHaveBeenCalled();
  });

  it("stops gateway before reset", async () => {
    await resetCommand();

    expect(mockRunShell).toHaveBeenCalledWith("openclaw gateway stop 2>/dev/null; true");
  });

  it("backs up existing config with timestamp", async () => {
    mockExistsSync.mockReturnValue(true);

    await resetCommand();

    expect(mockCpSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw",
      expect.stringMatching(/\.openclaw-backup-\d{4}-\d{2}-\d{2}/),
      { recursive: true },
    );
  });

  it("handles backup failure gracefully", async () => {
    mockExistsSync.mockReturnValue(true);
    mockCpSync.mockImplementation(() => { throw new Error("disk full"); });

    await resetCommand();

    expect(spinnerStop).toHaveBeenCalledWith("Backup failed, continuing anyway");
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Backup failed"));
    expect(mockInitCommand).toHaveBeenCalled();
  });

  it("removes old config directory", async () => {
    mockExistsSync.mockReturnValue(true);

    await resetCommand();

    expect(mockRmSync).toHaveBeenCalledWith(
      "/mock/home/.openclaw",
      { recursive: true, force: true },
    );
  });

  it("handles remove failure gracefully", async () => {
    mockExistsSync.mockReturnValue(true);
    mockRmSync.mockImplementation(() => { throw new Error("permission denied"); });

    await resetCommand();

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Could not remove"));
    expect(mockInitCommand).toHaveBeenCalled();
  });

  it("shows success message after removal", async () => {
    await resetCommand();

    expect(p.log.success).toHaveBeenCalledWith(expect.stringContaining("Old config removed"));
  });

  it("re-runs initCommand", async () => {
    await resetCommand();

    expect(mockInitCommand).toHaveBeenCalled();
  });

  it("skips backup when no existing dir", async () => {
    mockExistsSync.mockReturnValue(false);

    await resetCommand();

    expect(mockCpSync).not.toHaveBeenCalled();
    expect(mockRmSync).not.toHaveBeenCalled();
    expect(mockInitCommand).toHaveBeenCalled();
  });

  it("logs reset start", async () => {
    await resetCommand();

    expect(mockLogger.info).toHaveBeenCalledWith("Starting reset");
  });

  it("backup directory name includes timestamp format", async () => {
    mockExistsSync.mockReturnValue(true);

    await resetCommand();

    const cpCall = mockCpSync.mock.calls[0];
    const backupPath = cpCall![1] as string;
    expect(backupPath).toMatch(/\.openclaw-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
  });

  it("shows gateway stopped spinner", async () => {
    await resetCommand();

    expect(spinnerStart).toHaveBeenCalledWith("Stopping gateway...");
    expect(spinnerStop).toHaveBeenCalledWith("Gateway stopped");
  });

  it("shows backup spinner", async () => {
    mockExistsSync.mockReturnValue(true);

    await resetCommand();

    expect(spinnerStart).toHaveBeenCalledWith("Backing up current config...");
  });

  it("logs backup path", async () => {
    mockExistsSync.mockReturnValue(true);

    await resetCommand();

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Config backed up to"));
  });

  it("confirm defaults to false", async () => {
    await resetCommand();

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ initialValue: false }),
    );
  });
});
