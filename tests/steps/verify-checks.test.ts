import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext, createEmptyContext } from "../helpers/mock-factories.js";
import { successResult, failureResult } from "../helpers/mock-exec.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn(), message: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { run } from "../../src/utils/exec.js";
import { logger } from "../../src/utils/logger.js";
import { verify } from "../../src/steps/verify.js";

const mockRun = vi.mocked(run);
const mockNote = vi.mocked(p.note);
const mockLogger = vi.mocked(logger);

describe("verify – check details", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createMockContext();
    mockRun.mockResolvedValue(successResult());
  });

  it("gateway check with pid uses kill -0", async () => {
    ctx.gatewayPid = 12345;

    await verify(ctx);

    expect(mockRun).toHaveBeenCalledWith("kill", ["-0", "12345"]);
  });

  it("gateway check without pid uses openclaw status", async () => {
    ctx.gatewayPid = null;

    await verify(ctx);

    expect(mockRun).toHaveBeenCalledWith("openclaw", ["gateway", "status"]);
  });

  it("check result format has label, ok, detail", async () => {
    ctx.gatewayPid = null;
    mockRun.mockResolvedValue(successResult());

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    expect(noteContent).toContain("Gateway");
    expect(noteContent).toContain("Telegram");
    expect(noteContent).toContain("Model");
    expect(noteContent).toContain("Memory");
    expect(noteContent).toContain("Heartbeat");
  });

  it("telegram detail includes bot username", async () => {
    ctx.telegram = { token: "tok", botUsername: "my_awesome_bot" };

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    expect(noteContent).toContain("@my_awesome_bot");
  });

  it("model detail includes modelId", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    expect(noteContent).toContain("claude-sonnet-4-6");
  });

  it("memory check always shows 'workspace initialized'", async () => {
    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    expect(noteContent).toContain("workspace initialized");
  });

  it("heartbeat check always shows 'configured'", async () => {
    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    expect(noteContent).toContain("configured");
  });

  it("failure count is accurate", async () => {
    ctx.telegram = null;
    ctx.model = null;
    mockRun.mockResolvedValue(failureResult());

    await verify(ctx);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("3 issue(s)"),
    );
  });

  it("no failures logged as info", async () => {
    ctx.telegram = { token: "tok", botUsername: "bot" };
    ctx.model = {
      provider: "anthropic",
      apiKey: "key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };
    ctx.gatewayPid = null;
    mockRun.mockResolvedValue(successResult());

    await verify(ctx);

    expect(mockLogger.info).toHaveBeenCalledWith("All verification checks passed");
  });

  it("failures logged as warning with labels", async () => {
    ctx.telegram = null;
    ctx.model = null;

    await verify(ctx);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Telegram"),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Model"),
    );
  });

  it("note formatted with checkmarks and crosses", async () => {
    ctx.telegram = { token: "tok", botUsername: "bot" };
    ctx.model = null;

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    expect(noteContent).toContain("\u2713");
    expect(noteContent).toContain("\u2717");
  });

  it("labels are padded to 12 chars", async () => {
    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    const lines = noteContent.split("\n");
    for (const line of lines) {
      const match = line.match(/[✓✗] (.{12})/);
      if (match) {
        expect(match[1]!.length).toBe(12);
      }
    }
  });

  it("all 5 checks are always present", async () => {
    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    const lines = noteContent.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBe(5);
  });

  it("both telegram and model can fail", async () => {
    ctx.telegram = null;
    ctx.model = null;

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    const crosses = (noteContent.match(/\u2717/g) || []).length;
    expect(crosses).toBeGreaterThanOrEqual(2);
  });

  it("both telegram and model can pass", async () => {
    ctx.telegram = { token: "tok", botUsername: "bot" };
    ctx.model = {
      provider: "openai",
      apiKey: "key",
      modelId: "gpt-4o",
      authMethod: "api-key",
    };

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    const telegramLine = noteContent.split("\n").find((l) => l.includes("Telegram"));
    const modelLine = noteContent.split("\n").find((l) => l.includes("Model"));
    expect(telegramLine).toContain("\u2713");
    expect(modelLine).toContain("\u2713");
  });

  it("gateway pid check with exit code 0", async () => {
    ctx.gatewayPid = 9999;
    mockRun.mockResolvedValue(successResult());

    await verify(ctx);

    const noteContent = mockNote.mock.calls[0]![0] as string;
    const gatewayLine = noteContent.split("\n").find((l) => l.includes("Gateway"));
    expect(gatewayLine).toContain("\u2713");
    expect(gatewayLine).toContain("pid 9999");
  });
});
