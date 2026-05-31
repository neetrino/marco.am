import { NextRequest, NextResponse } from "next/server";
import { authService, isAuthPendingVerification } from "@/lib/services/auth.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";
import { safeParseRegister } from "@/lib/schemas/auth.schema";
import { applyAuthSessionCookie } from "@/lib/auth/auth-session-cookie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = safeParseRegister(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const detail = Object.entries(first)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ") || parsed.error.message;
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation failed",
          status: 400,
          detail,
          instance: req.url,
        },
        { status: 400 }
      );
    }
    const result = await authService.register(parsed.data);
    if (isAuthPendingVerification(result)) {
      return NextResponse.json(
        {
          needsVerification: true,
          channel: result.channel,
          verificationToken: result.verificationToken,
        },
        { status: 201 }
      );
    }
    const response = NextResponse.json({ user: result.user }, { status: 201 });
    applyAuthSessionCookie(response, result.token);
    return response;
  } catch (error: unknown) {
    logger.error("Registration error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

