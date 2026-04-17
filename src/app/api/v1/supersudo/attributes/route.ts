import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/supersudo/attributes
 * Get list of attributes
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

    const result = await adminService.getAttributes();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [ADMIN ATTRIBUTES] GET Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * POST /api/v1/supersudo/attributes
 * Create a new attribute
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
    const result = await adminService.createAttribute(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ [ADMIN ATTRIBUTES] POST Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

