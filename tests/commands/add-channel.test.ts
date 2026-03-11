import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn(), message: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("picocolors", () => ({
  default: {
    bold: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    red: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
  },
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { logger } from "../../src/utils/logger.js";
import { addChannelCommand } from "../../src/commands/add-channel.js";

const mockSelect = vi.mocked(p.select);
const mockIsCancel = vi.mocked(p.isCancel);
const mockLogger = vi.mocked(logger);

describe("addChannelCommand", () => {
  beforeEach(() => {
    mockSelect.mockResolvedValue("discord");
    mockIsCancel.mockReturnValue(false);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("shows intro", async () => {
    await addChannelCommand("discord");

    expect(p.intro).toHaveBeenCalledWith(expect.stringContaining("add"));
  });

  it("prompts for channel when not provided", async () => {
    mockSelect.mockResolvedValueOnce("discord");

    await addChannelCommand();

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Which channel"),
      }),
    );
  });

  it("handles cancel during selection", async () => {
    mockIsCancel.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce(Symbol("cancel") as any);

    await addChannelCommand();

    expect(p.cancel).toHaveBeenCalledWith("Cancelled.");
    expect(p.outro).not.toHaveBeenCalled();
  });

  it("shows discord info", async () => {
    await addChannelCommand("discord");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Discord"));
    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Coming in v2"));
  });

  it("shows imessage info", async () => {
    await addChannelCommand("imessage");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("iMessage (BlueBubbles)"));
    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Coming in v2"));
  });

  it("shows whatsapp info", async () => {
    await addChannelCommand("whatsapp");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("WhatsApp Business"));
    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Coming in v2"));
  });

  it("handles unknown channel", async () => {
    await addChannelCommand("slack");

    expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining("Unknown channel"));
    expect(p.outro).not.toHaveBeenCalled();
  });

  it("shows error message with supported list for unknown channel", async () => {
    await addChannelCommand("teams");

    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("discord, imessage, whatsapp"),
    );
  });

  it("normalizes channel to lowercase", async () => {
    await addChannelCommand("Discord");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Discord"));
    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("not available yet"));
  });

  it("channel passed directly skips prompt", async () => {
    await addChannelCommand("whatsapp");

    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("shows 'Coming in v2' status", async () => {
    await addChannelCommand("discord");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("Coming in v2"));
  });

  it("shows contact info", async () => {
    await addChannelCommand("discord");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("https://openclaw.ai"));
  });

  it("logs channel request", async () => {
    await addChannelCommand("discord");

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Add channel requested: discord"),
    );
  });

  it("shows outro", async () => {
    await addChannelCommand("discord");

    expect(p.outro).toHaveBeenCalledWith("Stay tuned!");
  });

  it("select options include all supported channels", async () => {
    mockSelect.mockResolvedValueOnce("discord");

    await addChannelCommand();

    const selectCall = mockSelect.mock.calls[0]![0] as { options: Array<{ value: string }> };
    const values = selectCall.options.map((o) => o.value);
    expect(values).toEqual(["discord", "imessage", "whatsapp"]);
  });

  it("CHANNEL_INFO has correct labels in select options", async () => {
    mockSelect.mockResolvedValueOnce("discord");

    await addChannelCommand();

    const selectCall = mockSelect.mock.calls[0]![0] as { options: Array<{ label: string }> };
    const labels = selectCall.options.map((o) => o.label);
    expect(labels).toContain("Discord");
    expect(labels).toContain("iMessage (BlueBubbles)");
    expect(labels).toContain("WhatsApp Business");
  });

  it("select options include status hints", async () => {
    mockSelect.mockResolvedValueOnce("discord");

    await addChannelCommand();

    const selectCall = mockSelect.mock.calls[0]![0] as { options: Array<{ hint: string }> };
    const hints = selectCall.options.map((o) => o.hint);
    expect(hints).toEqual(["Coming in v2", "Coming in v2", "Coming in v2"]);
  });

  it("logs with not yet available", async () => {
    await addChannelCommand("imessage");

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("not yet available"),
    );
  });

  it("does not show outro for unknown channel", async () => {
    await addChannelCommand("foobar");

    expect(p.outro).not.toHaveBeenCalled();
  });

  it("does not log for unknown channel", async () => {
    await addChannelCommand("nonexistent");

    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it("shows not available message for valid channel", async () => {
    await addChannelCommand("whatsapp");

    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("not available yet"),
    );
  });

  it("handles UPPERCASE channel", async () => {
    await addChannelCommand("IMESSAGE");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("iMessage (BlueBubbles)"));
    expect(p.outro).toHaveBeenCalledWith("Stay tuned!");
  });

  it("handles mixed case channel", async () => {
    await addChannelCommand("WhatsApp");

    expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining("WhatsApp Business"));
    expect(p.outro).toHaveBeenCalledWith("Stay tuned!");
  });

  it("shows custom setup prompt", async () => {
    await addChannelCommand("discord");

    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("custom setup"),
    );
  });
});
