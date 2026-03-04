export interface SetupContext {
  os: { platform: string; arch: string; display: string };
  nodeVersion: string;
  openclawVersion: string | null;
  userName: string;
  agentName: string;
  timezone: string;
  telegram: { token: string; botUsername: string } | null;
  model: { provider: string; apiKey: string; modelId: string } | null;
  personality: { description: string; focusAreas: string[] };
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
    telegram: null,
    model: null,
    personality: { description: "", focusAreas: [] },
    gatewayPort: 18789,
    gatewayPid: null,
  };
}
