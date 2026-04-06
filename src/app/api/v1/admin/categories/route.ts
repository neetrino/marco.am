import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/categories
 * Get list of categories
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

    const result = await adminService.getCategories();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [ADMIN CATEGORIES] GET Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * POST /api/v1/admin/categories
 * Create a new category
 */
export async function POST(req: NextRequest) {
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
    console.log("📤 [ADMIN CATEGORIES] POST request:", body);

    const result = await adminService.createCategory(body);
    console.log("✅ [ADMIN CATEGORIES] Category created:", result.data.id);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ [ADMIN CATEGORIES] POST Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

