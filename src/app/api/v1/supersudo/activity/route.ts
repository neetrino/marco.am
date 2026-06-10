import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api/json-error-response";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { withApiRouteMetrics } from "@/lib/observability/api-route-metrics";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/supersudo/activity
 * Get recent activity for admin dashboard
 */
export async function GET(req: NextRequest) {
  return withApiRouteMetrics(
    "/api/v1/supersudo/activity",
    "GET",
    async () => {
      try {
        logger.devLog("📋 [ACTIVITY] Request received");
        const user = await authenticateToken(req);

        if (!user || !requireAdmin(user)) {
          logger.devLog("❌ [ACTIVITY] Unauthorized or not admin");
          return NextResponse.json(
            {
              type: "https://api.shop.am/problems/forbidden",
              title: "Forbidden",
              status: 403,
              detail: "Admin access required",
              instance: req.url,
            },
            { status: 403 }
          );
        }

        const { searchParams } = new URL(req.url);
        const parsedLimit = parseInt(searchParams.get("limit") || "10", 10);
        const limit = Number.isFinite(parsedLimit)
          ? Math.min(Math.max(parsedLimit, 1), 100)
          : 10;

        logger.devLog(`✅ [ACTIVITY] User authenticated: ${user.id}, limit: ${limit}`);
        const result = await adminService.getActivity(limit);
        logger.devLog("✅ [ACTIVITY] Activity data retrieved successfully");

        return NextResponse.json({ data: result });
      } catch (error: unknown) {
        logger.error("Admin activity GET error", { error, url: req.url });
        return jsonErrorResponse(error, req.url);
      }
    },
    (res) => res.status,
  );
}


