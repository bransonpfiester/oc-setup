import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";

vi.mock("@clack/prompts", () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../src/utils/exec.js", () => ({
  run: vi.fn(),
  runShell: vi.fn(),
  runInteractive: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  detectPlatform: vi.fn(),
  paths: vi.fn(),
  installHint: vi.fn(),
}));

vi.mock("../../src/lib/config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock("../../src/lib/telegram.js", () => ({
  isValidTokenFormat: vi.fn(),
  validateToken: vi.fn(),
}));

vi.mock("../../src/lib/models.js", () => ({
  MODEL_PROVIDERS: [],
  validateApiKey: vi.fn(),
}));

vi.mock("../../src/lib/templates.js", () => ({
  PRESETS: [],
  getPreset: vi.fn(),
  generateSoulMd: vi.fn(),
  generateUserMd: vi.fn(),
  generateHeartbeatMd: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

import { installClawHub } from "../../src/steps/install-clawhub.js";
import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { run } from "../../src/utils/exec.js";
import { createEmptyContext } from "../helpers/mock-factories.js";

describe("installClawHub — skills installation", () => {
  let ctx: SetupContext;
  let spinnerObj: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ctx = createEmptyContext();
    spinnerObj = { start: vi.fn(), stop: vi.fn() };
    vi.mocked(p.spinner).mockReturnValue(spinnerObj as any);
    vi.mocked(run).mockResolvedValueOnce({
      stdout: "1.0.0", stderr: "", exitCode: 0,
    });
  });

  it("install 1 skill", async () => {
    ctx.skills = ["web-search"];
    vi.mocked(run).mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 1 skill...");
    expect(spinnerObj.stop).toHaveBeenCalledWith("1 skill installed");
  });

  it("install 3 skills", async () => {
    ctx.skills = ["a", "b", "c"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 3 skills...");
    expect(spinnerObj.stop).toHaveBeenCalledWith("3 skills installed");
  });

  it("install 10 skills", async () => {
    ctx.skills = Array.from({ length: 10 }, (_, i) => `skill-${i}`);
    for (let i = 0; i < 10; i++) {
      vi.mocked(run).mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });
    }

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 10 skills...");
    expect(spinnerObj.stop).toHaveBeenCalledWith("10 skills installed");
  });

  it("first skill fails, others succeed", async () => {
    ctx.skills = ["bad", "good1", "good2"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("2 installed, 1 failed");
    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("bad"),
    );
  });

  it("last skill fails, others succeed", async () => {
    ctx.skills = ["good1", "good2", "bad"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("2 installed, 1 failed");
    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("bad"),
    );
  });

  it("all skills fail", async () => {
    ctx.skills = ["x", "y", "z"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(spinnerObj.stop).toHaveBeenCalledWith("0 installed, 3 failed");
  });

  it("empty skills array (no install)", async () => {
    ctx.skills = [];

    await installClawHub(ctx);

    const installCalls = vi.mocked(run).mock.calls.filter(
      (c) => c[0] === "clawhub" && c[1]?.[0] === "install",
    );
    expect(installCalls).toHaveLength(0);
  });

  it("skill names with special characters", async () => {
    ctx.skills = ["my-skill", "@scope/skill", "skill_v2"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(run).toHaveBeenCalledWith("clawhub", ["install", "my-skill"], expect.any(Object));
    expect(run).toHaveBeenCalledWith("clawhub", ["install", "@scope/skill"], expect.any(Object));
    expect(run).toHaveBeenCalledWith("clawhub", ["install", "skill_v2"], expect.any(Object));
  });

  it("singular message for 1 skill", async () => {
    ctx.skills = ["only"];
    vi.mocked(run).mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 1 skill...");
    expect(spinnerObj.stop).toHaveBeenCalledWith("1 skill installed");
  });

  it("plural message for multiple skills", async () => {
    ctx.skills = ["a", "b"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 2 skills...");
    expect(spinnerObj.stop).toHaveBeenCalledWith("2 skills installed");
  });

  it("spinner shows correct count", async () => {
    ctx.skills = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 5; i++) {
      vi.mocked(run).mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });
    }

    await installClawHub(ctx);

    expect(spinnerObj.start).toHaveBeenCalledWith("Installing 5 skills...");
  });

  it("failed skills show individual warnings", async () => {
    ctx.skills = ["ok", "fail1", "fail2"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("fail1"));
    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("fail2"));
  });

  it("manual install hint shown on partial failure", async () => {
    ctx.skills = ["ok", "bad"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 });

    await installClawHub(ctx);

    expect(p.log.info).toHaveBeenCalledWith(
      "Install failed skills manually: clawhub install <name>",
    );
  });

  it("logger includes succeeded and failed lists", async () => {
    ctx.skills = ["search", "broken", "calendar"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "err", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("search"),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("calendar"),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("broken"),
    );
  });

  it("skills installed sequentially (order preserved)", async () => {
    ctx.skills = ["first", "second", "third"];
    const callOrder: string[] = [];
    vi.mocked(run).mockImplementation(async (cmd, args) => {
      if (cmd === "clawhub" && args?.[0] === "install") {
        callOrder.push(args[1]);
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    });

    await installClawHub(ctx);

    expect(callOrder).toEqual(["first", "second", "third"]);
  });

  it("timeout per skill is 60_000", async () => {
    ctx.skills = ["s1", "s2"];
    vi.mocked(run)
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 });

    await installClawHub(ctx);

    const skillCalls = vi.mocked(run).mock.calls.filter(
      (c) => c[0] === "clawhub" && c[1]?.[0] === "install",
    );
    for (const call of skillCalls) {
      expect(call[2]).toEqual(expect.objectContaining({ timeout: 60_000 }));
    }
  });
});
