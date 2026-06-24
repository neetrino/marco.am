import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/middleware/auth-edge";

/** Storefront pages that require a valid session before HTML is served. */
export function isAuthRequiredPage(pathname: string): boolean {
  if (pathname === "/profile" || pathname === "/wishlist") {
    return true;
  }
  if (pathname === "/supersudo" || pathname.startsWith("/supersudo/")) {
    return true;
  }
  if (pathname.startsWith("/orders/")) {
    return true;
  }
  return false;
}

/** Customer account APIs — always require a valid session token. */
export function isAuthRequiredUsersApi(pathname: string): boolean {
  return pathname.startsWith("/api/v1/users/");
}

/**
 * Order APIs except guest checkout (`POST /api/v1/orders/checkout`).
 * List, detail, and reorder are account-scoped.
 */
export function isAuthRequiredOrdersApi(pathname: string): boolean {
  if (pathname === "/api/v1/orders/checkout") {
    return false;
  }
  if (pathname === "/api/v1/orders") {
    return true;
  }
  return pathname.startsWith("/api/v1/orders/");
}

export function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.nextUrl.origin);
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("redirect", returnTo);
  return NextResponse.redirect(loginUrl);
}

/**
 * Redirects unauthenticated visitors to /login before private page HTML is served.
 * Admin role is still enforced client-side (AdminAccessGate) and per API route.
 */
export async function guardAuthenticatedPage(
  request: NextRequest
): Promise<NextResponse | null> {
  const { token, decoded } = await getAuthContext(request);
  if (token && decoded) {
    return null;
  }
  return buildLoginRedirect(request);
}

export async function requireAuthenticatedApi(
  request: NextRequest
): Promise<{ response: NextResponse | null; userId: string | null }> {
  const { token, decoded } = await getAuthContext(request);

  if (!token) {
    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
        },
        { status: 401 }
      ),
      userId: null,
    };
  }

  if (!decoded?.userId) {
    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid or expired token",
        },
        { status: 401 }
      ),
      userId: null,
    };
  }

  return { response: null, userId: decoded.userId };
}
