import { vi } from "vitest";

export interface MockFileSystem {
  files: Map<string, string>;
  dirs: Set<string>;
  existsSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
  writeFileSync: ReturnType<typeof vi.fn>;
  mkdirSync: ReturnType<typeof vi.fn>;
  appendFileSync: ReturnType<typeof vi.fn>;
  cpSync: ReturnType<typeof vi.fn>;
  rmSync: ReturnType<typeof vi.fn>;
  statfsSync: ReturnType<typeof vi.fn>;
}

export function createMockFileSystem(initialFiles: Record<string, string> = {}): MockFileSystem {
  const files = new Map<string, string>(Object.entries(initialFiles));
  const dirs = new Set<string>();

  const existsSync = vi.fn((path: string) => files.has(path) || dirs.has(path));

  const readFileSync = vi.fn((path: string) => {
    if (files.has(path)) return files.get(path)!;
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  });

  const writeFileSync = vi.fn((path: string, content: string) => {
    files.set(path, content);
  });

  const mkdirSync = vi.fn((path: string) => {
    dirs.add(path);
  });

  const appendFileSync = vi.fn((path: string, content: string) => {
    const existing = files.get(path) ?? "";
    files.set(path, existing + content);
  });

  const cpSync = vi.fn();
  const rmSync = vi.fn((path: string) => {
    files.delete(path);
    dirs.delete(path);
  });

  const statfsSync = vi.fn(() => ({
    bavail: 10000000,
    bsize: 4096,
  }));

  return {
    files,
    dirs,
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
    appendFileSync,
    cpSync,
    rmSync,
    statfsSync,
  };
}
