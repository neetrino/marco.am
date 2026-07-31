import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import {
  applyCompareSessionCookie,
  readCompareSessionToken,
} from "@/lib/api/compare-session-cookie";
import { authenticateToken } from "@/lib/middleware/auth";
import { resolveApiLocale, type ApiLocale } from "@/lib/i18n/api-locale";
import {
  removeCompareItemForGuest,
  removeCompareItemForUser,
} from "@/lib/services/compare.service";
import { logger } from "@/lib/utils/logger";

function resolveCompareLocale(
  req: NextRequest,
  preferredLocaleRaw?: string,
): ApiLocale {
  return resolveApiLocale({
    localeRaw: req.nextUrl.searchParams.get("locale"),
    langRaw: req.nextUrl.searchParams.get("lang"),
    preferredLocaleRaw,
    acceptLanguageRaw: req.headers.get("accept-language"),
    fallbackLocale: "hy",
  }).resolvedLocale;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await authenticateToken(req);
    const { productId } = await params;
    const locale = resolveCompareLocale(req, user?.locale);

    if (user) {
      const payload = await removeCompareItemForUser(user.id, productId, locale);
      return NextResponse.json(payload);
    }

    const sessionToken = readCompareSessionToken(req);
    const {
      payload,
      sessionToken: token,
      sessionExists,
    } = await removeCompareItemForGuest(sessionToken, productId, locale);
    const res = NextResponse.json(payload);
    if (sessionExists && token) {
      applyCompareSessionCookie(res, token);
    }
    return res;
  } catch (error: unknown) {
    logger.error("Compare DELETE failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
