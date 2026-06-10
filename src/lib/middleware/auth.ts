import { NextRequest } from "next/server";
import * as jwt from "jsonwebtoken";
import { db } from "@white-shop/db";
import { readAuthSessionToken } from "@/lib/auth/auth-session-cookie";
import { logger } from "@/lib/utils/logger";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  locale: string;
  roles: string[];
}

type JwtPayload = {
  userId: string;
  roles?: string[];
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

function rolesFromDecodedToken(decoded: JwtPayload): string[] {
  return Array.isArray(decoded.roles) ? decoded.roles : [];
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

/**
 * Authenticate JWT token from request headers
 */
export async function authenticateToken(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const { decoded } = getAuthContext(request);
    if (!decoded) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        locale: true,
        roles: true,
        blocked: true,
        deletedAt: true,
      },
    });

    if (!user || user.blocked || user.deletedAt) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      roles: user.roles.length > 0 ? user.roles : rolesFromDecodedToken(decoded),
    };
  } catch (error) {
    throw error;
  }
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

