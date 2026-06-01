import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getDeploymentTier } from "@/lib/config/deployment-env";

type RateLimitWindow = `${number} s` | `${number} m` | `${number} h`;

export type UpstashRateLimitSpec = {
  prefix: string;
  limit: number;
  window: RateLimitWindow;
  detail: string;
};

const limiterCache = new Map<string, Ratelimit>();

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

export function rateLimitConfigError(detail: string): NextResponse {
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

export function tooManyRequestsError(detail: string): NextResponse {
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

/**
 * Enforces Upstash sliding-window rate limit by client IP.
 * Returns 503 in production when Redis is not configured and `requireInProduction` is true.
 */
export async function enforceUpstashRateLimit(
  request: NextRequest,
  spec: UpstashRateLimitSpec,
  requireInProduction: boolean
): Promise<NextResponse | null> {
  const limiter = getLimiter(spec);
  if (!limiter) {
    if (requireInProduction && getDeploymentTier() === "production") {
      return rateLimitConfigError(`${spec.detail} (rate limiting is not configured)`);
    }
    return null;
  }

  const { success } = await limiter.limit(getClientIp(request));
  if (success) {
    return null;
  }

  return tooManyRequestsError(spec.detail);
}
