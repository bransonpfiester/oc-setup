import type { CommandStatusResponse, CommandLog } from "@/types/api";

interface StoredCommand {
  status: CommandStatusResponse;
  logs: CommandLog[];
}

export const commandsStore = new Map<string, StoredCommand>();

commandsStore.set("cmd_001", {
  status: {
    commandId: "cmd_001",
    command: "setupclaw",
    status: "completed",
    exitCode: 0,
    startedAt: "2025-03-10T09:00:00Z",
    completedAt: "2025-03-10T09:00:05Z",
    duration: 5000,
    progress: { percentage: 100, currentStep: "Done", totalSteps: 5, completedSteps: 5 },
  },
  logs: [
    { id: "log_001", commandId: "cmd_001", stream: "stdout", content: "Initializing OpenClaw setup...", timestamp: "2025-03-10T09:00:00Z", lineNumber: 1 },
    { id: "log_002", commandId: "cmd_001", stream: "stdout", content: "Detecting platform: darwin arm64", timestamp: "2025-03-10T09:00:01Z", lineNumber: 2 },
    { id: "log_003", commandId: "cmd_001", stream: "stdout", content: "Checking Node.js version: v22.0.0", timestamp: "2025-03-10T09:00:02Z", lineNumber: 3 },
    { id: "log_004", commandId: "cmd_001", stream: "stderr", content: "Warning: No .env file found", timestamp: "2025-03-10T09:00:02Z", lineNumber: 4 },
    { id: "log_005", commandId: "cmd_001", stream: "stdout", content: "Setup complete!", timestamp: "2025-03-10T09:00:05Z", lineNumber: 5 },
  ],
});

commandsStore.set("cmd_002", {
  status: {
    commandId: "cmd_002",
    command: "openclaw",
    status: "running",
    exitCode: null,
    startedAt: "2025-03-10T09:10:00Z",
    completedAt: null,
    duration: null,
    progress: { percentage: 60, currentStep: "Installing dependencies", totalSteps: 5, completedSteps: 3 },
  },
  logs: [
    { id: "log_010", commandId: "cmd_002", stream: "stdout", content: "Starting openclaw...", timestamp: "2025-03-10T09:10:00Z", lineNumber: 1 },
    { id: "log_011", commandId: "cmd_002", stream: "stdout", content: "Installing dependencies...", timestamp: "2025-03-10T09:10:02Z", lineNumber: 2 },
  ],
});
