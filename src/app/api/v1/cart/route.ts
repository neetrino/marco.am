import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken } from "@/lib/middleware/auth";
import { cartService } from "@/lib/services/cart.service";

function isCartSummaryView(request: NextRequest): boolean {
  const view = new URL(request.url).searchParams.get("view");
  return view === "summary";
}

export async function GET(req: NextRequest) {
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

    if (isCartSummaryView(req)) {
      const summary = await cartService.getCartSummary(user.id, user.locale);
      return NextResponse.json(summary);
    }

    const result = await cartService.getCart(user.id, user.locale);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [CART] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

