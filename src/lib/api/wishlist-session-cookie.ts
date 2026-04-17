import { NextRequest, NextResponse } from "next/server";
import {
  WISHLIST_SESSION_COOKIE_NAME,
  WISHLIST_SESSION_HEADER_NAME,
  WISHLIST_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/wishlist-session";

/**
 * Guest session token: header wins over cookie (explicit client override).
 */
export function readWishlistSessionToken(req: NextRequest): string | undefined {
  const header = req.headers.get(WISHLIST_SESSION_HEADER_NAME)?.trim();
  if (header) {
    return header;
  }
  return req.cookies.get(WISHLIST_SESSION_COOKIE_NAME)?.value ?? undefined;
}

export function applyWishlistSessionCookie(
  res: NextResponse,
  sessionToken: string
): void {
  res.cookies.set(WISHLIST_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WISHLIST_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearWishlistSessionCookie(res: NextResponse): void {
  res.cookies.set(WISHLIST_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
