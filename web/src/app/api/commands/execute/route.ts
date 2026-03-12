import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandling,
  generateId,
} from "@/lib/api-helpers";
import { commandExecuteSchema } from "@/types/api";
import type { CommandExecuteResponse, CommandState } from "@/types/api";
import { commandsStore } from "@/lib/stores/commands";

const ALLOWED_COMMANDS = new Set([
  "setupclaw", "openclaw", "init", "doctor", "update", "reset",
  "add-channel", "status", "config", "logs", "version", "help",
]);

/**
 * @route POST /api/commands/execute
 * @description Execute a CLI command asynchronously. Only whitelisted commands
 *   are permitted. Returns a command ID for polling status and logs.
 * @body {CommandExecuteRequest} Command name, arguments, and execution options
 * @returns {CommandExecuteResponse} Command ID and initial status
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await parseBody(req, commandExecuteSchema);

  if (!ALLOWED_COMMANDS.has(body.command)) {
    throw errorResponse(
      "FORBIDDEN_COMMAND",
      `Command '${body.command}' is not allowed. Permitted: ${Array.from(ALLOWED_COMMANDS).join(", ")}`,
      400
    );
  }

  const commandId = `cmd_${generateId()}`;
  const now = new Date().toISOString();

  commandsStore.set(commandId, {
    status: {
      commandId,
      command: body.command,
      status: "queued" as CommandState,
      exitCode: null,
      startedAt: now,
      completedAt: null,
      duration: null,
      progress: { percentage: 0, currentStep: "Queued", totalSteps: 5, completedSteps: 0 },
    },
    logs: [
      {
        id: `log_${generateId()}`,
        commandId,
        stream: "stdout",
        content: `Command '${body.command}' queued for execution`,
        timestamp: now,
        lineNumber: 1,
      },
    ],
  });

  const response: CommandExecuteResponse = {
    commandId,
    status: "queued" as CommandState,
    startedAt: now,
    estimatedDuration: body.timeout ?? 30000,
  };

  return successResponse(response, 201);
});
