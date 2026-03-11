import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
  exec: vi.fn(),
  spawn: vi.fn(),
}));

import { execFile, exec as execCb, spawn } from "node:child_process";
import { run, runShell, runInteractive } from "../../src/utils/exec.js";

const mockedExecFile = execFile as unknown as ReturnType<typeof vi.fn>;
const mockedExec = execCb as unknown as ReturnType<typeof vi.fn>;
const mockedSpawn = spawn as unknown as ReturnType<typeof vi.fn>;

function cbSuccess(stdout = "", stderr = "") {
  return (...args: unknown[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === "function") cb(null, { stdout, stderr });
  };
}

function cbError(opts: Record<string, unknown> = {}) {
  return (...args: unknown[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === "function") cb(opts);
  };
}

function spawnChild(closeCode: number | null = 0) {
  return {
    on: vi.fn((event: string, handler: (...a: unknown[]) => void) => {
      if (event === "close") {
        process.nextTick(() => handler(closeCode));
      }
    }),
  };
}

beforeEach(() => {
  mockedExecFile.mockImplementation(cbSuccess());
  mockedExec.mockImplementation(cbSuccess());
});

describe("run() edge cases", () => {
  it("handles empty command string", async () => {
    const result = await run("");
    expect(result.exitCode).toBe(0);
    const call = mockedExecFile.mock.calls[0] as unknown[];
    expect(call[0]).toBe("");
  });

  it("handles a very long args array", async () => {
    const longArgs = Array.from({ length: 1000 }, (_, i) => `arg${i}`);
    mockedExecFile.mockImplementation(cbSuccess("ok", ""));
    const result = await run("cmd", longArgs);
    expect(result.exitCode).toBe(0);
    const call = mockedExecFile.mock.calls[0] as unknown[];
    expect(call[1]).toEqual(longArgs);
    expect((call[1] as string[]).length).toBe(1000);
  });

  it("handles special characters in args", async () => {
    const specialArgs = ["--flag=hello world", "$VAR", "file name.txt", "a&b", "x;y"];
    const result = await run("cmd", specialArgs);
    expect(result.exitCode).toBe(0);
    const call = mockedExecFile.mock.calls[0] as unknown[];
    expect(call[1]).toEqual(specialArgs);
  });

  it("handles undefined options (uses defaults)", async () => {
    const result = await run("echo");
    expect(result.exitCode).toBe(0);
    const call = mockedExecFile.mock.calls[0] as unknown[];
    const opts = call[2] as Record<string, unknown>;
    expect(opts.timeout).toBe(30_000);
    expect(opts.cwd).toBeUndefined();
  });

  it("handles timeout of 0", async () => {
    await run("cmd", [], { timeout: 0 });
    const call = mockedExecFile.mock.calls[0] as unknown[];
    const opts = call[2] as Record<string, unknown>;
    expect(opts.timeout).toBe(0);
  });

  it("handles error with no properties at all (plain object)", async () => {
    mockedExecFile.mockImplementation(cbError({}));
    const result = await run("cmd");
    expect(result).toEqual({ stdout: "", stderr: "", exitCode: 1 });
  });

  it("handles error thrown as an Error instance", async () => {
    mockedExecFile.mockImplementation((...args: unknown[]) => {
      const cb = args[args.length - 1];
      if (typeof cb === "function") cb(new Error("something broke"));
    });
    const result = await run("cmd");
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(1);
  });

  it("handles concurrent run() calls independently", async () => {
    let callCount = 0;
    mockedExecFile.mockImplementation((...args: unknown[]) => {
      callCount++;
      const cb = args[args.length - 1];
      if (typeof cb === "function") {
        cb(null, { stdout: `result-${callCount}`, stderr: "" });
      }
    });

    const [r1, r2, r3] = await Promise.all([
      run("cmd1"),
      run("cmd2"),
      run("cmd3"),
    ]);

    expect(r1.exitCode).toBe(0);
    expect(r2.exitCode).toBe(0);
    expect(r3.exitCode).toBe(0);
    expect(mockedExecFile).toHaveBeenCalledTimes(3);
  });

  it("handles very large stdout output", async () => {
    const largeOutput = "x".repeat(100_000);
    mockedExecFile.mockImplementation(cbSuccess(largeOutput, ""));
    const result = await run("cmd");
    expect(result.stdout).toBe(largeOutput);
    expect(result.exitCode).toBe(0);
  });

  it("trims binary-like whitespace from output", async () => {
    mockedExecFile.mockImplementation(
      cbSuccess("  \t data \r\n  ", " \n\t "),
    );
    const result = await run("cmd");
    expect(result.stdout).toBe("data");
    expect(result.stderr).toBe("");
  });
});

describe("runShell() edge cases", () => {
  it("handles empty command string", async () => {
    const result = await runShell("");
    expect(result.exitCode).toBe(0);
    const call = mockedExec.mock.calls[0] as unknown[];
    expect(call[0]).toBe("");
  });

  it("passes pipe characters through to the shell", async () => {
    await runShell("cat file.txt | grep pattern | wc -l");
    const call = mockedExec.mock.calls[0] as unknown[];
    expect(call[0]).toBe("cat file.txt | grep pattern | wc -l");
  });

  it("passes redirect operators through to the shell", async () => {
    await runShell("echo hello > out.txt 2>&1");
    const call = mockedExec.mock.calls[0] as unknown[];
    expect(call[0]).toBe("echo hello > out.txt 2>&1");
  });

  it("overrides existing env variables", async () => {
    const originalPath = process.env.PATH;
    await runShell("echo", { env: { PATH: "/custom/path" } });
    const call = mockedExec.mock.calls[0] as unknown[];
    const opts = call[1] as Record<string, unknown>;
    const mergedEnv = opts.env as Record<string, string>;
    expect(mergedEnv.PATH).toBe("/custom/path");
    expect(originalPath).toBeDefined();
  });

  it("handles timeout of 0", async () => {
    await runShell("cmd", { timeout: 0 });
    const call = mockedExec.mock.calls[0] as unknown[];
    const opts = call[1] as Record<string, unknown>;
    expect(opts.timeout).toBe(0);
  });

  it("handles error with no properties at all", async () => {
    mockedExec.mockImplementation(cbError({}));
    const result = await runShell("bad");
    expect(result).toEqual({ stdout: "", stderr: "", exitCode: 1 });
  });
});

describe("runInteractive() edge cases", () => {
  it("handles command with no args (default empty array)", async () => {
    mockedSpawn.mockReturnValue(spawnChild(0));
    const result = await runInteractive("echo");
    expect(result).toBe(0);
    expect(mockedSpawn).toHaveBeenCalledWith("echo", [], expect.any(Object));
  });

  it("handles special characters in command and args", async () => {
    mockedSpawn.mockReturnValue(spawnChild(0));
    await runInteractive("echo", ["hello && rm -rf /", "$(whoami)"]);
    expect(mockedSpawn).toHaveBeenCalledWith(
      "echo hello && rm -rf / $(whoami)",
      [],
      expect.any(Object),
    );
  });

  it("returns non-zero exit codes from child process", async () => {
    mockedSpawn.mockReturnValue(spawnChild(42));
    const result = await runInteractive("exit", ["42"]);
    expect(result).toBe(42);
  });

  it("passes process.env to spawn", async () => {
    mockedSpawn.mockReturnValue(spawnChild(0));
    await runInteractive("cmd");
    expect(mockedSpawn).toHaveBeenCalledWith(
      expect.any(String),
      [],
      expect.objectContaining({ env: process.env }),
    );
  });
});

describe("ExecResult with edge values", () => {
  it("preserves empty strings in successful result", async () => {
    mockedExecFile.mockImplementation(cbSuccess("", ""));
    const result = await run("cmd");
    expect(result).toEqual({ stdout: "", stderr: "", exitCode: 0 });
  });

  it("preserves exit code 0 from error when code is explicitly 0", async () => {
    mockedExecFile.mockImplementation(cbError({ code: 0 }));
    const result = await run("cmd");
    expect(result.exitCode).toBe(0);
  });

  it("trims error stdout and stderr", async () => {
    mockedExecFile.mockImplementation(
      cbError({ stdout: "  trimmed  \n", stderr: "\n  err  \n", code: 1 }),
    );
    const result = await run("cmd");
    expect(result.stdout).toBe("trimmed");
    expect(result.stderr).toBe("err");
  });
});
