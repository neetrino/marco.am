import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { getErrorLogFields } from "@/lib/types/errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * Force dynamic rendering for this route
 * Prevents Next.js from statically generating this route
 */
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/analytics
 * Get analytics data for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📊 [ANALYTICS] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      console.log("❌ [ANALYTICS] Unauthorized or not admin");
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

    console.log(`✅ [ANALYTICS] User authenticated: ${user.id}, period: ${period}`);
    const result = await adminService.getAnalytics(period, startDate, endDate);
    console.log("✅ [ANALYTICS] Analytics data retrieved successfully");
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [ANALYTICS] Error:", {
      ...getErrorLogFields(error),
      url: req.url,
    });
    return toApiErrorResponse(error, req.url);
  }
}

