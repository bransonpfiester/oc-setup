import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createEmptyContext } from "../helpers/mock-factories.js";
import { mockProcessExit } from "../helpers/test-utils.js";

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

vi.mock("../../src/lib/models.js", () => ({
  MODEL_PROVIDERS: [
    { provider: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-4-5-20250514", hint: "" },
    { provider: "openai", label: "OpenAI", defaultModel: "gpt-4o", hint: "" },
    { provider: "openrouter", label: "OpenRouter", defaultModel: "anthropic/claude-sonnet-4-5-20250514", hint: "" },
  ],
  validateApiKey: vi.fn(),
}));

vi.mock("../../src/lib/config.js", () => ({
  writeConfig: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), redact: vi.fn((s: string) => s) },
}));

import * as p from "@clack/prompts";
import { validateApiKey } from "../../src/lib/models.js";
import { logger } from "../../src/utils/logger.js";
import { setupModel } from "../../src/steps/setup-model.js";

const mockSelect = vi.mocked(p.select);
const mockText = vi.mocked(p.text);
const mockIsCancel = vi.mocked(p.isCancel);
const mockValidateApiKey = vi.mocked(validateApiKey);
const mockLogger = vi.mocked(logger);

describe("setupModel – provider-specific flows", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockIsCancel.mockReturnValue(false);
  });

  it("anthropic cancel during auth choice exits", async () => {
    mockProcessExit();
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(false).mockReturnValueOnce(true);

    await expect(setupModel(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalledWith("Setup cancelled.");
  });

  it("openai cancel during auth choice exits", async () => {
    mockProcessExit();
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(false).mockReturnValueOnce(true);

    await expect(setupModel(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalledWith("Setup cancelled.");
  });

  it("setup token note shows instructions", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("setup-token");
    mockText.mockResolvedValueOnce("clst_my_token");

    await setupModel(ctx);

    expect(p.note).toHaveBeenCalledWith(
      expect.stringContaining("setup-token"),
      "Anthropic Setup Token",
    );
  });

  it("setup token stores token with setup-token auth method", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("setup-token");
    mockText.mockResolvedValueOnce("clst_abc123");

    await setupModel(ctx);

    expect(ctx.model!.apiKey).toBe("clst_abc123");
    expect(ctx.model!.authMethod).toBe("setup-token");
    expect(ctx.model!.provider).toBe("anthropic");
  });

  it("oauth stores empty apiKey with oauth auth method", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("oauth");

    await setupModel(ctx);

    expect(ctx.model!.apiKey).toBe("");
    expect(ctx.model!.authMethod).toBe("oauth");
  });

  it("codex-oauth stores empty apiKey", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("codex-oauth");

    await setupModel(ctx);

    expect(ctx.model!.apiKey).toBe("");
    expect(ctx.model!.authMethod).toBe("codex-oauth");
    expect(ctx.model!.modelId).toBe("gpt-5.3-codex");
  });

  it("codex-reuse stores empty apiKey", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("codex-reuse");

    await setupModel(ctx);

    expect(ctx.model!.apiKey).toBe("");
    expect(ctx.model!.authMethod).toBe("codex-reuse");
    expect(ctx.model!.modelId).toBe("gpt-5.3-codex");
  });

  it("provider options include all expected providers", async () => {
    mockSelect.mockResolvedValueOnce("skip");

    await setupModel(ctx);

    const callArgs = mockSelect.mock.calls[0]![0] as { options: Array<{ value: string }> };
    const values = callArgs.options.map((o) => o.value);

    expect(values).toContain("anthropic");
    expect(values).toContain("openai");
    expect(values).toContain("google");
    expect(values).toContain("xai");
    expect(values).toContain("deepseek");
    expect(values).toContain("mistral");
    expect(values).toContain("perplexity");
    expect(values).toContain("moonshot");
    expect(values).toContain("groq");
    expect(values).toContain("openrouter");
    expect(values).toContain("skip");
  });

  it("google provider uses collectApiKey", async () => {
    mockSelect.mockResolvedValueOnce("google");
    mockText.mockResolvedValueOnce("google-key-123");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model!.provider).toBe("google");
    expect(ctx.model!.authMethod).toBe("api-key");
  });

  it("xAI provider uses collectApiKey", async () => {
    mockSelect.mockResolvedValueOnce("xai");
    mockText.mockResolvedValueOnce("xai-key-123");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model!.provider).toBe("xai");
    expect(ctx.model!.authMethod).toBe("api-key");
  });

  it("deepseek provider uses collectApiKey", async () => {
    mockSelect.mockResolvedValueOnce("deepseek");
    mockText.mockResolvedValueOnce("ds-key-123");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model!.provider).toBe("deepseek");
  });

  it("mistral provider uses collectApiKey", async () => {
    mockSelect.mockResolvedValueOnce("mistral");
    mockText.mockResolvedValueOnce("mistral-key-123");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model!.provider).toBe("mistral");
  });

  it("groq provider uses collectApiKey", async () => {
    mockSelect.mockResolvedValueOnce("groq");
    mockText.mockResolvedValueOnce("gsk_test");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model!.provider).toBe("groq");
  });

  it("API key placeholder differs by provider (non-anthropic shows sk-...)", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("api-key");
    mockText.mockResolvedValueOnce("sk-test");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: "sk-...",
      }),
    );
  });

  it("logger called for each auth method – oauth", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("oauth");

    await setupModel(ctx);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("oauth"),
    );
  });

  it("logger called for each auth method – codex-oauth", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("codex-oauth");

    await setupModel(ctx);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("codex-oauth"),
    );
  });

  it("pre-configured setup-token method skips validation", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "clst_preconfigured",
      modelId: "claude-sonnet-4-6",
      authMethod: "setup-token",
    };

    await setupModel(ctx);

    expect(mockValidateApiKey).not.toHaveBeenCalled();
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
