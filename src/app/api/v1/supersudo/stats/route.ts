import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { withApiRouteMetrics } from "@/lib/observability/api-route-metrics";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * Force dynamic rendering for this route
 * Prevents Next.js from statically generating this route
 */
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/supersudo/stats
 * Get admin statistics (users count, etc.)
 */
export async function GET(req: NextRequest) {
  return withApiRouteMetrics(
    "/api/v1/supersudo/stats",
    "GET",
    async () => {
      try {
        logger.devLog("📊 [ADMIN STATS] Request received:", { url: req.url });
        const user = await authenticateToken(req);

        if (!user || !requireAdmin(user)) {
          logger.devLog("❌ [ADMIN STATS] Unauthorized or not admin");
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

        logger.devLog(`✅ [ADMIN STATS] User authenticated: ${user.id}`);
        const result = await adminService.getStats();
        logger.devLog("✅ [ADMIN STATS] Stats data retrieved successfully");

        return NextResponse.json(result);
      } catch (error: unknown) {
        logger.error("Admin stats GET error", { error, url: req.url });
        return toApiErrorResponse(error, req.url);
      }
    },
    (res) => res.status,
  );
}

