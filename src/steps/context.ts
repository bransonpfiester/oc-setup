export type Channel = "telegram" | "whatsapp" | "discord" | "signal" | "imessage" | "googlechat" | "mattermost" | "webchat";

export interface SetupContext {
  os: { platform: string; arch: string; display: string };
  nodeVersion: string;
  openclawVersion: string | null;
  userName: string;
  agentName: string;
  timezone: string;
  channel: Channel;
  telegramUserId: string;
  telegram: { token: string; botUsername: string } | null;
  discord: { token: string } | null;
  mattermost: { url: string; token: string } | null;
  model: { provider: string; apiKey: string; modelId: string; authMethod: string } | null;
  personality: { description: string; focusAreas: string[] };
  skills: string[];
  gatewayPort: number;
  gatewayPid: number | null;
}

export function createContext(): SetupContext {
  return {
    os: { platform: "", arch: "", display: "" },
    nodeVersion: "",
    openclawVersion: null,
    userName: "",
    agentName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    channel: "telegram",
    telegramUserId: "",
    telegram: null,
    discord: null,
    mattermost: null,
    model: null,
    personality: { description: "", focusAreas: [] },
    skills: [],
    gatewayPort: 18789,
    gatewayPid: null,
  };
}
