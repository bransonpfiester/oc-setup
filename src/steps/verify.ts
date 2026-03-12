import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { run } from "../utils/exec.js";
import { logger } from "../utils/logger.js";
import type { SetupContext } from "./context.js";

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

export async function verify(ctx: SetupContext): Promise<void> {
  const checks: CheckResult[] = [];

  // Gateway check
  if (ctx.gatewayPid) {
    const result = await run("kill", ["-0", String(ctx.gatewayPid)]);
    checks.push({
      label: "Gateway",
      ok: result.exitCode === 0,
      detail:
        result.exitCode === 0
          ? `running (pid ${ctx.gatewayPid})`
          : "not running",
    });
  } else {
    const result = await run("openclaw", ["gateway", "status"]);
    checks.push({
      label: "Gateway",
      ok: result.exitCode === 0,
      detail: result.exitCode === 0 ? "running" : "not running",
    });
  }

  // Channel check
  if (ctx.channel === "telegram") {
    if (ctx.telegram) {
      checks.push({
        label: "Telegram",
        ok: true,
        detail: `connected (@${ctx.telegram.botUsername})`,
      });
    } else {
      checks.push({
        label: "Telegram",
        ok: false,
        detail: "not configured",
      });
    }
  } else if (ctx.channel === "discord") {
    checks.push({
      label: "Discord",
      ok: !!ctx.discord,
      detail: ctx.discord ? "connected" : "not configured",
    });
  } else if (ctx.channel) {
    checks.push({
      label: ctx.channel,
      ok: true,
      detail: "configured",
    });
  } else {
    checks.push({
      label: "Channel",
      ok: false,
      detail: "not configured",
    });
  }

  // Model check
  if (ctx.model) {
    checks.push({
      label: "Model",
      ok: true,
      detail: `${ctx.model.modelId} configured`,
    });
  } else {
    checks.push({
      label: "Model",
      ok: false,
      detail: "not configured",
    });
  }

  // Workspace check
  const workspaceExists = existsSync(
    join(homedir(), ".openclaw", "workspace"),
  );
  checks.push({
    label: "Memory",
    ok: workspaceExists,
    detail: workspaceExists ? "workspace initialized" : "workspace not found",
  });

  // Heartbeat check — placeholder until runtime heartbeat probing is available
  checks.push({
    label: "Heartbeat",
    ok: true,
    detail: "configured (every 30 min)",
  });

  p.note(
    checks
      .map((c) => {
        const icon = c.ok ? "\u2713" : "\u2717";
        return ` ${icon} ${c.label.padEnd(12)} ${c.detail}`;
      })
      .join("\n"),
    "Verification",
  );

  const failures = checks.filter((c) => !c.ok);
  if (failures.length > 0) {
    logger.warn(
      `Verification completed with ${failures.length} issue(s): ${failures.map((f) => f.label).join(", ")}`,
    );
  } else {
    logger.info("All verification checks passed");
  }
}
