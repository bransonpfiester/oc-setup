import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { success, badRequest, internal } from "@/lib/api-helpers";
import { MODEL_REGISTRY } from "@/lib/stores/models";

/**
 * @description List all available models, optionally filtered by provider ID.
 *   Returns the full model catalog when no filter is applied.
 * @param req - The incoming request with an optional `provider` query parameter
 * @returns Array of model objects matching the filter
 */
export async function GET(req: NextRequest) {
  try {
    const providerFilter = req.nextUrl.searchParams.get("provider");

    let models = [...MODEL_REGISTRY];
    if (providerFilter) {
      models = models.filter((m) => m.providerId === providerFilter);
    }

    return success(models);
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
