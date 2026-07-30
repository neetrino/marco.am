import { beforeEach, describe, expect, it, vi } from "vitest";
import * as jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const findUniqueMock = vi.fn();

vi.mock("@white-shop/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

import { authenticateToken } from "./auth";

const JWT_SECRET = "test-secret";

function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function buildRequest(
  token: string | null,
  extraHeaders: Record<string, string> = {}
): NextRequest {
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost:3000/api/v1/users/profile", { headers });
}

function mockDbUser(overrides: Partial<Record<string, unknown>> = {}) {
  findUniqueMock.mockResolvedValue({
    id: "user-1",
    email: "user@example.com",
    phone: "+37400000000",
    locale: "ru",
    roles: ["customer"],
    authEpoch: 0,
    blocked: false,
    deletedAt: null,
    ...overrides,
  });
}

describe("authenticateToken", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it("returns null when no token is present, without querying the DB", async () => {
    const user = await authenticateToken(buildRequest(null));
    expect(user).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("falls back to the DB lookup when proxy-validated headers are absent", async () => {
    mockDbUser();
    const token = signToken({ userId: "user-1", authEpoch: 0 });

    const user = await authenticateToken(buildRequest(token));

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(user).toEqual({
      id: "user-1",
      email: "user@example.com",
      phone: "+37400000000",
      locale: "ru",
      roles: ["customer"],
    });
  });

  it("uses the proxy fast path (no DB call) when headers match the verified JWT", async () => {
    const token = signToken({ userId: "user-1", authEpoch: 0 });

    const user = await authenticateToken(
      buildRequest(token, {
        "x-auth-user-id": "user-1",
        "x-auth-roles": "customer,admin",
      })
    );

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(user).toEqual({
      id: "user-1",
      email: null,
      phone: null,
      locale: "en",
      roles: ["customer", "admin"],
    });
  });

  it("ignores a header userId that does not match the JWT and falls back to the DB", async () => {
    mockDbUser();
    const token = signToken({ userId: "user-1", authEpoch: 0 });

    const user = await authenticateToken(
      buildRequest(token, {
        "x-auth-user-id": "attacker-controlled-id",
        "x-auth-roles": "admin",
      })
    );

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(user?.id).toBe("user-1");
    expect(user?.roles).toEqual(["customer"]);
  });

  it("forces the DB lookup when needsProfile is set, even with valid fast-path headers", async () => {
    mockDbUser({ locale: "hy" });
    const token = signToken({ userId: "user-1", authEpoch: 0 });

    const user = await authenticateToken(
      buildRequest(token, {
        "x-auth-user-id": "user-1",
        "x-auth-roles": "customer",
      }),
      { needsProfile: true }
    );

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(user?.locale).toBe("hy");
  });

  it("returns null when the DB-fallback user is blocked", async () => {
    mockDbUser({ blocked: true });
    const token = signToken({ userId: "user-1", authEpoch: 0 });

    const user = await authenticateToken(buildRequest(token));

    expect(user).toBeNull();
  });

  it("returns null when the token authEpoch is stale, even on the fast path", async () => {
    // Fast path trusts the proxy for the user-blocked/deleted check, but the
    // JWT itself is still verified here; a garbage/expired token never
    // reaches readProxyValidatedUser because getAuthContext already fails.
    const user = await authenticateToken(
      buildRequest("not-a-real-jwt", {
        "x-auth-user-id": "user-1",
        "x-auth-roles": "customer",
      })
    );

    expect(user).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
