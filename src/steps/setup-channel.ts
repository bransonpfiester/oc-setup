import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isValidTokenFormat, validateToken } from "../lib/telegram.js";
import { runShell } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext, Channel } from "./context.js";

const MAX_RETRIES = 3;
const OPENCLAW_CONFIG = join(homedir(), ".openclaw", "openclaw.json");

function hyperlink(text: string, url: string): string {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}

export async function collectChannelInputs(ctx: SetupContext): Promise<void> {
  if (!ctx.channel || ctx.channel === "telegram") {
    const channel = await p.select({
      message: "Which messaging channel?",
      options: [
        { value: "telegram", label: "Telegram", hint: "recommended" },
        { value: "whatsapp", label: "WhatsApp", hint: "QR code during onboarding" },
        { value: "discord", label: "Discord", hint: "bot token" },
        { value: "signal", label: "Signal", hint: "set up during onboarding" },
        { value: "imessage", label: "iMessage", hint: "macOS only" },
        { value: "googlechat", label: "Google Chat", hint: "requires Workspace" },
        { value: "mattermost", label: "Mattermost", hint: "self-hosted" },
        { value: "webchat", label: "WebChat", hint: "browser only, no setup" },
      ],
    });

    if (p.isCancel(channel)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    ctx.channel = channel as Channel;
  }

  switch (ctx.channel) {
    case "telegram":
      await collectTelegramInputs(ctx);
      break;
    case "discord":
      await collectDiscordInputs(ctx);
      break;
    case "mattermost":
      await collectMattermostInputs(ctx);
      break;
    case "whatsapp":
      p.log.info("WhatsApp will be configured during OpenClaw onboarding (QR code scan).");
      break;
    case "signal":
      p.log.info("Signal will be configured during OpenClaw onboarding.");
      break;
    case "imessage":
      p.log.info("iMessage will be configured during OpenClaw onboarding (macOS only).");
      break;
    case "googlechat":
      p.log.info("Google Chat will be configured during OpenClaw onboarding (requires Workspace).");
      break;
    case "webchat":
      p.log.info("WebChat needs no setup. After install, open http://localhost:18789 in your browser.");
      break;
  }
}

export async function configureChannel(ctx: SetupContext): Promise<void> {
  switch (ctx.channel) {
    case "telegram":
      await configureTelegram(ctx);
      break;
    case "discord":
      configureDiscord(ctx);
      break;
    case "mattermost":
      configureMattermost(ctx);
      break;
    default:
      break;
  }
}

async function collectTelegramInputs(ctx: SetupContext): Promise<void> {
  if (!ctx.telegramUserId) {
    const userinfoLink = hyperlink("@userinfobot", "https://t.me/userinfobot");
    const userId = await p.text({
      message: `Your Telegram user ID (message ${userinfoLink} to get it):`,
      placeholder: "123456789",
      validate(value) {
        if (!value.trim()) return "User ID is required";
        if (!/^\d+$/.test(value.trim())) return "User ID should be a number";
      },
    });
    if (p.isCancel(userId)) { p.cancel("Setup cancelled."); process.exit(0); }
    ctx.telegramUserId = userId.trim();
  } else {
    p.log.success(`Telegram user ID: ${ctx.telegramUserId}`);
  }

  if (!ctx.telegram) {
    const botFatherLink = hyperlink("Open @BotFather", "https://t.me/BotFather");
    p.note(
      [`To connect to Telegram:`, `1. ${botFatherLink}`, "2. Send /newbot", "3. Copy the API token"].join("\n"),
      "Telegram Setup",
    );

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const token = await p.text({
        message: attempt > 1 ? `Bot token (attempt ${attempt}/${MAX_RETRIES}):` : "Paste your Telegram bot token:",
        placeholder: "7891234567:AAH...",
        validate(value) {
          if (!value.trim()) return "Token is required";
          if (!isValidTokenFormat(value.trim())) return "Invalid format";
        },
      });
      if (p.isCancel(token)) { p.cancel("Setup cancelled."); process.exit(0); }

      const s = p.spinner();
      s.start("Validating token...");
      const botInfo = await validateToken(token);
      if (botInfo) {
        s.stop(`Bot @${botInfo.username} connected!`);
        ctx.telegram = { token: token.trim(), botUsername: botInfo.username };
        return;
      }
      s.stop("Validation failed");
      if (attempt === MAX_RETRIES) { p.log.error("Failed after 3 attempts."); process.exit(1); }
      p.log.warn("Try again.");
    }
  } else {
    const s = p.spinner();
    s.start("Validating Telegram token...");
    const botInfo = await validateToken(ctx.telegram.token);
    if (botInfo) {
      ctx.telegram.botUsername = botInfo.username;
      s.stop(`Bot @${botInfo.username} connected!`);
    } else {
      s.stop("Token invalid");
      p.log.warn("Pre-configured token didn't validate.");
      ctx.telegram = null;
      await collectTelegramInputs(ctx);
    }
  }
}

async function collectDiscordInputs(ctx: SetupContext): Promise<void> {
  if (ctx.discord) {
    p.log.success("Discord token pre-configured");
    return;
  }

  p.note(
    [
      "To connect to Discord:",
      "1. Go to discord.com/developers/applications",
      "2. Create a New Application > Bot > Reset Token",
      "3. Copy the bot token",
      "4. Under OAuth2 > URL Generator, select 'bot' scope and invite to your server",
    ].join("\n"),
    "Discord Setup",
  );

  const token = await p.text({
    message: "Paste your Discord bot token:",
    placeholder: "MTIz...",
    validate(value) { if (!value.trim()) return "Token is required"; },
  });
  if (p.isCancel(token)) { p.cancel("Setup cancelled."); process.exit(0); }
  ctx.discord = { token: token.trim() };
}

async function collectMattermostInputs(ctx: SetupContext): Promise<void> {
  if (ctx.mattermost) {
    p.log.success("Mattermost pre-configured");
    return;
  }

  const url = await p.text({
    message: "Mattermost server URL:",
    placeholder: "https://your-mattermost.com",
    validate(value) { if (!value.trim()) return "URL is required"; },
  });
  if (p.isCancel(url)) { p.cancel("Setup cancelled."); process.exit(0); }

  const token = await p.text({
    message: "Mattermost bot token:",
    placeholder: "abc123...",
    validate(value) { if (!value.trim()) return "Token is required"; },
  });
  if (p.isCancel(token)) { p.cancel("Setup cancelled."); process.exit(0); }

  ctx.mattermost = { url: (url as string).trim(), token: (token as string).trim() };
}

async function configureTelegram(ctx: SetupContext): Promise<void> {
  if (!ctx.telegram || !ctx.telegramUserId) return;

  const s = p.spinner();
  s.start("Writing Telegram config...");

  try {
    const dir = join(homedir(), ".openclaw");
    mkdirSync(dir, { recursive: true });

    let ocConfig: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_CONFIG)) {
      try { ocConfig = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8")); } catch { ocConfig = {}; }
    }

    const channels = (ocConfig.channels ?? {}) as Record<string, unknown>;
    const existingTg = (channels.telegram ?? {}) as Record<string, unknown>;
    const existingAllowFrom = Array.isArray(existingTg.allowFrom) ? (existingTg.allowFrom as string[]) : [];
    const allowFrom = existingAllowFrom.includes(ctx.telegramUserId) ? existingAllowFrom : [...existingAllowFrom, ctx.telegramUserId];

    channels.telegram = { ...existingTg, enabled: true, botToken: ctx.telegram.token, dmPolicy: "allowlist", allowFrom };
    ocConfig.channels = channels;

    writeFileSync(OPENCLAW_CONFIG, JSON.stringify(ocConfig, null, 2) + "\n", "utf-8");
    s.stop(`Telegram enabled — user ${ctx.telegramUserId} approved`);
  } catch (err) {
    s.stop("Could not write Telegram config");
    p.log.warn(`${err}`);
  }

  const rs = p.spinner();
  rs.start("Restarting gateway...");

  let restarted = false;
  const restartResult = await runShell("openclaw gateway restart 2>&1", { timeout: 30_000 });
  if (restartResult.exitCode === 0) { restarted = true; }
  else {
    await runShell("openclaw gateway stop 2>&1", { timeout: 15_000 });
    const startResult = await runShell("openclaw gateway start 2>&1", { timeout: 30_000 });
    if (startResult.exitCode === 0) restarted = true;
  }

  rs.stop(restarted ? "Gateway restarted" : "Restart manually: openclaw gateway restart");
}

function configureDiscord(ctx: SetupContext): void {
  if (!ctx.discord) return;

  try {
    let ocConfig: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_CONFIG)) {
      try { ocConfig = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8")); } catch { ocConfig = {}; }
    }

    const channels = (ocConfig.channels ?? {}) as Record<string, unknown>;
    channels.discord = { enabled: true, token: ctx.discord.token };
    ocConfig.channels = channels;

    writeFileSync(OPENCLAW_CONFIG, JSON.stringify(ocConfig, null, 2) + "\n", "utf-8");
    p.log.success("Discord channel configured");
  } catch (err) {
    p.log.warn(`Could not write Discord config: ${err}`);
  }
}

function configureMattermost(ctx: SetupContext): void {
  if (!ctx.mattermost) return;

  try {
    let ocConfig: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_CONFIG)) {
      try { ocConfig = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8")); } catch { ocConfig = {}; }
    }

    const channels = (ocConfig.channels ?? {}) as Record<string, unknown>;
    channels.mattermost = { enabled: true, baseUrl: ctx.mattermost.url, botToken: ctx.mattermost.token };
    ocConfig.channels = channels;

    writeFileSync(OPENCLAW_CONFIG, JSON.stringify(ocConfig, null, 2) + "\n", "utf-8");
    p.log.success("Mattermost channel configured");
  } catch (err) {
    p.log.warn(`Could not write Mattermost config: ${err}`);
  }
}
