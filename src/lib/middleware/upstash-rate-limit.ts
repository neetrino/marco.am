import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getDeploymentTier } from "@/lib/config/deployment-env";
import { logger } from "@/lib/utils/logger";

type RateLimitWindow = `${number} s` | `${number} m` | `${number} h`;

type UpstashRateLimitSpec = {
  prefix: string;
  limit: number;
  window: RateLimitWindow;
  detail: string;
};

const limiterCache = new Map<string, Ratelimit>();
/** Per-process sliding windows when Upstash is not configured (e.g. missing Vercel env vars). */
const memoryBuckets = new Map<string, number[]>();
let memoryFallbackWarned = false;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getLimiter(spec: UpstashRateLimitSpec): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }

  const cacheKey = `${spec.prefix}:${spec.limit}:${spec.window}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(spec.limit, spec.window),
    prefix: spec.prefix,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

function tooManyRequestsError(detail: string): NextResponse {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/too-many-requests",
      title: "Too Many Requests",
      status: 429,
      detail,
    },
    { status: 429 }
  );
}

function parseRateLimitWindowToMs(window: RateLimitWindow): number {
  const match = window.match(/^(\d+)\s+(s|m|h)$/);
  if (!match) {
    throw new Error(`Invalid rate limit window: ${window}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
  };
  return value * multipliers[unit];
}

function warnMemoryFallbackOnce(): void {
  if (memoryFallbackWarned) {
    return;
  }
  memoryFallbackWarned = true;
  logger.warn(
    "Rate limiting uses in-memory fallback — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed limits",
    { tier: getDeploymentTier() }
  );
}

function checkMemoryLimit(clientKey: string, spec: UpstashRateLimitSpec): boolean {
  const now = Date.now();
  const windowMs = parseRateLimitWindowToMs(spec.window);
  const windowStart = now - windowMs;
  const timestamps = memoryBuckets.get(clientKey) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);
  if (recent.length >= spec.limit) {
    memoryBuckets.set(clientKey, recent);
    return false;
  }
  recent.push(now);
  memoryBuckets.set(clientKey, recent);
  return true;
}

/**
 * Enforces sliding-window rate limit by client IP (Upstash Redis, or in-memory fallback).
 */
export async function enforceUpstashRateLimit(
  request: NextRequest,
  spec: UpstashRateLimitSpec,
  requireInProduction: boolean
): Promise<NextResponse | null> {
  const clientIp = getClientIp(request);
  const limiter = getLimiter(spec);
  if (!limiter) {
    const tier = getDeploymentTier();
    if (requireInProduction && tier === "production") {
      logger.error(
        "Rate limiting unavailable in production — configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
        { tier, prefix: spec.prefix }
      );
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/service-unavailable",
          title: "Service Unavailable",
          status: 503,
          detail: "Rate limiting is temporarily unavailable",
        },
        { status: 503 }
      );
    }

    warnMemoryFallbackOnce();
    const allowed = checkMemoryLimit(`${spec.prefix}:${clientIp}`, spec);
    return allowed ? null : tooManyRequestsError(spec.detail);
  }

  const { success } = await limiter.limit(clientIp);
  if (success) {
    return null;
  }

  return tooManyRequestsError(spec.detail);
}
