import { NextResponse } from "next/server";
import { toApiError } from "@/lib/types/errors";

/**
 * JSON error body for App Router API routes (RFC 7807-style fields).
 */
export function toApiErrorResponse(error: unknown, instanceUrl: string): NextResponse {
  const api = toApiError(error, instanceUrl);
  return NextResponse.json(
    {
      type: api.type ?? "https://api.shop.am/problems/internal-error",
      title: api.title ?? "Internal Server Error",
      status: api.status ?? 500,
      detail: api.detail ?? "An error occurred",
      instance: instanceUrl,
    },
    { status: api.status ?? 500 }
  );
}
