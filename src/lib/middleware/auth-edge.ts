import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/auth-session-cookie";

type JwtPayload = {
  userId: string;
  roles: string[];
};

function readTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
  return bearerToken ?? cookieToken;
}

function normalizePayload(payload: unknown): JwtPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const userId = typeof record.userId === "string" ? record.userId : null;
  if (!userId) {
    return null;
  }

  const roles =
    Array.isArray(record.roles) && record.roles.every((role) => typeof role === "string")
      ? (record.roles as string[])
      : [];

  return { userId, roles };
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return normalizePayload(payload);
  } catch {
    return null;
  }
}

export async function getAuthContext(
  request: NextRequest
): Promise<{ token: string | null; decoded: JwtPayload | null }> {
  const token = readTokenFromRequest(request);
  if (!token) {
    return { token: null, decoded: null };
  }
  return { token, decoded: await verifyToken(token) };
}
