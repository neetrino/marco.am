import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api/json-error-response";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/supersudo/products/discounts
 * Lightweight list for quick-settings product discounts (id, title, image, price, discountPercent).
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
        { status: 403 },
      );
    }

    const lang = req.nextUrl.searchParams.get("lang")?.trim() || undefined;
    const result = await adminService.getProductDiscountsList(lang);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return jsonErrorResponse(error, req.url);
  }
}
