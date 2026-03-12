import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { ordersService } from "@/lib/services/orders.service";

/**
 * POST /api/v1/orders/reorder
 * Body: { orderNumber: string }
 * Adds all items from the given order to the current user's cart.
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
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    if (!orderNumber) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "orderNumber is required",
        },
        { status: 400 }
      );
    }

    const result = await ordersService.reorder(user.id, orderNumber);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; type?: string; title?: string; detail?: string };
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Error",
        status: err.status || 500,
        detail: err.detail || "Failed to reorder",
      },
      { status: err.status || 500 }
    );
  }
}
