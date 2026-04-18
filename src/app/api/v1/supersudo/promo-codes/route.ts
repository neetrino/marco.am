import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { adminService } from "@/lib/services/admin.service";

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

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbid(req);
    }
    const records = await adminService.getPromoCodes();
    return NextResponse.json({ promoCodes: records });
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbid(req);
    }
    const body = await req.json();
    const updated = await adminService.upsertPromoCode(body);
    return NextResponse.json({ promoCode: updated });
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
