import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
  exec: vi.fn(),
  spawn: vi.fn(),
}));

import { execFile, exec as execCb, spawn } from "node:child_process";
import { run, runShell, runInteractive } from "../../src/utils/exec.js";
import type { ExecResult } from "../../src/utils/exec.js";

const mockedExecFile = execFile as unknown as ReturnType<typeof vi.fn>;
const mockedExec = execCb as unknown as ReturnType<typeof vi.fn>;
const mockedSpawn = spawn as unknown as ReturnType<typeof vi.fn>;

function cbSuccess(stdout = "", stderr = "") {
  return (...args: unknown[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === "function") cb(null, { stdout, stderr });
  };
}

function cbError(opts: { stdout?: string; stderr?: string; code?: number } = {}) {
  return (...args: unknown[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === "function") cb(opts);
  };
}

function spawnChild(closeCode: number | null = 0) {
  const handlers: Record<string, (...a: unknown[]) => void> = {};
  return {
    on: vi.fn((event: string, handler: (...a: unknown[]) => void) => {
      handlers[event] = handler;
      if (event === "close") {
        process.nextTick(() => handler(closeCode));
      }
    }),
    _handlers: handlers,
  };
}

function spawnError() {
  const handlers: Record<string, (...a: unknown[]) => void> = {};
  return {
    on: vi.fn((event: string, handler: (...a: unknown[]) => void) => {
      handlers[event] = handler;
      if (event === "error") {
        process.nextTick(() => handler(new Error("spawn failed")));
      }
    }),
    _handlers: handlers,
  };
}

beforeEach(() => {
  mockedExecFile.mockImplementation(cbSuccess());
  mockedExec.mockImplementation(cbSuccess());
});

describe("run()", () => {
  it("returns successful result with stdout", async () => {
    mockedExecFile.mockImplementation(cbSuccess("hello world", ""));
    const result = await run("echo", ["hello", "world"]);
    expect(result).toEqual({ stdout: "hello world", stderr: "", exitCode: 0 });
  });

  it("returns failure with exit code from error", async () => {
    mockedExecFile.mockImplementation(
      cbError({ stdout: "partial", stderr: "command not found", code: 127 }),
    );
    const result = await run("bad-command");
    expect(result).toEqual({
      stdout: "partial",
      stderr: "command not found",
      exitCode: 127,
    });
  });

  it("passes custom timeout to execFile", async () => {
    await run("git", ["status"], { timeout: 5000 });
    const call = mockedExecFile.mock.calls[0] as unknown[];
    expect(call[2]).toEqual(
      expect.objectContaining({ timeout: 5000 }),
    );
  });

  it("passes custom cwd to execFile", async () => {
    await run("ls", ["-la"], { cwd: "/tmp" });
    const call = mockedExecFile.mock.calls[0] as unknown[];
    expect(call[2]).toEqual(
      expect.objectContaining({ cwd: "/tmp" }),
    );
  });

  it("trims whitespace from stdout and stderr", async () => {
    mockedExecFile.mockImplementation(cbSuccess("  output\n  ", "  warn\n"));
    const result = await run("cmd");
    expect(result.stdout).toBe("output");
    expect(result.stderr).toBe("warn");
  });

  it("defaults to empty string when error has no stdout/stderr", async () => {
    mockedExecFile.mockImplementation(cbError({ code: 2 }));
    const result = await run("cmd");
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(2);
  });

  it("defaults exitCode to 1 when error has no code", async () => {
    mockedExecFile.mockImplementation(cbError({ stdout: "out", stderr: "err" }));
    const result = await run("cmd");
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("out");
    expect(result.stderr).toBe("err");
  });
});

describe("runShell()", () => {
  it("returns successful result", async () => {
    mockedExec.mockImplementation(cbSuccess("shell output", ""));
    const result = await runShell("echo test");
    expect(result).toEqual({ stdout: "shell output", stderr: "", exitCode: 0 });
  });

  it("returns failure with exit code", async () => {
    mockedExec.mockImplementation(
      cbError({ stdout: "", stderr: "permission denied", code: 13 }),
    );
    const result = await runShell("cat /etc/shadow");
    expect(result).toEqual({
      stdout: "",
      stderr: "permission denied",
      exitCode: 13,
    });
  });

  it("merges custom env variables with process.env", async () => {
    await runShell("echo $MY_VAR", { env: { MY_VAR: "hello" } });
    const call = mockedExec.mock.calls[0] as unknown[];
    const opts = call[1] as Record<string, unknown>;
    expect(opts.env).toEqual({ ...process.env, MY_VAR: "hello" });
  });

  it("passes custom timeout to exec", async () => {
    await runShell("sleep 10", { timeout: 15000 });
    const call = mockedExec.mock.calls[0] as unknown[];
    const opts = call[1] as Record<string, unknown>;
    expect(opts.timeout).toBe(15000);
  });

  it("defaults to empty string when error has no stdout/stderr", async () => {
    mockedExec.mockImplementation(cbError({ code: 5 }));
    const result = await runShell("bad");
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(5);
  });
});

describe("runInteractive()", () => {
  it("returns exit code 0 on successful close", async () => {
    mockedSpawn.mockReturnValue(spawnChild(0));
    const result = await runInteractive("echo", ["hello"]);
    expect(result).toBe(0);
    expect(mockedSpawn).toHaveBeenCalledWith(
      "echo hello",
      [],
      expect.objectContaining({ stdio: "inherit", shell: true }),
    );
  });

  it("returns 1 on spawn error", async () => {
    mockedSpawn.mockReturnValue(spawnError());
    const result = await runInteractive("nonexistent");
    expect(result).toBe(1);
  });

  it("returns 1 when close code is null", async () => {
    mockedSpawn.mockReturnValue(spawnChild(null));
    const result = await runInteractive("cmd");
    expect(result).toBe(1);
  });
});

describe("ExecResult interface", () => {
  it("has the correct shape for a success result", async () => {
    mockedExecFile.mockImplementation(cbSuccess("ok", ""));
    const result: ExecResult = await run("echo");
    expect(result).toHaveProperty("stdout");
    expect(result).toHaveProperty("stderr");
    expect(result).toHaveProperty("exitCode");
    expect(typeof result.stdout).toBe("string");
    expect(typeof result.stderr).toBe("string");
    expect(typeof result.exitCode).toBe("number");
  });

  it("has the correct shape for an error result", async () => {
    mockedExecFile.mockImplementation(cbError({ stderr: "fail", code: 1 }));
    const result: ExecResult = await run("bad");
    expect(typeof result.stdout).toBe("string");
    expect(typeof result.stderr).toBe("string");
    expect(typeof result.exitCode).toBe("number");
    expect(result.exitCode).toBeGreaterThanOrEqual(0);
  });
});

describe("default arguments", () => {
  it("uses DEFAULT_TIMEOUT_MS of 30000 when no timeout specified", async () => {
    await run("echo");
    const call = mockedExecFile.mock.calls[0] as unknown[];
    const opts = call[2] as Record<string, unknown>;
    expect(opts.timeout).toBe(30_000);
  });

  it("uses process.env for run()", async () => {
    await run("echo");
    const call = mockedExecFile.mock.calls[0] as unknown[];
    const opts = call[2] as Record<string, unknown>;
    expect(opts.env).toBe(process.env);
  });

  it("uses DEFAULT_TIMEOUT_MS of 30000 for runShell()", async () => {
    await runShell("echo");
    const call = mockedExec.mock.calls[0] as unknown[];
    const opts = call[1] as Record<string, unknown>;
    expect(opts.timeout).toBe(30_000);
  });

  it("passes empty args array by default for run()", async () => {
    await run("echo");
    const call = mockedExecFile.mock.calls[0] as unknown[];
    expect(call[1]).toEqual([]);
  });

  it("passes cwd as undefined when not specified", async () => {
    await run("echo");
    const call = mockedExecFile.mock.calls[0] as unknown[];
    const opts = call[2] as Record<string, unknown>;
    expect(opts.cwd).toBeUndefined();
  });

  it("joins command and args for runInteractive()", async () => {
    mockedSpawn.mockReturnValue(spawnChild(0));
    await runInteractive("npm", ["install", "--save-dev"]);
    expect(mockedSpawn).toHaveBeenCalledWith(
      "npm install --save-dev",
      [],
      expect.any(Object),
    );
  });
});
