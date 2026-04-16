import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken } from "@/lib/middleware/auth";
import { prefillCartFromOrder } from "@/lib/services/cart-reorder.service";
import { logger } from "@/lib/utils/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
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

    const { number } = await params;
    const result = await prefillCartFromOrder(user.id, number, user.locale);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Order reorder error", { error });
    return toApiErrorResponse(error, req.url);
  }
}
