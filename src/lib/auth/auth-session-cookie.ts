import { NextResponse, type NextRequest } from "next/server";

export const AUTH_SESSION_COOKIE_NAME = "shop_auth_session";

const DEFAULT_AUTH_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function parseMaxAgeSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN?.trim();
  if (!raw) {
    return DEFAULT_AUTH_SESSION_MAX_AGE_SECONDS;
  }

  const match = raw.match(/^(\d+)([smhd])?$/i);
  if (!match) {
    return DEFAULT_AUTH_SESSION_MAX_AGE_SECONDS;
  }

  const value = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? "s";
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_AUTH_SESSION_MAX_AGE_SECONDS;
  }

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  return value * multipliers[unit];
}

export function readAuthSessionToken(req: NextRequest): string | null {
  return req.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
}

export function applyAuthSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: parseMaxAgeSeconds(),
  });
}

export function clearAuthSessionCookie(res: NextResponse): void {
  res.cookies.set(AUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
