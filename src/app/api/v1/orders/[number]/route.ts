import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { getErrorLogFields } from "@/lib/types/errors";
import { authenticateToken } from "@/lib/middleware/auth";
import { ordersService } from "@/lib/services/orders.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  let user: { id: string } | null = null;
  let orderNumber: string | undefined;
  try {
    user = await authenticateToken(req);
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

    const { number } = await params;
    orderNumber = number;
    const result = await ordersService.findByNumber(number, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [ORDERS] Get order by number error:", {
      orderNumber,
      userId: user?.id,
      ...getErrorLogFields(error),
      fullError: error,
    });
    return toApiErrorResponse(error, req.url);
  }
}

