import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { configGenerate, parseBody } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

interface ConfigFile {
  name: string;
  path: string;
  content: string;
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  openrouter: "anthropic/claude-sonnet-4-20250514",
};

/**
 * @description Generate an OpenClaw configuration with default values and supporting files.
 * @param request - The incoming Next.js request containing config generation parameters
 * @returns ConfigGenerateResult with generated config, files array, and setup instructions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseBody(configGenerate, body);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const modelId = data.modelId ?? DEFAULT_MODELS[data.provider] ?? "gpt-4o";
    const personality =
      data.personality ??
      `You are ${data.agentName}, a helpful AI assistant created by ${data.userName}.`;

    const config = {
      id,
      name: `${data.agentName}-config`,
      version: "2.0.2",
      user: { name: data.userName, agentName: data.agentName },
      channel: data.channel,
      model: { provider: data.provider, modelId },
      personality,
      focusAreas: data.focusAreas ?? [],
      gateway: {
        host: "0.0.0.0",
        port: 18789,
        tls: false,
        corsOrigins: ["*"],
      },
      parameters: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stopSequences: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    const files: ConfigFile[] = [
      {
        name: "config.json",
        path: "config.json",
        content: JSON.stringify(config, null, 2),
      },
      {
        name: "SOUL.md",
        path: "SOUL.md",
        content: [
          `# ${data.agentName} - Soul Configuration`,
          "",
          "## Personality",
          personality,
          "",
          "## Focus Areas",
          ...(config.focusAreas.length > 0
            ? config.focusAreas.map((a) => `- ${a}`)
            : ["- General assistance"]),
          "",
          "## Guidelines",
          "- Be helpful, honest, and harmless",
          "- Provide clear and concise responses",
          "- Ask for clarification when needed",
        ].join("\n"),
      },
      {
        name: "USER.md",
        path: "USER.md",
        content: [
          `# User Profile - ${data.userName}`,
          "",
          "## Preferences",
          `- Provider: ${data.provider}`,
          `- Channel: ${data.channel}`,
          `- Model: ${modelId}`,
          "",
          "## Notes",
          "Add personal preferences and context here.",
        ].join("\n"),
      },
    ];

    const instructions = [
      "Save config.json to your OpenClaw directory",
      "Place SOUL.md and USER.md alongside config.json",
      `Set your ${data.provider.toUpperCase()}_API_KEY environment variable`,
      `Run 'openclaw start' to launch the gateway on port ${config.gateway.port}`,
      `Connect your ${data.channel} channel to begin chatting`,
    ];

    return success({ config, files, instructions });
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
