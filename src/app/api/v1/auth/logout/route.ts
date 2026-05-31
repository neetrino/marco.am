import { NextResponse } from "next/server";
import { clearAuthSessionCookie } from "@/lib/auth/auth-session-cookie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthSessionCookie(response);
  return response;
}
