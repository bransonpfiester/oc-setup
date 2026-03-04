import { logger } from "../utils/logger.js";

const TOKEN_REGEX = /^\d{8,}:[A-Za-z0-9_-]{35,}$/;
const API_BASE = "https://api.telegram.org/bot";

export interface TelegramBotInfo {
  id: number;
  username: string;
  firstName: string;
}

export function isValidTokenFormat(token: string): boolean {
  return TOKEN_REGEX.test(token.trim());
}

export async function validateToken(
  token: string,
): Promise<TelegramBotInfo | null> {
  const clean = token.trim();
  if (!isValidTokenFormat(clean)) {
    logger.warn("Telegram token failed format check");
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}${clean}/getMe`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logger.warn(`Telegram API returned ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      ok: boolean;
      result?: { id: number; username: string; first_name: string };
    };
    if (!data.ok || !data.result) {
      return null;
    }
    return {
      id: data.result.id,
      username: data.result.username,
      firstName: data.result.first_name,
    };
  } catch (err) {
    logger.error(`Telegram validation failed: ${err}`);
    return null;
  }
}
