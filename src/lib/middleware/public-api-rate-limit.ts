import { NextRequest, NextResponse } from "next/server";
import {
  PUBLIC_API_RATE_LIMIT_MAX,
  PUBLIC_API_RATE_LIMIT_WINDOW,
  PUBLIC_API_RATELIMIT_PREFIX,
} from "@/lib/constants/public-api-rate-limit";
import { enforceUpstashRateLimit } from "@/lib/middleware/upstash-rate-limit";
import { logger } from "@/lib/utils/logger";

const PUBLIC_API_PREFIX = "/api/v1/";
const CRON_API_PREFIX = "/api/v1/cron/";
const SUPER_SUDO_API_PREFIX = "/api/v1/supersudo/";

/**
 * True for GET `/api/v1/*` that should use the general public limiter
 * (not cron, not admin supersudo, not non-GET).
 */
export function shouldEnforcePublicApiGetRateLimit(
  pathname: string,
  method: string
): boolean {
  if (method !== "GET") {
    return false;
  }
  if (!pathname.startsWith(PUBLIC_API_PREFIX)) {
    return false;
  }
  if (pathname.startsWith(CRON_API_PREFIX)) {
    return false;
  }
  if (pathname.startsWith(SUPER_SUDO_API_PREFIX)) {
    return false;
  }
  return true;
}

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Per-IP rate limit for public API GET traffic.
 * Fail-open: missing Upstash env or limiter errors allow the request through.
 * (`enforceUpstashRateLimit` alone does not fail open — it memory-falls back or
 * returns 503 when `requireInProduction` is true.)
 */
export async function checkPublicApiGetRateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  if (!shouldEnforcePublicApiGetRateLimit(pathname, request.method)) {
    return null;
  }

  if (!isUpstashConfigured()) {
    return null;
  }

  try {
    return await enforceUpstashRateLimit(
      request,
      {
        prefix: PUBLIC_API_RATELIMIT_PREFIX,
        limit: PUBLIC_API_RATE_LIMIT_MAX,
        window: PUBLIC_API_RATE_LIMIT_WINDOW,
        detail: "Too many API requests. Try again later.",
      },
      false
    );
  } catch (error) {
    logger.warn("Public API rate limit check failed — allowing request", {
      error,
      pathname,
    });
    return null;
  }
}
