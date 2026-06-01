import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { readAuthSessionToken } from "@/lib/auth/auth-session-cookie";
import { getCorsAllowedOrigins } from "@/lib/config/deployment-env";
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

function isUnsafeMethod(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function checkSameOriginRequest(request: NextRequest): NextResponse | null {
  if (!isUnsafeMethod(request.method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const allowedOrigins = getCorsAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return null;
  }

  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Cross-origin state-changing requests are not allowed",
    },
    { status: 403 }
  );
}

/** Protect /api/v1/supersudo/* — require valid JWT (signature + expiry). DB check (blocked/deleted) remains in route. */
async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearerToken ?? readAuthSessionToken(request);

  if (!token) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Missing or invalid Authorization header",
      },
      { status: 401 }
    );
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Server configuration error",
      },
      { status: 500 }
    );
  }

  try {
    const key = new TextEncoder().encode(secret);
    await jose.jwtVerify(token, key);
    return null;
  } catch {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or expired token",
      },
      { status: 401 }
    );
  }
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    const sameOriginResponse = checkSameOriginRequest(request);
    if (sameOriginResponse) {
      return applyCorsHeaders(sameOriginResponse, corsHeaders);
    }
    const response = NextResponse.next();
    applyCorsHeaders(response, corsHeaders);

    if (pathname.startsWith("/api/v1/supersudo/")) {
      const authRes = await requireAdminAuth(request);
      if (authRes) {
        return applyCorsHeaders(authRes, corsHeaders);
      }
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
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/supersudo/:path*",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/verify",
    "/api/v1/auth/resend-verification",
    "/api/v1/:path*",
    "/api/health",
  ],
};
