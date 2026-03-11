import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SetupContext } from "../../src/steps/context.js";
import { createMockContext, createEmptyContext } from "../helpers/mock-factories.js";
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
import { setupModel } from "../../src/steps/setup-model.js";

const mockSelect = vi.mocked(p.select);
const mockText = vi.mocked(p.text);
const mockIsCancel = vi.mocked(p.isCancel);
const mockValidateApiKey = vi.mocked(validateApiKey);

describe("setupModel", () => {
  let ctx: SetupContext;

  beforeEach(() => {
    ctx = createEmptyContext();
    mockIsCancel.mockReturnValue(false);
  });

  it("pre-configured model with oauth skips validation", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "",
      modelId: "claude-sonnet-4-6",
      authMethod: "oauth",
    };

    await setupModel(ctx);

    expect(mockValidateApiKey).not.toHaveBeenCalled();
    expect(p.log.success).toHaveBeenCalledWith(
      expect.stringContaining("oauth"),
    );
  });

  it("pre-configured model with valid API key passes", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-valid-key",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(mockValidateApiKey).toHaveBeenCalledWith("anthropic", "sk-ant-valid-key");
    expect(ctx.model).not.toBeNull();
  });

  it("pre-configured model with invalid API key prompts for new one", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "sk-ant-invalid",
      modelId: "claude-sonnet-4-6",
      authMethod: "api-key",
    };
    mockValidateApiKey.mockResolvedValueOnce(false);
    mockSelect.mockResolvedValueOnce("skip");

    await setupModel(ctx);

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("didn't validate"),
    );
    expect(ctx.model).toBeNull();
  });

  it("skip provider sets model to null", async () => {
    mockSelect.mockResolvedValueOnce("skip");

    await setupModel(ctx);

    expect(ctx.model).toBeNull();
    expect(p.log.info).toHaveBeenCalledWith(
      expect.stringContaining("later"),
    );
  });

  it("anthropic with api-key flow", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("api-key");
    mockText.mockResolvedValueOnce("sk-ant-test-123");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "anthropic",
      apiKey: "sk-ant-test-123",
      authMethod: "api-key",
    }));
  });

  it("anthropic with setup-token flow", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("setup-token");
    mockText.mockResolvedValueOnce("clst_test_token");

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "anthropic",
      apiKey: "clst_test_token",
      authMethod: "setup-token",
    }));
    expect(p.note).toHaveBeenCalled();
  });

  it("anthropic with oauth flow", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("oauth");

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "anthropic",
      apiKey: "",
      authMethod: "oauth",
    }));
  });

  it("openai with api-key flow", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("api-key");
    mockText.mockResolvedValueOnce("sk-openai-test");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "openai",
      apiKey: "sk-openai-test",
      authMethod: "api-key",
    }));
  });

  it("openai with codex-oauth flow", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("codex-oauth");

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "openai",
      apiKey: "",
      authMethod: "codex-oauth",
    }));
  });

  it("openai with codex-reuse flow", async () => {
    mockSelect.mockResolvedValueOnce("openai");
    mockSelect.mockResolvedValueOnce("codex-reuse");

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "openai",
      apiKey: "",
      authMethod: "codex-reuse",
    }));
  });

  it("other provider (google) with api-key", async () => {
    mockSelect.mockResolvedValueOnce("google");
    mockText.mockResolvedValueOnce("google-api-key-123");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      provider: "google",
      apiKey: "google-api-key-123",
      authMethod: "api-key",
    }));
  });

  it("cancel during provider selection exits", async () => {
    mockProcessExit();
    mockSelect.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(true);

    await expect(setupModel(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalled();
  });

  it("cancel during API key entry exits", async () => {
    mockProcessExit();
    mockSelect.mockResolvedValueOnce("google");
    mockText.mockResolvedValueOnce(Symbol("cancel") as unknown as string);
    mockIsCancel.mockReturnValueOnce(false).mockReturnValueOnce(true);

    await expect(setupModel(ctx)).rejects.toThrow("process.exit");
    expect(p.cancel).toHaveBeenCalled();
  });

  it("API key validation retry (attempt 2 succeeds)", async () => {
    mockSelect.mockResolvedValueOnce("google");
    mockText.mockResolvedValueOnce("bad-key");
    mockValidateApiKey.mockResolvedValueOnce(false);
    mockText.mockResolvedValueOnce("good-key");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(ctx.model).toEqual(expect.objectContaining({
      apiKey: "good-key",
      authMethod: "api-key",
    }));
    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("invalid"),
    );
  });

  it("API key validation fails after 3 attempts", async () => {
    mockProcessExit();
    mockSelect.mockResolvedValueOnce("google");
    mockText.mockResolvedValueOnce("bad1");
    mockValidateApiKey.mockResolvedValueOnce(false);
    mockText.mockResolvedValueOnce("bad2");
    mockValidateApiKey.mockResolvedValueOnce(false);
    mockText.mockResolvedValueOnce("bad3");
    mockValidateApiKey.mockResolvedValueOnce(false);

    await expect(setupModel(ctx)).rejects.toThrow("process.exit");
    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("3 attempts"),
    );
  });

  it("collectApiKey shows correct placeholder for anthropic", async () => {
    mockSelect.mockResolvedValueOnce("anthropic");
    mockSelect.mockResolvedValueOnce("api-key");
    mockText.mockResolvedValueOnce("sk-ant-test");
    mockValidateApiKey.mockResolvedValueOnce(true);

    await setupModel(ctx);

    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: "sk-ant-...",
      }),
    );
  });

  it("pre-configured model with setup-token skips validation", async () => {
    ctx.model = {
      provider: "anthropic",
      apiKey: "clst_something",
      modelId: "claude-sonnet-4-6",
      authMethod: "setup-token",
    };

    await setupModel(ctx);

    expect(mockValidateApiKey).not.toHaveBeenCalled();
    expect(p.log.success).toHaveBeenCalledWith(
      expect.stringContaining("setup-token"),
    );
  });
});
