import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Success responses
// ---------------------------------------------------------------------------

export function success<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
    { status },
  );
}

export function created<T>(data: T): NextResponse {
  return success(data, 201);
}

export function paginated<T>(data: T): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  });
}

/** Kept for backward-compat — alias of {@link success}. */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return success(data, status);
}

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
    { status },
  );
}

export function badRequest(message: string, details?: Record<string, unknown>): NextResponse {
  return errorResponse("BAD_REQUEST", message, 400, details);
}

export function notFound(message = "Resource not found"): NextResponse {
  return errorResponse("NOT_FOUND", message, 404);
}

export function internal(message = "An unexpected error occurred"): NextResponse {
  return errorResponse("INTERNAL_ERROR", message, 500);
}

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

export function buildPagination(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; pagination: ReturnType<typeof buildPagination> } {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pagination: buildPagination(items.length, page, pageSize),
  };
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

export async function parseBody<T extends ZodSchema>(
  request: NextRequest | unknown,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;

  if (request instanceof NextRequest) {
    try {
      body = await request.json();
    } catch {
      throw errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
    }
  } else {
    body = request;
  }

  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw errorResponse("VALIDATION_ERROR", "Request validation failed", 400, {
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      });
    }
    throw err;
  }
}

export function parseSearchParams<T extends ZodSchema>(
  schemaOrRequest: T | NextRequest,
  schemaOrParams?: T | URLSearchParams,
): z.infer<T> {
  let searchParams: URLSearchParams;
  let schema: T;

  if (schemaOrRequest instanceof NextRequest) {
    searchParams = schemaOrRequest.nextUrl.searchParams;
    schema = schemaOrParams as T;
  } else {
    schema = schemaOrRequest as T;
    searchParams = schemaOrParams as URLSearchParams;
  }

  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}

// ---------------------------------------------------------------------------
// Route param helpers
// ---------------------------------------------------------------------------

export function requireParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (!value || Array.isArray(value)) {
    throw errorResponse("MISSING_PARAMETER", `Missing required parameter: ${key}`, 400);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Error-handling wrapper
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<Record<string, string>> };

export function withErrorHandling(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof NextResponse) return err;
      console.error("Unhandled route error:", err);
      return internal();
    }
  };
}
