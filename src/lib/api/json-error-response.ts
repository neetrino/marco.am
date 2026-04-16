import { NextResponse } from "next/server";
import { toApiError } from "@/lib/types/errors";

/**
 * RFC 7807-style JSON body from any thrown value (for API route catch blocks).
 */
export function jsonErrorResponse(error: unknown, instance: string): NextResponse {
  const problem = toApiError(error, instance);
  return NextResponse.json(problem, { status: problem.status ?? 500 });
}
