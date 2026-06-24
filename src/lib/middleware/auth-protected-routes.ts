import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, type JwtPayload } from "@/lib/middleware/auth-edge";
import {
  sessionHasAdminRole,
  validateSessionAtEdge,
  type ValidatedEdgeSession,
} from "@/lib/middleware/auth-session-edge";

/** Storefront pages that require a valid session before HTML is served. */
export function isAuthRequiredPage(pathname: string): boolean {
  if (pathname === "/profile" || pathname === "/wishlist") {
    return true;
  }
  if (isSupersudoPage(pathname)) {
    return true;
  }
  if (pathname.startsWith("/orders/")) {
    return true;
  }
  return false;
}

export function isSupersudoPage(pathname: string): boolean {
  return pathname === "/supersudo" || pathname.startsWith("/supersudo/");
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

function buildHomeRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}

async function resolveValidatedSession(
  request: NextRequest
): Promise<{ decoded: JwtPayload; session: ValidatedEdgeSession } | null> {
  const { token, decoded } = await getAuthContext(request);
  if (!token || !decoded) {
    return null;
  }

  const session = await validateSessionAtEdge(decoded);
  if (!session) {
    return null;
  }

  return { decoded, session };
}

/**
 * Redirects unauthenticated or revoked visitors before private page HTML is served.
 * Supersudo additionally requires a live admin role from the database.
 */
export async function guardAuthenticatedPage(
  request: NextRequest
): Promise<NextResponse | null> {
  const resolved = await resolveValidatedSession(request);
  if (!resolved) {
    return buildLoginRedirect(request);
  }

  if (isSupersudoPage(request.nextUrl.pathname) && !sessionHasAdminRole(resolved.session)) {
    return buildHomeRedirect(request);
  }

  return null;
}

export async function requireAuthenticatedApi(
  request: NextRequest
): Promise<{ response: NextResponse | null; userId: string | null }> {
  const resolved = await resolveValidatedSession(request);
  if (!resolved) {
    const { token, decoded } = await getAuthContext(request);
    const detail = !token
      ? "Authentication token required"
      : !decoded
        ? "Invalid or expired token"
        : "Session is no longer valid";

    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail,
        },
        { status: 401 }
      ),
      userId: null,
    };
  }

  return { response: null, userId: resolved.session.userId };
}

export async function requireAdminApi(
  request: NextRequest
): Promise<{ response: NextResponse | null; userId: string | null }> {
  const resolved = await resolveValidatedSession(request);
  if (!resolved) {
    const { token, decoded } = await getAuthContext(request);
    const detail = !token
      ? "Missing or invalid Authorization header"
      : !decoded
        ? "Invalid or expired token"
        : "Session is no longer valid";

    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail,
        },
        { status: 401 }
      ),
      userId: null,
    };
  }

  if (!sessionHasAdminRole(resolved.session)) {
    return {
      response: NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
        },
        { status: 403 }
      ),
      userId: null,
    };
  }

  return { response: null, userId: resolved.session.userId };
}
