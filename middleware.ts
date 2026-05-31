import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as jose from "jose";
import { readAuthSessionToken } from "@/lib/auth/auth-session-cookie";
import { getCorsAllowedOrigins, getDeploymentTier } from "@/lib/config/deployment-env";

let authRatelimit: Ratelimit | undefined;
let adminUploadRatelimit: Ratelimit | undefined;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitConfigError(detail: string): NextResponse {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      status: 503,
      detail,
    },
    { status: 503 }
  );
}

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
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (getDeploymentTier() === "production") {
      return rateLimitConfigError("Authentication rate limiting is not configured");
    }
    return null;
  }

  if (authRatelimit === undefined) {
    const redis = new Redis({ url, token });
    authRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "ratelimit:auth",
    });
  }

  const { success } = await authRatelimit.limit(getClientIp(request));
  if (!success) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/too-many-requests",
        title: "Too Many Requests",
        status: 429,
        detail: "Too many login/register attempts. Try again later.",
      },
      { status: 429 }
    );
  }
  return null;
}

async function checkAdminUploadRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (getDeploymentTier() === "production") {
      return rateLimitConfigError("Admin upload rate limiting is not configured");
    }
    return null;
  }

  if (adminUploadRatelimit === undefined) {
    const redis = new Redis({ url, token });
    adminUploadRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      prefix: "ratelimit:admin-upload",
    });
  }

  const { success } = await adminUploadRatelimit.limit(getClientIp(request));
  if (success) {
    return null;
  }

  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/too-many-requests",
      title: "Too Many Requests",
      status: 429,
      detail: "Too many upload attempts. Try again later.",
    },
    { status: 429 }
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    const sameOriginResponse = checkSameOriginRequest(request);
    if (sameOriginResponse) {
      Object.entries(corsHeaders).forEach(([k, v]) => sameOriginResponse.headers.set(k, v));
      return sameOriginResponse;
    }
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    // Run auth/rate-limit for protected paths, then return response with CORS
    if (pathname.startsWith("/api/v1/supersudo/")) {
      const authRes = await requireAdminAuth(request);
      if (authRes) {
        Object.entries(corsHeaders).forEach(([k, v]) => authRes.headers.set(k, v));
        return authRes;
      }
      if (pathname.includes("/upload-") && request.method === "POST") {
        const uploadRateLimitResponse = await checkAdminUploadRateLimit(request);
        if (uploadRateLimitResponse) {
          Object.entries(corsHeaders).forEach(([k, v]) => uploadRateLimitResponse.headers.set(k, v));
          return uploadRateLimitResponse;
        }
      }
    } else if (
      (pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/register") &&
      request.method === "POST"
    ) {
      const rateLimitResponse = await checkAuthRateLimit(request);
      if (rateLimitResponse) {
        Object.entries(corsHeaders).forEach(([k, v]) => rateLimitResponse.headers.set(k, v));
        return rateLimitResponse;
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
    "/api/v1/:path*",
    "/api/health",
  ],
};
