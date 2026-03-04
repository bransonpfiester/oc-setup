import * as p from "@clack/prompts";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  PRESETS,
  getPreset,
  generateSoulMd,
  generateUserMd,
  generateHeartbeatMd,
  type PresetKey,
} from "../lib/templates.js";
import { paths } from "../lib/platform.js";
import { writeConfig } from "../lib/config.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const FOCUS_OPTIONS = [
  { value: "Email monitoring", label: "Email monitoring" },
  { value: "Calendar management", label: "Calendar management" },
  { value: "Social media", label: "Social media" },
  { value: "Code/development", label: "Code/development" },
  { value: "Research", label: "Research" },
  { value: "Writing", label: "Writing" },
];

export async function setupPersonality(ctx: SetupContext): Promise<void> {
  if (ctx.personality.description && ctx.personality.focusAreas.length > 0) {
    p.log.success("Personality pre-configured");
    return writeFiles(ctx);
  }

  const name = await p.text({
    message: "What's your name?",
    placeholder: "John",
    validate(value) {
      if (!value.trim()) return "Name is required";
    },
  });
  if (p.isCancel(name)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.userName = name.trim();
  ctx.agentName = ctx.userName;

  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  ctx.timezone = detectedTz;
  p.log.info(`Timezone: ${detectedTz}`);

  const presetChoice = await p.select({
    message: "Pick a personality for your agent:",
    options: PRESETS.map((pr) => ({
      value: pr.key,
      label: pr.label,
      hint: pr.description,
    })),
  });
  if (p.isCancel(presetChoice)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const preset = getPreset(presetChoice as string)!;
  ctx.personality.description = preset.description;

  const focusAreas = await p.multiselect({
    message: "What do you mainly need help with?",
    options: FOCUS_OPTIONS.map((opt) => ({
      ...opt,
      selected: preset.focusAreas.includes(opt.value),
    })),
    required: true,
  });
  if (p.isCancel(focusAreas)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.personality.focusAreas = focusAreas as string[];

  return writeFiles(ctx);
}

function writeFiles(ctx: SetupContext): void {
  const s = p.spinner();
  s.start("Generating configuration files...");

  const inputs = {
    userName: ctx.userName,
    agentName: ctx.agentName,
    timezone: ctx.timezone,
    personalityDescription: ctx.personality.description,
    focusAreas: ctx.personality.focusAreas,
  };

  const p_ = paths();
  mkdirSync(p_.openclawDir, { recursive: true });

  writeFileSync(p_.soulFile, generateSoulMd(inputs), "utf-8");
  writeFileSync(p_.userFile, generateUserMd(inputs), "utf-8");
  writeFileSync(p_.heartbeatFile, generateHeartbeatMd(inputs), "utf-8");

  writeConfig({
    user: {
      name: ctx.userName,
      agentName: ctx.agentName,
      timezone: ctx.timezone,
    },
    personality: {
      description: ctx.personality.description,
      focusAreas: ctx.personality.focusAreas,
    },
  });

  s.stop("SOUL.md, USER.md, and HEARTBEAT.md generated");
  logger.info("Personality files generated");
}
