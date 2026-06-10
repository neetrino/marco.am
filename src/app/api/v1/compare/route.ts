import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import {
  applyCompareSessionCookie,
  readCompareSessionToken,
} from "@/lib/api/compare-session-cookie";
import { authenticateToken } from "@/lib/middleware/auth";
import { resolveApiLocale, type ApiLocale } from "@/lib/i18n/api-locale";
import { compareAddBodySchema } from "@/lib/schemas/compare-body.schema";
import {
  addCompareItemForGuest,
  addCompareItemForUser,
  getCompareForGuest,
  getCompareForUser,
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

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const fields = req.nextUrl.searchParams.get("fields") === "ids" ? "ids" : "full";
    const locale = resolveCompareLocale(req, user?.locale);

    if (user) {
      const payload = await getCompareForUser(user.id, locale, fields);
      return NextResponse.json(payload);
    }

    const sessionToken = readCompareSessionToken(req);
    const { payload, sessionToken: token } = await getCompareForGuest(
      sessionToken,
      locale,
      fields
    );
    const res = NextResponse.json(payload);
    applyCompareSessionCookie(res, token);
    return res;
  } catch (error: unknown) {
    logger.error("Compare GET failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const raw: unknown = await req.json();
    const parsed = compareAddBodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation failed",
          status: 400,
          detail: parsed.error.message,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const { productId } = parsed.data;
    const locale = resolveCompareLocale(req, user?.locale);

    if (user) {
      const payload = await addCompareItemForUser(user.id, productId, locale);
      return NextResponse.json(payload, { status: 201 });
    }

    const sessionToken = readCompareSessionToken(req);
    const { payload, sessionToken: token } = await addCompareItemForGuest(
      sessionToken,
      productId,
      locale
    );
    const res = NextResponse.json(payload, { status: 201 });
    applyCompareSessionCookie(res, token);
    return res;
  } catch (error: unknown) {
    logger.error("Compare POST failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
