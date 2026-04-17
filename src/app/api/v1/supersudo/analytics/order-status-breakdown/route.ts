import { NextRequest, NextResponse } from "next/server";

import { jsonErrorResponse } from "@/lib/api/json-error-response";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/supersudo/analytics/order-status-breakdown
 * Order counts grouped by `Order.status` for today, last 7 days, and last 30 days (createdAt).
 */
export async function GET(req: NextRequest) {
  const instance = req.url;

  try {
    const user = await authenticateToken(req);

    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance,
        },
        { status: 403 }
      );
    }

    logger.devLog("📊 [ORDER STATUS BREAKDOWN]", { userId: user.id });

    const result = await adminService.getOrderStatusBreakdown();
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin order status breakdown error", { error });
    return jsonErrorResponse(error, instance);
  }
}
