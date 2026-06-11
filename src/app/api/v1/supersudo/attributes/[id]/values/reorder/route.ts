import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * POST /api/v1/supersudo/attributes/[id]/values/reorder
 * Reorder values inside one attribute by drag-and-drop.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: attributeId } = await params;
    const body = await req.json();
    const valueId = typeof body?.valueId === "string" ? body.valueId.trim() : "";
    const targetValueId = typeof body?.targetValueId === "string" ? body.targetValueId.trim() : "";

    if (!attributeId || !valueId || !targetValueId) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/bad-request",
          title: "Invalid request",
          status: 400,
          detail: "attributeId, valueId and targetValueId are required",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const result = await adminService.reorderAttributeValues({
      attributeId,
      valueId,
      targetValueId,
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
