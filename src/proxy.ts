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
import { getAuthContext } from "@/lib/middleware/auth-edge";

async function requireAdminAuth(request: NextRequest): Promise<{
  response: NextResponse | null;
  userId: string | null;
}> {
  const { token, decoded } = await getAuthContext(request);

  if (!token) {
    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Missing or invalid Authorization header",
        },
        { status: 401 }
      ),
      userId: null,
    };
  }

  if (!decoded) {
    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid or expired token",
        },
        { status: 401 }
      ),
      userId: null,
    };
  }

  return {
    response: null,
    userId: decoded.userId,
  };
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

/**
 * Edge guard for the admin UI pages: redirect unauthenticated visitors to /login
 * before any admin HTML is served (the per-route admin role check still runs in
 * each API handler and in the client AdminAccessGate).
 */
async function guardSupersudoPage(request: NextRequest): Promise<NextResponse | null> {
  const { token, decoded } = await getAuthContext(request);
  if (token && decoded) {
    return null;
  }
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/supersudo" || pathname.startsWith("/supersudo/")) {
    const redirect = await guardSupersudoPage(request);
    if (redirect) {
      return redirect;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const sanitizedHeaders = new Headers(request.headers);
    sanitizedHeaders.delete("x-auth-user-id");
    sanitizedHeaders.delete("x-auth-roles");
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
      const authResult = await requireAdminAuth(request);
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
    applyCorsHeaders(response, corsHeaders);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/supersudo",
    "/supersudo/:path*",
    "/api/v1/supersudo/:path*",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/verify",
    "/api/v1/auth/resend-verification",
    "/api/v1/:path*",
    "/api/health",
  ],
};
