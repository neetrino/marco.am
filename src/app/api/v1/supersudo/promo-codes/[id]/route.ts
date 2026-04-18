import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { adminService } from "@/lib/services/admin.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function forbid(req: NextRequest) {
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbid(req);
    }
    const { id } = await context.params;
    const result = await adminService.deletePromoCode(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
