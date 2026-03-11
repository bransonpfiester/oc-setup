import { NextRequest } from "next/server";
import { ZodError } from "zod";
import type { ProviderValidateResponse } from "@/types/api";
import { providerValidate, parseBody } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

async function validateAnthropic(apiKey: string): Promise<ProviderValidateResponse> {
  try {
    const res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [],
      }),
    });

    const valid = res.status !== 401 && res.status !== 403;
    return {
      valid,
      provider: "anthropic",
      permissions: valid ? ["messages:create", "models:list"] : [],
      quotaRemaining: null,
      expiresAt: null,
    };
  } catch {
    return {
      valid: false,
      provider: "anthropic",
      permissions: [],
      quotaRemaining: null,
      expiresAt: null,
    };
  }
}

async function validateOpenAI(apiKey: string): Promise<ProviderValidateResponse> {
  try {
    const res = await fetch(OPENAI_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const valid = res.status === 200;
    return {
      valid,
      provider: "openai",
      permissions: valid
        ? ["models:list", "completions:create", "embeddings:create"]
        : [],
      quotaRemaining: null,
      expiresAt: null,
    };
  } catch {
    return {
      valid: false,
      provider: "openai",
      permissions: [],
      quotaRemaining: null,
      expiresAt: null,
    };
  }
}

async function validateOpenRouter(apiKey: string): Promise<ProviderValidateResponse> {
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const valid = res.status === 200;
    return {
      valid,
      provider: "openrouter",
      permissions: valid
        ? ["models:list", "completions:create", "routing"]
        : [],
      quotaRemaining: null,
      expiresAt: null,
    };
  } catch {
    return {
      valid: false,
      provider: "openrouter",
      permissions: [],
      quotaRemaining: null,
      expiresAt: null,
    };
  }
}

const validators: Record<
  string,
  (apiKey: string) => Promise<ProviderValidateResponse>
> = {
  anthropic: validateAnthropic,
  openai: validateOpenAI,
  openrouter: validateOpenRouter,
};

/**
 * @description Validate a provider API key by making a lightweight probe request
 *   to the provider's API. Returns whether the key is accepted, what permissions
 *   it grants, and quota information when available.
 * @param req - The incoming request containing `provider` and `apiKey` in the body
 * @returns Validation result with validity flag, permissions, and quota data
 */
export async function POST(req: NextRequest) {
  try {
    const body = parseBody(providerValidate, await req.json());

    const validate = validators[body.provider];
    if (!validate) {
      return badRequest(`Unsupported provider: ${body.provider}`);
    }

    const result = await validate(body.apiKey);
    return success(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
