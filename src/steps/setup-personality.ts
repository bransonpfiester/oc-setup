import * as p from "@clack/prompts";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  generateSoulMd,
  generateUserMd,
  generateHeartbeatMd,
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
  const name = await p.text({
    message: "What's your name?",
    placeholder: "Casey",
    validate(value) {
      if (!value.trim()) return "Name is required";
    },
  });
  if (p.isCancel(name)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.userName = name.trim();

  const agentName = await p.text({
    message: "What should your agent call you?",
    placeholder: ctx.userName,
    initialValue: ctx.userName,
  });
  if (p.isCancel(agentName)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.agentName = (agentName as string).trim() || ctx.userName;

  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tz = await p.text({
    message: "What's your timezone?",
    placeholder: detectedTz,
    initialValue: detectedTz,
  });
  if (p.isCancel(tz)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.timezone = (tz as string).trim() || detectedTz;

  const description = await p.text({
    message: "Describe your agent's personality in a sentence:",
    placeholder: "Direct, practical, helps me run my business",
    validate(value) {
      if (!value.trim()) return "Please provide a brief personality description";
    },
  });
  if (p.isCancel(description)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.personality.description = description.trim();

  const focusAreas = await p.multiselect({
    message: "What do you mainly need help with? (select all that apply)",
    options: FOCUS_OPTIONS,
    required: true,
  });
  if (p.isCancel(focusAreas)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  ctx.personality.focusAreas = focusAreas as string[];

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
