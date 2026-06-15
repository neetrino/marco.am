import { NextRequest, NextResponse } from "next/server";
import { getCorsAllowedOrigins } from "@/lib/config/deployment-env";

const CSRF_EXEMPT_PATHS = new Set(["/api/v1/payments/webhook"]);

function isUnsafeMethod(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function isCsrfExemptPath(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.has(pathname);
}

function hasBearerAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return Boolean(authHeader?.startsWith("Bearer ") && authHeader.length > 7);
}

function parseOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveRequestOrigin(request: NextRequest): string | null {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return parseOrigin(originHeader);
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    return parseOrigin(refererHeader);
  }

  return null;
}

function isSameDocumentOrigin(request: NextRequest, origin: string): boolean {
  return origin === request.nextUrl.origin;
}

function isAllowedOrigin(request: NextRequest, origin: string): boolean {
  if (isSameDocumentOrigin(request, origin)) {
    return true;
  }
  return getCorsAllowedOrigins().includes(origin);
}

function crossOriginForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Cross-origin state-changing requests are not allowed",
    },
    { status: 403 },
  );
}

/**
 * Blocks cross-site POST/PUT/PATCH/DELETE unless Origin/Referer matches the app allowlist.
 * Bearer-authenticated and webhook routes are exempt (no cookie CSRF surface).
 */
export function checkSameOriginRequest(request: NextRequest): NextResponse | null {
  if (!isUnsafeMethod(request.method)) {
    return null;
  }

  if (isCsrfExemptPath(request.nextUrl.pathname)) {
    return null;
  }

  if (hasBearerAuthorization(request)) {
    return null;
  }

  const requestOrigin = resolveRequestOrigin(request);
  if (!requestOrigin) {
    return crossOriginForbiddenResponse();
  }

  if (isAllowedOrigin(request, requestOrigin)) {
    return null;
  }

  return crossOriginForbiddenResponse();
}
