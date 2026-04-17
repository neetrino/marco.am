import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import {
  applyWishlistSessionCookie,
  readWishlistSessionToken,
} from "@/lib/api/wishlist-session-cookie";
import { authenticateToken } from "@/lib/middleware/auth";
import { wishlistAddBodySchema } from "@/lib/schemas/wishlist-body.schema";
import {
  addWishlistItemForGuest,
  addWishlistItemForUser,
  getWishlistForGuest,
  getWishlistForUser,
} from "@/lib/services/wishlist.service";
import { logger } from "@/lib/utils/logger";

function resolveCatalogLocale(req: NextRequest): string {
  const lang = new URL(req.url).searchParams.get("lang")?.trim();
  if (lang === "hy" || lang === "ru" || lang === "en") {
    return lang;
  }
  return "en";
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const locale = user?.locale ?? resolveCatalogLocale(req);

    if (user) {
      const payload = await getWishlistForUser(user.id, locale);
      return NextResponse.json(payload);
    }

    const sessionToken = readWishlistSessionToken(req);
    const { payload, sessionToken: token } = await getWishlistForGuest(sessionToken, locale);
    const res = NextResponse.json(payload);
    applyWishlistSessionCookie(res, token);
    return res;
  } catch (error: unknown) {
    logger.error("Wishlist GET failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const raw: unknown = await req.json();
    const parsed = wishlistAddBodySchema.safeParse(raw);
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
    const locale = user?.locale ?? resolveCatalogLocale(req);

    if (user) {
      const payload = await addWishlistItemForUser(user.id, productId, locale);
      return NextResponse.json(payload, { status: 201 });
    }

    const sessionToken = readWishlistSessionToken(req);
    const { payload, sessionToken: token } = await addWishlistItemForGuest(
      sessionToken,
      productId,
      locale
    );
    const res = NextResponse.json(payload, { status: 201 });
    applyWishlistSessionCookie(res, token);
    return res;
  } catch (error: unknown) {
    logger.error("Wishlist POST failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
