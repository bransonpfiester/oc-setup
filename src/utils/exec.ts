import { execFile, exec as execCb, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const execAsync = promisify(execCb);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function run(
  command: string,
  args: string[] = [],
  options: { timeout?: number; cwd?: string } = {},
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
      cwd: options.cwd,
      env: process.env,
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: (e.stdout ?? "").trim(),
      stderr: (e.stderr ?? "").trim(),
      exitCode: e.code ?? 1,
    };
  }
}

export async function runShell(
  command: string,
  options: { timeout?: number; cwd?: string; env?: Record<string, string> } = {},
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: (e.stdout ?? "").trim(),
      stderr: (e.stderr ?? "").trim(),
      exitCode: e.code ?? 1,
    };
  }
}

export async function runInteractive(
  command: string,
  args: string[] = [],
): Promise<number> {
  const fullCmd = [command, ...args].join(" ");
  return new Promise((resolve) => {
    const child = spawn(fullCmd, [], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}
