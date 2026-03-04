import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { paths } from "./platform.js";
import { logger } from "../utils/logger.js";

export interface OpenClawConfig {
  version?: string;
  user?: {
    name?: string;
    agentName?: string;
    timezone?: string;
  };
  telegram?: {
    token?: string;
    botUsername?: string;
  };
  model?: {
    provider?: string;
    apiKey?: string;
    modelId?: string;
  };
  gateway?: {
    port?: number;
    pid?: number;
  };
  personality?: {
    description?: string;
    focusAreas?: string[];
  };
}

export function readConfig(): OpenClawConfig {
  const { configFile } = paths();
  if (!existsSync(configFile)) {
    return {};
  }
  try {
    const raw = readFileSync(configFile, "utf-8");
    return JSON.parse(raw) as OpenClawConfig;
  } catch (err) {
    logger.error(`Failed to read config: ${err}`);
    return {};
  }
}

export function writeConfig(partial: OpenClawConfig): void {
  const { configFile } = paths();
  const dir = dirname(configFile);
  mkdirSync(dir, { recursive: true });

  const existing = readConfig();
  const merged = deepMerge(
    existing as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>,
  );

  writeFileSync(configFile, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  logger.info("Config written successfully");
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}
