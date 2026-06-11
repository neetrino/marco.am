import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * POST /api/v1/supersudo/attributes/reorder
 * Reorder attributes by drag-and-drop.
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
        { status: 403 },
      );
    }

    const body = await req.json();
    const attributeId = typeof body?.attributeId === "string" ? body.attributeId.trim() : "";
    const targetAttributeId =
      typeof body?.targetAttributeId === "string" ? body.targetAttributeId.trim() : "";

    if (!attributeId || !targetAttributeId) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/bad-request",
          title: "Invalid request",
          status: 400,
          detail: "attributeId and targetAttributeId are required",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const result = await adminService.reorderAttributes({
      attributeId,
      targetAttributeId,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 },
    );
  }
}
