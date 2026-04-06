import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * PATCH /api/v1/admin/attributes/[id]/translations
 * Update attribute translation (name)
 */
export async function PATCH(
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

    const { id: attributeId } = await params;
    const body = await req.json();

    console.log('✏️ [ADMIN ATTRIBUTE TRANSLATIONS] PATCH request:', { attributeId, body });

    const result = await adminService.updateAttributeTranslation(attributeId, {
      name: body.name,
      locale: body.locale || "en",
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ [ADMIN ATTRIBUTE TRANSLATIONS] PATCH Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}




