import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAuthContextMock = vi.fn();

vi.mock("@/lib/middleware/auth-edge", () => ({
  getAuthContext: (...args: unknown[]) => getAuthContextMock(...args),
}));

vi.mock("@/lib/middleware/upstash-rate-limit", () => ({
  enforceUpstashRateLimit: vi.fn(async () => null),
}));

import { config, proxy } from "./proxy";

const AUTH_REQUIRED_PAGE_MATCHERS = [
  "/supersudo",
  "/supersudo/:path*",
  "/profile",
  "/wishlist",
  "/orders/:path*",
] as const;

function buildRequest(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers: init.headers,
  });
}

describe("proxy security regression", () => {
  it("is wired from src/proxy.ts (root middleware.ts must not exist)", () => {
    const root = process.cwd();
    expect(existsSync(resolve(root, "src/proxy.ts"))).toBe(true);
    expect(existsSync(resolve(root, "middleware.ts"))).toBe(false);
    expect(existsSync(resolve(root, "src/middleware.ts"))).toBe(false);
  });

  it("matcher covers every auth-required storefront page", () => {
    for (const matcher of AUTH_REQUIRED_PAGE_MATCHERS) {
      expect(config.matcher).toContain(matcher);
    }
  });

  it("matcher covers account and admin API prefixes", () => {
    expect(config.matcher).toContain("/api/v1/users/:path*");
    expect(config.matcher).toContain("/api/v1/supersudo/:path*");
    expect(config.matcher.some((entry) => entry.includes("orders"))).toBe(true);
  });
});

describe("proxy auth and CSRF behavior", () => {
  beforeEach(() => {
    getAuthContextMock.mockReset();
    getAuthContextMock.mockResolvedValue({ token: null, decoded: null });
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
    getAuthContextMock.mockResolvedValue({
      token: "valid.jwt",
      decoded: { userId: "user-1", authEpoch: 1 },
    });

    const response = await proxy(buildRequest("/profile"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
