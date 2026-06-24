import { NextRequest, NextResponse } from "next/server";
import { getCorsAllowedOrigins } from "@/lib/config/deployment-env";
import { checkSameOriginRequest } from "@/lib/middleware/same-origin-csrf";
import {
  AUTH_RESEND_RATE_LIMIT_MAX,
  AUTH_RESEND_RATE_LIMIT_WINDOW,
  AUTH_RESEND_RATELIMIT_PREFIX,
  AUTH_VERIFY_RATE_LIMIT_MAX,
  AUTH_VERIFY_RATE_LIMIT_WINDOW,
  AUTH_VERIFY_RATELIMIT_PREFIX,
} from "@/lib/constants/auth-rate-limit";
import {
  enforceUpstashRateLimit,
} from "@/lib/middleware/upstash-rate-limit";
import {
  guardAuthenticatedPage,
  isAuthRequiredOrdersApi,
  isAuthRequiredPage,
  isAuthRequiredUsersApi,
  requireAdminApi,
  requireAuthenticatedApi,
} from "@/lib/middleware/auth-protected-routes";
import {
  getOrCreateRequestId,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-id";
import { buildContentSecurityPolicyHeader } from "@/lib/security/content-security-policy";

function continueWithPageSecurity(request: NextRequest): NextResponse {
  const requestId = getOrCreateRequestId(request.headers);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicyHeader()
  );
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/** Rate limit for auth endpoints (login/register) by IP */
async function checkAuthRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return enforceUpstashRateLimit(
    request,
    {
      prefix: "ratelimit:auth",
      limit: 10,
      window: "60 s",
      detail: "Too many login/register attempts. Try again later.",
    },
    true
  );
}

async function checkAuthVerifyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return enforceUpstashRateLimit(
    request,
    {
      prefix: AUTH_VERIFY_RATELIMIT_PREFIX,
      limit: AUTH_VERIFY_RATE_LIMIT_MAX,
      window: AUTH_VERIFY_RATE_LIMIT_WINDOW,
      detail: "Too many verification attempts. Try again later.",
    },
    true
  );
}

async function checkAuthResendRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return enforceUpstashRateLimit(
    request,
    {
      prefix: AUTH_RESEND_RATELIMIT_PREFIX,
      limit: AUTH_RESEND_RATE_LIMIT_MAX,
      window: AUTH_RESEND_RATE_LIMIT_WINDOW,
      detail: "Too many verification resend requests. Try again later.",
    },
    true
  );
}

async function checkAdminUploadRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return enforceUpstashRateLimit(
    request,
    {
      prefix: "ratelimit:admin-upload",
      limit: 20,
      window: "10 m",
      detail: "Too many upload attempts. Try again later.",
    },
    true
  );
}

async function checkCheckoutRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return enforceUpstashRateLimit(
    request,
    {
      prefix: "ratelimit:checkout",
      limit: 10,
      window: "60 s",
      detail: "Too many checkout attempts. Try again later.",
    },
    true
  );
}

/** CORS: exact allowlist from env/app URL. For /api/* add CORS headers and handle preflight. */
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigins = getCorsAllowedOrigins();
  const allowedOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  return headers;
}

function applyCorsHeaders(
  response: NextResponse,
  corsHeaders: Record<string, string>
): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAuthRequiredPage(pathname)) {
    const redirect = await guardAuthenticatedPage(request);
    if (redirect) {
      return redirect;
    }
    return continueWithPageSecurity(request);
  }

  if (pathname.startsWith("/api/")) {
    const requestId = getOrCreateRequestId(request.headers);
    const sanitizedHeaders = new Headers(request.headers);
    sanitizedHeaders.delete("x-auth-user-id");
    sanitizedHeaders.delete("x-auth-roles");
    sanitizedHeaders.set(REQUEST_ID_HEADER, requestId);
    const corsHeaders = getCorsHeaders(request);
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    const sameOriginResponse = checkSameOriginRequest(request);
    if (sameOriginResponse) {
      return applyCorsHeaders(sameOriginResponse, corsHeaders);
    }
    let forwardedHeaders = sanitizedHeaders;

    if (pathname.startsWith("/api/v1/supersudo/")) {
      const authResult = await requireAdminApi(request);
      if (authResult.response) {
        return applyCorsHeaders(authResult.response, corsHeaders);
      }
      const nextHeaders = new Headers(sanitizedHeaders);
      if (authResult.userId) {
        nextHeaders.set("x-auth-user-id", authResult.userId);
      }
      forwardedHeaders = nextHeaders;
      if (pathname.includes("/upload-") && request.method === "POST") {
        const uploadRateLimitResponse = await checkAdminUploadRateLimit(request);
        if (uploadRateLimitResponse) {
          return applyCorsHeaders(uploadRateLimitResponse, corsHeaders);
        }
      }
    } else if (isAuthRequiredUsersApi(pathname) || isAuthRequiredOrdersApi(pathname)) {
      const authResult = await requireAuthenticatedApi(request);
      if (authResult.response) {
        return applyCorsHeaders(authResult.response, corsHeaders);
      }
    } else if (
      (pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/register") &&
      request.method === "POST"
    ) {
      const rateLimitResponse = await checkAuthRateLimit(request);
      if (rateLimitResponse) {
        return applyCorsHeaders(rateLimitResponse, corsHeaders);
      }
    } else if (pathname === "/api/v1/auth/verify" && request.method === "POST") {
      const rateLimitResponse = await checkAuthVerifyRateLimit(request);
      if (rateLimitResponse) {
        return applyCorsHeaders(rateLimitResponse, corsHeaders);
      }
    } else if (
      pathname === "/api/v1/auth/resend-verification" &&
      request.method === "POST"
    ) {
      const rateLimitResponse = await checkAuthResendRateLimit(request);
      if (rateLimitResponse) {
        return applyCorsHeaders(rateLimitResponse, corsHeaders);
      }
    } else if (pathname === "/api/v1/orders/checkout" && request.method === "POST") {
      const checkoutRateLimitResponse = await checkCheckoutRateLimit(request);
      if (checkoutRateLimitResponse) {
        return applyCorsHeaders(checkoutRateLimitResponse, corsHeaders);
      }
    }
    const response = NextResponse.next({
      request: {
        headers: forwardedHeaders,
      },
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    applyCorsHeaders(response, corsHeaders);
    return response;
  }

  return continueWithPageSecurity(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
