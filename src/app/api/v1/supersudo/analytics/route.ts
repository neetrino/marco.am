import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * Force dynamic rendering for this route
 * Prevents Next.js from statically generating this route
 */
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/supersudo/analytics
 * Get analytics data for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    logger.devLog("📊 [ANALYTICS] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      logger.devLog("❌ [ANALYTICS] Unauthorized or not admin");
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    logger.devLog(`✅ [ANALYTICS] User authenticated: ${user.id}, period: ${period}`);
    const result = await adminService.getAnalytics(period, startDate, endDate);
    logger.devLog("✅ [ANALYTICS] Analytics data retrieved successfully");
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin analytics GET error", { error, url: req.url });
    return toApiErrorResponse(error, req.url);
  }
}

