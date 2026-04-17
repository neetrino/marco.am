import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  CONTACT_FORM_RATE_LIMIT_MAX,
  CONTACT_FORM_RATE_LIMIT_WINDOW_MS,
  CONTACT_FORM_RATELIMIT_PREFIX,
} from "@/lib/constants/contact-form";
import { logger } from "@/lib/utils/logger";

let ratelimitInstance: Ratelimit | null = null;
let ratelimitInitDone = false;

/** In-memory sliding window per process when Upstash is not configured. */
const memoryBuckets = new Map<string, number[]>();

function getRatelimit(): Ratelimit | null {
  if (ratelimitInitDone) {
    return ratelimitInstance;
  }
  ratelimitInitDone = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  try {
    const redis = new Redis({ url, token });
    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(CONTACT_FORM_RATE_LIMIT_MAX, "1 h"),
      prefix: CONTACT_FORM_RATELIMIT_PREFIX,
    });
    return ratelimitInstance;
  } catch (error: unknown) {
    logger.error("Contact rate limit: failed to init Upstash Ratelimit", {
      error,
    });
    return null;
  }
}

function checkMemoryLimit(clientKey: string): boolean {
  const now = Date.now();
  const windowStart = now - CONTACT_FORM_RATE_LIMIT_WINDOW_MS;
  const timestamps = memoryBuckets.get(clientKey) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);
  if (recent.length >= CONTACT_FORM_RATE_LIMIT_MAX) {
    memoryBuckets.set(clientKey, recent);
    return false;
  }
  recent.push(now);
  memoryBuckets.set(clientKey, recent);
  return true;
}

export type ContactRateLimitResult = {
  allowed: boolean;
  resetMs?: number;
};

/**
 * Enforces per-IP contact submission cap (Upstash sliding window, or in-memory fallback).
 */
export async function consumeContactSubmissionSlot(
  clientIp: string
): Promise<ContactRateLimitResult> {
  const rl = getRatelimit();
  if (rl) {
    const result = await rl.limit(clientIp);
    return {
      allowed: result.success,
      resetMs: result.reset,
    };
  }
  return {
    allowed: checkMemoryLimit(clientIp),
  };
}
