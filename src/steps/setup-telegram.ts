import * as p from "@clack/prompts";
import { isValidTokenFormat, validateToken } from "../lib/telegram.js";
import { readConfig, writeConfig } from "../lib/config.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

export async function setupTelegram(ctx: SetupContext): Promise<void> {
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

  p.note(
    [
      "To connect your agent to Telegram:",
      "1. Open Telegram and message @BotFather",
      "2. Send /newbot",
      "3. Choose a name and username for your bot",
      "4. Copy the API token",
    ].join("\n"),
    "Telegram Setup",
  );

  const token = await p.text({
    message: "Paste your Telegram bot token:",
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

  if (!botInfo) {
    s.stop("Validation failed");
    p.log.error(
      "Could not validate the token. Check that it's correct and try again.",
    );
    logger.error("Telegram token validation failed");
    process.exit(1);
  }

  s.stop(`Bot @${botInfo.username} connected!`);
  logger.info(`Telegram bot validated: @${botInfo.username}`);

  ctx.telegram = { token: token.trim(), botUsername: botInfo.username };
  writeConfig({
    telegram: { token: token.trim(), botUsername: botInfo.username },
  });
}
