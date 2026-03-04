export interface TemplateInputs {
  userName: string;
  agentName: string;
  timezone: string;
  personalityDescription: string;
  focusAreas: string[];
}

export function generateSoulMd(inputs: TemplateInputs): string {
  const focusList = inputs.focusAreas.map((a) => `- ${a}`).join("\n");

  return `# SOUL.md

## Core
- ${inputs.personalityDescription}
- Help ${inputs.userName} with their priorities efficiently.
- Be proactive — check relevant channels, flag urgent items, prep for upcoming events.

## Focus Areas
${focusList}

## Boundaries
- Ask before sending anything external.
- Private info stays private.
- When in doubt, ask ${inputs.userName}.
`;
}

export function generateUserMd(inputs: TemplateInputs): string {
  const focusStr = inputs.focusAreas.join(", ");

  return `# USER.md
- **Name:** ${inputs.userName}
- **Preferred name:** ${inputs.agentName}
- **Timezone:** ${inputs.timezone}
- **Focus areas:** ${focusStr}
`;
}

export function generateHeartbeatMd(inputs: TemplateInputs): string {
  const checks = inputs.focusAreas
    .map((area) => {
      switch (area.toLowerCase()) {
        case "email monitoring":
          return "Check inbox for urgent emails. Flag anything that needs attention.";
        case "calendar management":
          return "Check calendar for upcoming events in the next 4 hours.";
        case "social media":
          return "Check social media mentions and messages.";
        case "code/development":
          return "Check for any failed builds or critical alerts.";
        case "research":
          return "Review any pending research tasks.";
        case "writing":
          return "Check for any writing deadlines approaching.";
        default:
          return `Check on ${area} tasks.`;
      }
    })
    .join("\n");

  return `# HEARTBEAT.md
${checks}
If nothing needs attention, reply HEARTBEAT_OK.
`;
}
