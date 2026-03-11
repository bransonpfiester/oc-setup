import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { configParse, parseBody } from "@/lib/validation";
import { success, badRequest, internal } from "@/lib/api-helpers";

type FormatParser = (raw: string) => unknown;

const FORMAT_PARSERS: Record<string, FormatParser> = {
  json: (raw) => JSON.parse(raw),
  // yaml, toml, and env parsers can be added here as the project grows
};

/**
 * @description Parse a raw configuration string into a structured config object.
 * @param request - The incoming Next.js request with raw config content and target format
 * @returns ConfigParseResult with parsed config, parse warnings, and original format
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseBody(configParse, body);

    const parser = FORMAT_PARSERS[data.format];
    if (!parser) {
      return badRequest(
        `Format "${data.format}" is not yet supported. Currently supported: ${Object.keys(FORMAT_PARSERS).join(", ")}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = parser(data.raw);
    } catch {
      return badRequest(`Failed to parse content as ${data.format}`);
    }

    const config = parsed as Record<string, unknown>;
    const parseWarnings: string[] = [];

    if (!config.version) {
      parseWarnings.push("No version field found; defaulting to 2.0.2");
      config.version = "2.0.2";
    }

    if (!config.gateway) {
      parseWarnings.push(
        "No gateway configuration found; defaults will apply",
      );
    }

    return success({ config, parseWarnings, originalFormat: data.format });
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", { issues: err.issues });
    }
    return internal();
  }
}
