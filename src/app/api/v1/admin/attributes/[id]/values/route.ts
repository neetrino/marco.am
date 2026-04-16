import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * POST /api/v1/admin/attributes/[id]/values
 * Add a new value to an attribute
 */
export async function POST(
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
    const result = await adminService.addAttributeValue(id, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ [ADMIN ATTRIBUTE VALUES] POST Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

