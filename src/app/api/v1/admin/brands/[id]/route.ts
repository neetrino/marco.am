import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * PUT /api/v1/admin/brands/[id]
 * Update a brand
 */
export async function PUT(
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
    const body = await req.json();
    console.log("📤 [ADMIN BRANDS] PUT request:", { id, body });

    const result = await adminService.updateBrand(id, body);
    console.log("✅ [ADMIN BRANDS] Brand updated:", id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [ADMIN BRANDS] PUT Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * DELETE /api/v1/admin/brands/[id]
 * Delete a brand (soft delete)
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
    console.log("🗑️ [ADMIN BRANDS] DELETE request:", id);

    await adminService.deleteBrand(id);
    console.log("✅ [ADMIN BRANDS] Brand deleted:", id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("❌ [ADMIN BRANDS] DELETE Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

