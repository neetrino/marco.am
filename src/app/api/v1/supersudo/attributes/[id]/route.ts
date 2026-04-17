import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * DELETE /api/v1/supersudo/attributes/[id]
 * Delete an attribute
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await adminService.deleteAttribute(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ [ADMIN ATTRIBUTES] DELETE Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

