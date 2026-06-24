import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAuthContextMock = vi.fn();
const validateSessionAtEdgeMock = vi.fn();

vi.mock("@/lib/middleware/auth-edge", () => ({
  getAuthContext: (...args: unknown[]) => getAuthContextMock(...args),
}));

vi.mock("@/lib/middleware/auth-session-edge", () => ({
  validateSessionAtEdge: (...args: unknown[]) => validateSessionAtEdgeMock(...args),
  sessionHasAdminRole: (session: { roles: string[] }) => session.roles.includes("admin"),
}));

import {
  buildLoginRedirect,
  guardAuthenticatedPage,
  isAuthRequiredOrdersApi,
  isAuthRequiredPage,
  isAuthRequiredUsersApi,
  requireAdminApi,
  requireAuthenticatedApi,
} from "./auth-protected-routes";

function buildRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

function mockValidSession(userId: string, roles: string[] = ["customer"]) {
  getAuthContextMock.mockResolvedValue({
    token: "jwt",
    decoded: { userId, authEpoch: 0 },
  });
  validateSessionAtEdgeMock.mockResolvedValue({ userId, roles });
}

describe("isAuthRequiredPage", () => {
  it("requires auth for account and admin pages", () => {
    expect(isAuthRequiredPage("/profile")).toBe(true);
    expect(isAuthRequiredPage("/wishlist")).toBe(true);
    expect(isAuthRequiredPage("/supersudo")).toBe(true);
    expect(isAuthRequiredPage("/supersudo/products")).toBe(true);
    expect(isAuthRequiredPage("/orders/ORD-123")).toBe(true);
  });

  it("allows public storefront pages", () => {
    expect(isAuthRequiredPage("/")).toBe(false);
    expect(isAuthRequiredPage("/cart")).toBe(false);
    expect(isAuthRequiredPage("/checkout")).toBe(false);
    expect(isAuthRequiredPage("/compare")).toBe(false);
    expect(isAuthRequiredPage("/products")).toBe(false);
    expect(isAuthRequiredPage("/login")).toBe(false);
  });
});

describe("isAuthRequiredUsersApi", () => {
  it("matches all user account endpoints", () => {
    expect(isAuthRequiredUsersApi("/api/v1/users/profile")).toBe(true);
    expect(isAuthRequiredUsersApi("/api/v1/users/addresses")).toBe(true);
    expect(isAuthRequiredUsersApi("/api/v1/users/password")).toBe(true);
  });

  it("does not match unrelated APIs", () => {
    expect(isAuthRequiredUsersApi("/api/v1/cart")).toBe(false);
    expect(isAuthRequiredUsersApi("/api/v1/wishlist")).toBe(false);
  });
});

describe("isAuthRequiredOrdersApi", () => {
  it("requires auth for list, detail, and reorder", () => {
    expect(isAuthRequiredOrdersApi("/api/v1/orders")).toBe(true);
    expect(isAuthRequiredOrdersApi("/api/v1/orders/ORD-1")).toBe(true);
    expect(isAuthRequiredOrdersApi("/api/v1/orders/ORD-1/reorder")).toBe(true);
  });

  it("allows guest checkout", () => {
    expect(isAuthRequiredOrdersApi("/api/v1/orders/checkout")).toBe(false);
  });
});

describe("buildLoginRedirect", () => {
  it("preserves pathname and query in redirect param", () => {
    const response = buildLoginRedirect(
      new NextRequest("http://localhost:3000/orders/ORD-1?payment=succeeded")
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Forders%2FORD-1%3Fpayment%3Dsucceeded"
    );
  });
});

describe("guardAuthenticatedPage", () => {
  beforeEach(() => {
    getAuthContextMock.mockReset();
    validateSessionAtEdgeMock.mockReset();
  });

  it("returns null when session is valid", async () => {
    mockValidSession("u1");
    const result = await guardAuthenticatedPage(buildRequest("/profile"));
    expect(result).toBeNull();
  });

  it("redirects when session is missing", async () => {
    getAuthContextMock.mockResolvedValue({ token: null, decoded: null });
    const result = await guardAuthenticatedPage(buildRequest("/wishlist"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toContain("redirect=%2Fwishlist");
  });

  it("redirects revoked sessions to login", async () => {
    getAuthContextMock.mockResolvedValue({
      token: "jwt",
      decoded: { userId: "u1", authEpoch: 0 },
    });
    validateSessionAtEdgeMock.mockResolvedValue(null);
    const result = await guardAuthenticatedPage(buildRequest("/profile"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toContain("redirect=%2Fprofile");
  });

  it("redirects non-admin users away from supersudo", async () => {
    mockValidSession("u1", ["customer"]);
    const result = await guardAuthenticatedPage(buildRequest("/supersudo"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("allows admin users into supersudo", async () => {
    mockValidSession("admin-1", ["admin"]);
    const result = await guardAuthenticatedPage(buildRequest("/supersudo"));
    expect(result).toBeNull();
  });
});

describe("requireAuthenticatedApi", () => {
  beforeEach(() => {
    getAuthContextMock.mockReset();
    validateSessionAtEdgeMock.mockReset();
  });

  it("returns 401 when token is missing", async () => {
    getAuthContextMock.mockResolvedValue({ token: null, decoded: null });
    const { response, userId } = await requireAuthenticatedApi(
      buildRequest("/api/v1/users/profile")
    );
    expect(userId).toBeNull();
    expect(response?.status).toBe(401);
    const body = (await response?.json()) as { detail?: string };
    expect(body.detail).toBe("Authentication token required");
  });

  it("returns 401 when token is invalid", async () => {
    getAuthContextMock.mockResolvedValue({ token: "bad", decoded: null });
    const { response } = await requireAuthenticatedApi(buildRequest("/api/v1/orders"));
    expect(response?.status).toBe(401);
    const body = (await response?.json()) as { detail?: string };
    expect(body.detail).toBe("Invalid or expired token");
  });

  it("returns 401 when session is revoked", async () => {
    getAuthContextMock.mockResolvedValue({
      token: "jwt",
      decoded: { userId: "user-42", authEpoch: 2 },
    });
    validateSessionAtEdgeMock.mockResolvedValue(null);
    const { response } = await requireAuthenticatedApi(buildRequest("/api/v1/orders"));
    expect(response?.status).toBe(401);
    const body = (await response?.json()) as { detail?: string };
    expect(body.detail).toBe("Session is no longer valid");
  });

  it("passes through with userId when token is valid", async () => {
    mockValidSession("user-42");
    const { response, userId } = await requireAuthenticatedApi(
      buildRequest("/api/v1/users/password")
    );
    expect(response).toBeNull();
    expect(userId).toBe("user-42");
  });
});

describe("requireAdminApi", () => {
  beforeEach(() => {
    getAuthContextMock.mockReset();
    validateSessionAtEdgeMock.mockReset();
  });

  it("returns 403 for authenticated non-admin users", async () => {
    mockValidSession("user-1", ["customer"]);
    const { response } = await requireAdminApi(buildRequest("/api/v1/supersudo/products"));
    expect(response?.status).toBe(403);
    const body = (await response?.json()) as { detail?: string };
    expect(body.detail).toBe("Admin access required");
  });

  it("passes through for admin users", async () => {
    mockValidSession("admin-1", ["admin"]);
    const { response, userId } = await requireAdminApi(
      buildRequest("/api/v1/supersudo/products")
    );
    expect(response).toBeNull();
    expect(userId).toBe("admin-1");
  });
});
