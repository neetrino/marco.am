import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const enforceUpstashRateLimitMock = vi.fn();

vi.mock("@/lib/middleware/upstash-rate-limit", () => ({
  enforceUpstashRateLimit: (...args: unknown[]) =>
    enforceUpstashRateLimitMock(...args),
}));

import {
  PUBLIC_API_RATE_LIMIT_MAX,
  PUBLIC_API_RATE_LIMIT_WINDOW,
  PUBLIC_API_RATELIMIT_PREFIX,
} from "@/lib/constants/public-api-rate-limit";
import {
  checkPublicApiGetRateLimit,
  shouldEnforcePublicApiGetRateLimit,
} from "@/lib/middleware/public-api-rate-limit";

function buildRequest(path: string, method = "GET"): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method });
}

describe("shouldEnforcePublicApiGetRateLimit", () => {
  it("covers public GET /api/v1/* paths", () => {
    expect(shouldEnforcePublicApiGetRateLimit("/api/v1/products", "GET")).toBe(
      true
    );
    expect(
      shouldEnforcePublicApiGetRateLimit("/api/v1/categories/root", "GET")
    ).toBe(true);
  });

  it("excludes non-GET, cron, supersudo, and non-v1 paths", () => {
    expect(shouldEnforcePublicApiGetRateLimit("/api/v1/products", "POST")).toBe(
      false
    );
    expect(
      shouldEnforcePublicApiGetRateLimit("/api/v1/cron/reconcile-payments", "GET")
    ).toBe(false);
    expect(
      shouldEnforcePublicApiGetRateLimit("/api/v1/supersudo/products", "GET")
    ).toBe(false);
    expect(shouldEnforcePublicApiGetRateLimit("/api/health", "GET")).toBe(false);
    expect(shouldEnforcePublicApiGetRateLimit("/products", "GET")).toBe(false);
  });
});

describe("public API rate limit constants", () => {
  it("exposes tunable starting limits", () => {
    expect(PUBLIC_API_RATE_LIMIT_MAX).toBe(120);
    expect(PUBLIC_API_RATE_LIMIT_WINDOW).toBe("60 s");
    expect(PUBLIC_API_RATELIMIT_PREFIX).toBe("ratelimit:public-api");
  });
});

describe("checkPublicApiGetRateLimit", () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    enforceUpstashRateLimitMock.mockReset();
    enforceUpstashRateLimitMock.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.UPSTASH_REDIS_REST_URL;
    } else {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    }
    if (originalToken === undefined) {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    } else {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    }
  });

  it("fails open when Upstash env vars are missing", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const response = await checkPublicApiGetRateLimit(
      buildRequest("/api/v1/products")
    );

    expect(response).toBeNull();
    expect(enforceUpstashRateLimitMock).not.toHaveBeenCalled();
  });

  it("fails open when the Upstash helper throws", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    enforceUpstashRateLimitMock.mockRejectedValue(new Error("redis down"));

    const response = await checkPublicApiGetRateLimit(
      buildRequest("/api/v1/products")
    );

    expect(response).toBeNull();
  });

  it("delegates to enforceUpstashRateLimit with public-api constants", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    await checkPublicApiGetRateLimit(buildRequest("/api/v1/products"));

    expect(enforceUpstashRateLimitMock).toHaveBeenCalledWith(
      expect.any(NextRequest),
      {
        prefix: PUBLIC_API_RATELIMIT_PREFIX,
        limit: PUBLIC_API_RATE_LIMIT_MAX,
        window: PUBLIC_API_RATE_LIMIT_WINDOW,
        detail: "Too many API requests. Try again later.",
      },
      false
    );
  });

  it("skips enforce for excluded paths", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    await checkPublicApiGetRateLimit(
      buildRequest("/api/v1/supersudo/products")
    );
    await checkPublicApiGetRateLimit(
      buildRequest("/api/v1/auth/login", "POST")
    );

    expect(enforceUpstashRateLimitMock).not.toHaveBeenCalled();
  });
});
