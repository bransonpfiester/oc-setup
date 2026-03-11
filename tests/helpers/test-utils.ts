import { vi } from "vitest";

export function mockProcessExit(): void {
  vi.spyOn(process, "exit").mockImplementation((() => {
    throw new Error("process.exit called");
  }) as never);
}

export function mockProcessPlatform(platform: string): void {
  Object.defineProperty(process, "platform", { value: platform, writable: true });
}

export function mockProcessArch(arch: string): void {
  Object.defineProperty(process, "arch", { value: arch, writable: true });
}

export function mockProcessVersion(version: string): void {
  Object.defineProperty(process, "version", { value: version, writable: true });
}

export function mockConsole() {
  return {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  };
}

export function createMockFetch(responses: Array<{ status: number; body?: unknown; ok?: boolean }>) {
  let callIndex = 0;
  return vi.fn(async () => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return {
      status: response.status,
      ok: response.ok ?? (response.status >= 200 && response.status < 300),
      json: async () => response.body ?? {},
      text: async () => JSON.stringify(response.body ?? {}),
    };
  });
}

export function createMockFs() {
  return {
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => "{}"),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
    cpSync: vi.fn(),
    rmSync: vi.fn(),
    statfsSync: vi.fn(() => ({ bavail: 10000000, bsize: 4096 })),
  };
}

export function base64Encode(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

export function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function captureStdout(fn: () => void): string {
  const original = process.stdout.write;
  let output = "";
  process.stdout.write = ((chunk: string) => {
    output += chunk;
    return true;
  }) as typeof process.stdout.write;
  try {
    fn();
  } finally {
    process.stdout.write = original;
  }
  return output;
}

export function generateLargeString(length: number): string {
  return "a".repeat(length);
}

export function generateLargeArray<T>(length: number, factory: (i: number) => T): T[] {
  return Array.from({ length }, (_, i) => factory(i));
}
