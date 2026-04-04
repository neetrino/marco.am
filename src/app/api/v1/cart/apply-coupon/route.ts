import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { cartService } from "@/lib/services/cart.service";

/**
 * POST /api/v1/cart/apply-coupon
 * Apply a promo code to the current user's cart.
 * Body: { code: string }
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
          detail: "Authentication required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "code is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await cartService.applyCoupon(user.id, code);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; type?: string; title?: string; detail?: string };
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Error",
        status: err.status || 500,
        detail: err.detail || "Failed to apply promo code",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}
