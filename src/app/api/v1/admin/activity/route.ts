import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/activity
 * Get recent activity for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📋 [ACTIVITY] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      console.log("❌ [ACTIVITY] Unauthorized or not admin");
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

    // Get limit from query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    console.log(`✅ [ACTIVITY] User authenticated: ${user.id}, limit: ${limit}`);
    const result = await adminService.getActivity(limit);
    console.log("✅ [ACTIVITY] Activity data retrieved successfully");
    
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    console.error("❌ [ACTIVITY] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}


