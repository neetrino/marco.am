import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate limiting / Turnstile `remoteip` (behind proxies).
 */
export function getRequestClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
