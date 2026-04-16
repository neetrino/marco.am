import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken } from "@/lib/middleware/auth";
import { cartService } from "@/lib/services/cart.service";

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

    const data = await req.json();
    const result = await cartService.addItem(user.id, data, user.locale);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ [CART] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

