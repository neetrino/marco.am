import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  getAuthContextMock,
  validateSessionAtEdgeMock,
  enforceUpstashRateLimitMock,
  checkPublicApiGetRateLimitMock,
} = vi.hoisted(() => ({
  getAuthContextMock: vi.fn(),
  validateSessionAtEdgeMock: vi.fn(),
  enforceUpstashRateLimitMock: vi.fn(
    async (): Promise<NextResponse | null> => null
  ),
  checkPublicApiGetRateLimitMock: vi.fn(
    async (): Promise<NextResponse | null> => null
  ),
}));

vi.mock("@/lib/middleware/auth-edge", () => ({
  getAuthContext: (...args: unknown[]) => getAuthContextMock(...args),
}));

vi.mock("@/lib/middleware/auth-session-edge", () => ({
  validateSessionAtEdge: (...args: unknown[]) => validateSessionAtEdgeMock(...args),
  sessionHasAdminRole: (session: { roles: string[] }) => session.roles.includes("admin"),
}));

vi.mock("@/lib/middleware/upstash-rate-limit", () => ({
  enforceUpstashRateLimit: enforceUpstashRateLimitMock,
}));

vi.mock("@/lib/middleware/public-api-rate-limit", () => ({
  checkPublicApiGetRateLimit: checkPublicApiGetRateLimitMock,
}));

import { config, proxy } from "./proxy";

function buildRequest(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers: init.headers,
  });
}

function mockValidSession(userId: string, roles: string[] = ["customer"]) {
  getAuthContextMock.mockResolvedValue({
    token: "valid.jwt",
    decoded: { userId, authEpoch: 1 },
  });
  validateSessionAtEdgeMock.mockResolvedValue({ userId, roles });
}

describe("proxy security regression", () => {
  it("is wired from src/proxy.ts (root middleware.ts must not exist)", () => {
    const root = process.cwd();
    expect(existsSync(resolve(root, "src/proxy.ts"))).toBe(true);
    expect(existsSync(resolve(root, "middleware.ts"))).toBe(false);
    expect(existsSync(resolve(root, "src/middleware.ts"))).toBe(false);
  });

  it("uses a broad matcher that excludes static assets only", () => {
    expect(config.matcher).toHaveLength(1);
    const pattern = config.matcher[0];
    expect(pattern).toContain("_next/static");
    expect(pattern).toContain("favicon.ico");
  });
});

describe("proxy auth and CSRF behavior", () => {
  beforeEach(() => {
    getAuthContextMock.mockReset();
    validateSessionAtEdgeMock.mockReset();
    enforceUpstashRateLimitMock.mockReset();
    checkPublicApiGetRateLimitMock.mockReset();
    getAuthContextMock.mockResolvedValue({ token: null, decoded: null });
    enforceUpstashRateLimitMock.mockResolvedValue(null);
    checkPublicApiGetRateLimitMock.mockResolvedValue(null);
  });

  it("redirects unauthenticated /profile to login with return URL", async () => {
    const response = await proxy(buildRequest("/profile"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Fprofile"
    );
  });

  it("redirects unauthenticated /orders/[number] to login", async () => {
    const response = await proxy(buildRequest("/orders/ORD-42"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("redirect=%2Forders%2FORD-42");
  });

  it("returns 401 for unauthenticated users API", async () => {
    const response = await proxy(buildRequest("/api/v1/users/profile"));
    expect(response.status).toBe(401);
    const body = (await response.json()) as { detail?: string };
    expect(body.detail).toBe("Authentication token required");
  });

  it("returns 401 for unauthenticated orders API", async () => {
    const response = await proxy(buildRequest("/api/v1/orders"));
    expect(response.status).toBe(401);
  });

  it("does not require auth for guest checkout API", async () => {
    const response = await proxy(
      buildRequest("/api/v1/orders/checkout", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
      })
    );
    expect(response.status).not.toBe(401);
  });

  it("blocks cross-origin state-changing API requests", async () => {
    const response = await proxy(
      buildRequest("/api/v1/cart/items", {
        method: "POST",
        headers: {
          Origin: "https://evil.example.com",
          "Content-Type": "application/json",
        },
      })
    );
    expect(response.status).toBe(403);
    const body = (await response.json()) as { detail?: string };
    expect(body.detail).toContain("Cross-origin");
  });

  it("allows authenticated visitors through private pages", async () => {
    mockValidSession("user-1");

    const response = await proxy(buildRequest("/profile"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects non-admin users away from supersudo", async () => {
    mockValidSession("user-1", ["customer"]);

    const response = await proxy(buildRequest("/supersudo"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("strips client-supplied x-auth-user-id/x-auth-roles before validating", async () => {
    // No session mocked to succeed -> if the spoofed headers were trusted
    // as-is, requireAuthenticatedApi would never even be consulted here;
    // we assert the request still comes back 401 rather than being
    // silently authenticated by the attacker-supplied headers.
    const response = await proxy(
      buildRequest("/api/v1/users/profile", {
        headers: {
          "x-auth-user-id": "attacker-controlled-id",
          "x-auth-roles": "admin",
        },
      })
    );
    expect(response.status).toBe(401);
  });

  it("overwrites spoofed x-auth-* headers with the real validated session", async () => {
    mockValidSession("user-42", ["customer"]);

    const response = await proxy(
      buildRequest("/api/v1/users/profile", {
        headers: {
          "x-auth-user-id": "attacker-controlled-id",
          "x-auth-roles": "admin",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-auth-user-id")).toBe("user-42");
    expect(response.headers.get("x-middleware-request-x-auth-roles")).toBe("customer");
  });

  it("forwards proxy-validated userId/roles headers to users API route handlers", async () => {
    // NextResponse.next({ request: { headers } }) encodes the forwarded
    // request headers as `x-middleware-request-<name>` response headers,
    // which is how Next.js reconstructs the request for the route handler.
    mockValidSession("user-42", ["customer"]);

    const response = await proxy(buildRequest("/api/v1/users/profile"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-auth-user-id")).toBe("user-42");
    expect(response.headers.get("x-middleware-request-x-auth-roles")).toBe("customer");
  });

  it("sets a strict CSP on storefront pages", async () => {
    const response = await proxy(buildRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe("proxy public API GET rate-limit dispatch", () => {
  beforeEach(() => {
    getAuthContextMock.mockReset();
    validateSessionAtEdgeMock.mockReset();
    enforceUpstashRateLimitMock.mockReset();
    checkPublicApiGetRateLimitMock.mockReset();
    getAuthContextMock.mockResolvedValue({ token: null, decoded: null });
    enforceUpstashRateLimitMock.mockResolvedValue(null);
    checkPublicApiGetRateLimitMock.mockResolvedValue(null);
  });

  it("invokes the public API limiter for GET /api/v1/*", async () => {
    const response = await proxy(buildRequest("/api/v1/products"));
    expect(response.status).toBe(200);
    expect(checkPublicApiGetRateLimitMock).toHaveBeenCalledTimes(1);
  });

  it("does not invoke the public API limiter for page navigations", async () => {
    await proxy(buildRequest("/"));
    expect(checkPublicApiGetRateLimitMock).not.toHaveBeenCalled();
  });

  it("gives auth POST limiter precedence (public GET limiter not consulted)", async () => {
    await proxy(
      buildRequest("/api/v1/auth/login", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
      })
    );

    expect(enforceUpstashRateLimitMock).toHaveBeenCalledWith(
      expect.any(NextRequest),
      expect.objectContaining({ prefix: "ratelimit:auth" }),
      true
    );
    expect(checkPublicApiGetRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns the public API limiter response with CORS headers", async () => {
    checkPublicApiGetRateLimitMock.mockResolvedValue(
      NextResponse.json(
        {
          type: "https://api.shop.am/problems/too-many-requests",
          title: "Too Many Requests",
          status: 429,
          detail: "Too many API requests. Try again later.",
        },
        { status: 429 }
      )
    );

    const response = await proxy(buildRequest("/api/v1/products"));
    expect(response.status).toBe(429);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
