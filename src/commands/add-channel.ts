import * as p from "@clack/prompts";
import pc from "picocolors";
import { logger } from "../utils/logger.js";

const SUPPORTED_CHANNELS = ["discord", "imessage", "whatsapp"] as const;
type Channel = (typeof SUPPORTED_CHANNELS)[number];

const CHANNEL_INFO: Record<Channel, { label: string; status: string }> = {
  discord: { label: "Discord", status: "Coming in v2" },
  imessage: { label: "iMessage (BlueBubbles)", status: "Coming in v2" },
  whatsapp: { label: "WhatsApp Business", status: "Coming in v2" },
};

export async function addChannelCommand(channel?: string): Promise<void> {
  p.intro(pc.bold("oc-setup add"));

  if (!channel) {
    const selected = await p.select({
      message: "Which channel would you like to add?",
      options: SUPPORTED_CHANNELS.map((ch) => ({
        value: ch,
        label: CHANNEL_INFO[ch].label,
        hint: CHANNEL_INFO[ch].status,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel("Cancelled.");
      return;
    }

    channel = selected as string;
  }

  const normalized = channel.toLowerCase() as Channel;

  if (!SUPPORTED_CHANNELS.includes(normalized)) {
    p.log.error(
      `Unknown channel: ${channel}. Supported: ${SUPPORTED_CHANNELS.join(", ")}`,
    );
    return;
  }

  const info = CHANNEL_INFO[normalized];
  p.log.info(
    `${info.label} integration is not available yet (${info.status}).`,
  );
  p.log.info(
    "Want it sooner? Contact us at https://openclaw.ai for a custom setup.",
  );

  logger.info(`Add channel requested: ${channel} (not yet available)`);
  p.outro("Stay tuned!");
}
