import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG_DIR = join(homedir(), ".openclaw", "logs");
const LOG_FILE = join(LOG_DIR, "oc-setup.log");

function ensureLogDir(): void {
  mkdirSync(LOG_DIR, { recursive: true });
}

function redact(message: string): string {
  return message
    .replace(/(sk-ant-[A-Za-z0-9_-]{0,8})[A-Za-z0-9_-]+/g, "$1...")
    .replace(/(sk-[A-Za-z0-9]{0,8})[A-Za-z0-9]+/g, "$1...")
    .replace(/(\d{5,}:[A-Za-z0-9_-]{0,8})[A-Za-z0-9_-]+/g, "$1...")
    .replace(/(AIza[A-Za-z0-9]{0,8})[A-Za-z0-9_-]+/g, "$1...")
    .replace(/(xai-[A-Za-z0-9]{0,8})[A-Za-z0-9_-]+/g, "$1...");
}

function write(level: string, message: string): void {
  const ts = new Date().toISOString();
  const safe = redact(message);
  const line = `[${ts}] [${level}] ${safe}\n`;
  try {
    ensureLogDir();
    appendFileSync(LOG_FILE, line, "utf-8");
  } catch {
    // Logging should never crash the CLI
  }
}

export const logger = {
  info: (msg: string) => write("INFO", msg),
  warn: (msg: string) => write("WARN", msg),
  error: (msg: string) => write("ERROR", msg),
  debug: (msg: string) => write("DEBUG", msg),
  redact,
};
