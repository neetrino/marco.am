import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import {
  applyWishlistSessionCookie,
  readWishlistSessionToken,
} from "@/lib/api/wishlist-session-cookie";
import { authenticateToken } from "@/lib/middleware/auth";
import {
  removeWishlistItemForGuest,
  removeWishlistItemForUser,
} from "@/lib/services/wishlist.service";
import { logger } from "@/lib/utils/logger";

function resolveCatalogLocale(req: NextRequest): string {
  const lang = new URL(req.url).searchParams.get("lang")?.trim();
  if (lang === "hy" || lang === "ru" || lang === "en") {
    return lang;
  }
  return "en";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await authenticateToken(req);
    const { productId } = await params;
    const locale = user?.locale ?? resolveCatalogLocale(req);

    if (user) {
      const payload = await removeWishlistItemForUser(user.id, productId, locale);
      return NextResponse.json(payload);
    }

    const sessionToken = readWishlistSessionToken(req);
    const { payload, sessionToken: token } = await removeWishlistItemForGuest(
      sessionToken,
      productId,
      locale
    );
    const res = NextResponse.json(payload);
    applyWishlistSessionCookie(res, token);
    return res;
  } catch (error: unknown) {
    logger.error("Wishlist DELETE failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
