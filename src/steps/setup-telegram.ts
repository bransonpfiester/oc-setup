import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isValidTokenFormat, validateToken } from "../lib/telegram.js";
import { logger } from "../utils/logger.js";
import { runShell } from "../utils/exec.js";
import type { SetupContext } from "./context.js";

const MAX_RETRIES = 3;
const OPENCLAW_CONFIG = join(homedir(), ".openclaw", "openclaw.json");

function hyperlink(text: string, url: string): string {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}

export async function collectTelegramInputs(ctx: SetupContext): Promise<void> {
  await collectUserId(ctx);
  await collectBotToken(ctx);
}

export async function configureTelegram(ctx: SetupContext): Promise<void> {
  if (!ctx.telegram || !ctx.telegramUserId) {
    p.log.warn("Telegram not fully configured. Skipping channel setup.");
    return;
  }

  writeOpenClawTelegramConfig(ctx);

  const s = p.spinner();
  s.start("Restarting gateway to apply Telegram config...");

  const result = await runShell("openclaw gateway restart", { timeout: 30_000 });

  if (result.exitCode === 0) {
    s.stop("Gateway restarted with Telegram enabled");
  } else {
    s.stop("Gateway restart skipped");
    p.log.info("Restart manually if needed: openclaw gateway restart");
  }

  logger.info("Telegram channel configured and gateway restarted");
}

async function collectUserId(ctx: SetupContext): Promise<void> {
  if (ctx.telegramUserId) {
    p.log.success(`Telegram user ID: ${ctx.telegramUserId}`);
    return;
  }

  const userinfoLink = hyperlink("@userinfobot", "https://t.me/userinfobot");

  const userId = await p.text({
    message: `Your Telegram user ID (message ${userinfoLink} to get it):`,
    placeholder: "123456789",
    validate(value) {
      if (!value.trim()) return "User ID is required";
      if (!/^\d+$/.test(value.trim()))
        return "User ID should be a number (e.g. 123456789)";
    },
  });

  if (p.isCancel(userId)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  ctx.telegramUserId = userId.trim();
  logger.info(`Telegram user ID set: ${ctx.telegramUserId}`);
}

async function collectBotToken(ctx: SetupContext): Promise<void> {
  if (ctx.telegram) {
    const s = p.spinner();
    s.start("Validating Telegram token...");
    const botInfo = await validateToken(ctx.telegram.token);
    if (botInfo) {
      ctx.telegram.botUsername = botInfo.username;
      s.stop(`Bot @${botInfo.username} connected!`);
      return;
    }
    s.stop("Token invalid");
    p.log.warn("The provided token didn't validate. Let's enter a new one.");
    ctx.telegram = null;
  }

  const botFatherLink = hyperlink("Open @BotFather in Telegram", "https://t.me/BotFather");

  p.note(
    [
      "To connect your agent to Telegram:",
      `1. ${botFatherLink}`,
      "2. Send /newbot",
      "3. Choose a name and username for your bot",
      "4. Copy the API token",
    ].join("\n"),
    "Telegram Setup",
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const token = await p.text({
      message: attempt > 1
        ? `Paste your Telegram bot token (attempt ${attempt}/${MAX_RETRIES}):`
        : "Paste your Telegram bot token:",
      placeholder: "7891234567:AAH...",
      validate(value) {
        if (!value.trim()) return "Token is required";
        if (!isValidTokenFormat(value.trim()))
          return "Invalid format. Should look like: 1234567890:AABBccDDee...";
      },
    });

    if (p.isCancel(token)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    const s = p.spinner();
    s.start("Validating token with Telegram...");
    const botInfo = await validateToken(token);

    if (botInfo) {
      s.stop(`Bot @${botInfo.username} connected!`);
      logger.info(`Telegram bot validated: @${botInfo.username}`);
      ctx.telegram = { token: token.trim(), botUsername: botInfo.username };
      return;
    }

    s.stop("Validation failed");
    if (attempt < MAX_RETRIES) {
      p.log.warn("Could not validate the token. Try again.");
    } else {
      p.log.error(`Failed after ${MAX_RETRIES} attempts.`);
      logger.error("Telegram token validation failed after max retries");
      process.exit(1);
    }
  }
}

function writeOpenClawTelegramConfig(ctx: SetupContext): void {
  if (!ctx.telegram || !ctx.telegramUserId) return;

  const s = p.spinner();
  s.start("Writing Telegram config with allowed sender...");

  try {
    const dir = join(homedir(), ".openclaw");
    mkdirSync(dir, { recursive: true });

    let ocConfig: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_CONFIG)) {
      try {
        ocConfig = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8"));
      } catch {
        ocConfig = {};
      }
    }

    const channels = (ocConfig.channels ?? {}) as Record<string, unknown>;
    const existingTg = (channels.telegram ?? {}) as Record<string, unknown>;

    const existingAllowFrom = Array.isArray(existingTg.allowFrom)
      ? (existingTg.allowFrom as string[])
      : [];

    const allowFrom = existingAllowFrom.includes(ctx.telegramUserId)
      ? existingAllowFrom
      : [...existingAllowFrom, ctx.telegramUserId];

    channels.telegram = {
      ...existingTg,
      enabled: true,
      botToken: ctx.telegram.token,
      dmPolicy: "allowlist",
      allowFrom,
    };

    ocConfig.channels = channels;

    writeFileSync(
      OPENCLAW_CONFIG,
      JSON.stringify(ocConfig, null, 2) + "\n",
      "utf-8",
    );

    s.stop(`Telegram enabled — user ${ctx.telegramUserId} approved`);
    logger.info(`Wrote channels.telegram to openclaw.json with allowFrom: [${allowFrom.join(", ")}]`);
  } catch (err) {
    s.stop("Could not write Telegram config");
    p.log.warn(`Failed: ${err}`);
    p.log.info(
      `Add manually:\n  openclaw config set channels.telegram.allowFrom '["${ctx.telegramUserId}"]'`,
    );
    logger.error(`openclaw.json write failed: ${err}`);
  }
}
