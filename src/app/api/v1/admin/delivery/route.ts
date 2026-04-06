import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { getErrorLogFields } from "@/lib/types/errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/delivery
 * Get delivery settings
 */
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
        { status: 403 }
      );
    }

    console.log("🚚 [ADMIN DELIVERY] GET request");
    const settings = await adminService.getDeliverySettings();
    console.log("✅ [ADMIN DELIVERY] Delivery settings fetched");

    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error("❌ [ADMIN DELIVERY] GET Error:", {
      ...getErrorLogFields(error),
      fullError: error,
    });
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * PUT /api/v1/admin/delivery
 * Update delivery settings
 */
export async function PUT(req: NextRequest) {
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
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log("🚚 [ADMIN DELIVERY] PUT request:", body);

    const settings = await adminService.updateDeliverySettings(body);
    console.log("✅ [ADMIN DELIVERY] Delivery settings updated");

    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error("❌ [ADMIN DELIVERY] PUT Error:", {
      ...getErrorLogFields(error),
      fullError: error,
    });
    return toApiErrorResponse(error, req.url);
  }
}

