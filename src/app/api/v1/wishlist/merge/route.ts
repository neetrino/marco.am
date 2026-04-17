import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import {
  clearWishlistSessionCookie,
  readWishlistSessionToken,
} from "@/lib/api/wishlist-session-cookie";
import { authenticateToken } from "@/lib/middleware/auth";
import { mergeGuestWishlistIntoUser } from "@/lib/services/wishlist-merge.service";
import { logger } from "@/lib/utils/logger";

/**
 * POST — attach guest wishlist (cookie / `x-wishlist-session`) to the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const sessionToken = readWishlistSessionToken(req);
    const result = await mergeGuestWishlistIntoUser(sessionToken, user.id);
    const res = NextResponse.json({
      mergedItems: result.mergedItems,
      guestWishlistFound: result.guestWishlistFound,
    });

    if (sessionToken) {
      clearWishlistSessionCookie(res);
    }

    return res;
  } catch (error: unknown) {
    logger.error("Wishlist merge failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
