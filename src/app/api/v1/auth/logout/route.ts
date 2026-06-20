import { NextRequest, NextResponse } from "next/server";
import { bumpAuthEpoch } from "@/lib/auth/auth-epoch-mutations";
import { clearAuthSessionCookie } from "@/lib/auth/auth-session-cookie";
import { getAuthContext } from "@/lib/middleware/auth";

export async function POST(req: NextRequest) {
  const { decoded } = getAuthContext(req);
  if (decoded?.userId) {
    await bumpAuthEpoch(decoded.userId);
  }

  const response = NextResponse.json({ ok: true });
  clearAuthSessionCookie(response);
  return response;
}
