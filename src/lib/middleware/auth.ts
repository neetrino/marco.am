import { NextRequest } from "next/server";
import * as jwt from "jsonwebtoken";
import { db } from "@white-shop/db";
import {
  isAuthEpochValid,
  readTokenAuthEpoch,
} from "@/lib/auth/auth-epoch";
import { readAuthSessionToken } from "@/lib/auth/auth-session-cookie";
import { AUTH_ROLES_HEADER, AUTH_USER_ID_HEADER } from "@/lib/constants/auth-headers";
import { normalizeUserRoles } from "@/lib/constants/user-roles";
import { logger } from "@/lib/utils/logger";

interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  locale: string;
  roles: string[];
}

/**
 * Placeholder used only on the proxy fast path (see `readProxyValidatedUser`),
 * where the real `user.locale` is intentionally not fetched to avoid a DB
 * round trip. Matches the Prisma `User.locale` column default. Routes that
 * read the user's actual locale preference must pass `{ needsProfile: true }`.
 */
const FAST_PATH_LOCALE_PLACEHOLDER = "en";

type JwtPayload = {
  userId: string;
  authEpoch?: number;
};

export type AuthenticateTokenOptions = {
  /**
   * Forces the full DB lookup even when the proxy already validated this
   * request. Set this for routes that read `user.email`, `user.phone`, or
   * `user.locale` — fields the header fast path cannot supply.
   */
  needsProfile?: boolean;
};

function readJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error("JWT_SECRET is not set");
    return null;
  }
  return secret;
}

function readTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return bearerToken ?? readAuthSessionToken(request);
}

function verifyToken(token: string): JwtPayload | null {
  const secret = readJwtSecret();
  if (!secret) {
    return null;
  }
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return null;
    }
    throw error;
  }
}

export function getAuthContext(
  request: NextRequest
): { token: string | null; decoded: JwtPayload | null } {
  const token = readTokenFromRequest(request);
  if (!token) {
    return { token: null, decoded: null };
  }
  return { token, decoded: verifyToken(token) };
}

function parseRolesHeader(value: string | null): string[] | null {
  if (!value) {
    return null;
  }
  const roles = value
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  return roles.length > 0 ? normalizeUserRoles(roles) : null;
}

/**
 * Reuses the session the proxy already validated against the DB (see
 * `src/proxy.ts` → `requireAuthenticatedApi`/`requireAdminApi` →
 * `validateSessionAtEdge`), skipping a second `user` table lookup.
 *
 * Trusted only because the proxy strips any client-supplied copies of
 * `AUTH_USER_ID_HEADER`/`AUTH_ROLES_HEADER` from every `/api/` request
 * before validation runs — see `src/lib/constants/auth-headers.ts`. As a
 * defense-in-depth check, the header user id must also match the userId
 * inside this request's own verified JWT.
 */
function readProxyValidatedUser(
  request: NextRequest,
  decoded: JwtPayload
): AuthUser | null {
  const headerUserId = request.headers.get(AUTH_USER_ID_HEADER);
  const roles = parseRolesHeader(request.headers.get(AUTH_ROLES_HEADER));
  if (!headerUserId || !roles || headerUserId !== decoded.userId) {
    return null;
  }

  return {
    id: decoded.userId,
    email: null,
    phone: null,
    locale: FAST_PATH_LOCALE_PLACEHOLDER,
    roles,
  };
}

async function loadUserFromDb(decoded: JwtPayload): Promise<AuthUser | null> {
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      locale: true,
      roles: true,
      authEpoch: true,
      blocked: true,
      deletedAt: true,
    },
  });

  if (!user || user.blocked || user.deletedAt) {
    return null;
  }

  if (!isAuthEpochValid(readTokenAuthEpoch(decoded), user.authEpoch)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    locale: user.locale,
    roles: normalizeUserRoles(user.roles),
  };
}

/**
 * Authenticates the JWT from the request.
 *
 * When the proxy already validated this session against the DB, reuses
 * that result instead of repeating the `user` table lookup. Falls back to
 * the DB lookup for any request the proxy did not validate (headers
 * absent/invalid), and whenever `options.needsProfile` is set — required
 * for routes that read `user.email`, `user.phone`, or `user.locale`.
 */
export async function authenticateToken(
  request: NextRequest,
  options: AuthenticateTokenOptions = {}
): Promise<AuthUser | null> {
  const { decoded } = getAuthContext(request);
  if (!decoded?.userId) {
    return null;
  }

  if (!options.needsProfile) {
    const fastPathUser = readProxyValidatedUser(request, decoded);
    if (fastPathUser) {
      return fastPathUser;
    }
  }

  return loadUserFromDb(decoded);
}

/**
 * Check if user is admin
 */
export function requireAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  return user.roles.includes("admin");
}
