import * as p from "@clack/prompts";
import { isValidTokenFormat, validateToken } from "../lib/telegram.js";
import { readConfig, writeConfig } from "../lib/config.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

const MAX_RETRIES = 3;

function hyperlink(text: string, url: string): string {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}

export async function setupTelegram(ctx: SetupContext): Promise<void> {
  if (ctx.telegram) {
    const s = p.spinner();
    s.start("Validating pre-configured Telegram token...");
    const botInfo = await validateToken(ctx.telegram.token);
    if (botInfo) {
      ctx.telegram.botUsername = botInfo.username;
      s.stop(`Bot @${botInfo.username} connected!`);
      writeConfig({
        telegram: { token: ctx.telegram.token, botUsername: botInfo.username },
      });
      return;
    }
    s.stop("Pre-configured token is invalid");
    p.log.warn("The provided Telegram token didn't validate. Let's enter a new one.");
    ctx.telegram = null;
  }

  const existing = readConfig();
  if (existing.telegram?.token && existing.telegram?.botUsername) {
    const reuse = await p.confirm({
      message: `Existing Telegram bot @${existing.telegram.botUsername} found. Keep it?`,
      initialValue: true,
    });
    if (p.isCancel(reuse)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    if (reuse) {
      ctx.telegram = {
        token: existing.telegram.token,
        botUsername: existing.telegram.botUsername,
      };
      p.log.success(`Using existing bot @${existing.telegram.botUsername}`);
      return;
    }
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
          return "Invalid token format. Should look like: 1234567890:AABBccDDee...";
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
      writeConfig({
        telegram: { token: token.trim(), botUsername: botInfo.username },
      });
      return;
    }

    s.stop("Validation failed");

    if (attempt < MAX_RETRIES) {
      p.log.warn("Could not validate the token. Check that it's correct and try again.");
    } else {
      p.log.error(
        `Failed after ${MAX_RETRIES} attempts. Run oc-setup again when you have a valid token.`,
      );
      logger.error("Telegram token validation failed after max retries");
      process.exit(1);
    }
  }
}
