import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { reelsViewsService } from "@/lib/services/reels-views.service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 },
      );
    }

    const viewsByReelId = await reelsViewsService.getAdminViewsByReelId();
    return NextResponse.json({ viewsByReelId });
  } catch (error: unknown) {
    logger.error("GET /api/v1/supersudo/reels/views failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
