import { vi } from "vitest";
import type { ExecResult } from "../../src/utils/exec.js";

export function successResult(stdout = ""): ExecResult {
  return { stdout, stderr: "", exitCode: 0 };
}

export function failureResult(stderr = "", code = 1): ExecResult {
  return { stdout: "", stderr, exitCode: code };
}

export function createMockExec() {
  return {
    run: vi.fn<(...args: unknown[]) => Promise<ExecResult>>().mockResolvedValue(successResult()),
    runShell: vi.fn<(...args: unknown[]) => Promise<ExecResult>>().mockResolvedValue(successResult()),
    runInteractive: vi.fn<(...args: unknown[]) => Promise<number>>().mockResolvedValue(0),
  };
}

export type MockExec = ReturnType<typeof createMockExec>;
