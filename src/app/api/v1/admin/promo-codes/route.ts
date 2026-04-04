import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminPromoService } from "@/lib/services/admin/admin-promo.service";

/**
 * GET /api/v1/admin/promo-codes — list all promo codes
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const list = await adminPromoService.list();
    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "internal", title: "Error", status: 500, detail: err.detail || "Failed to list promo codes" },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST /api/v1/admin/promo-codes — create promo code
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = await adminPromoService.create({
      code: body.code,
      type: body.type,
      value: Number(body.value),
      active: body.active,
      validFrom: body.validFrom ?? null,
      validTo: body.validTo ?? null,
      maxUses: body.maxUses ?? null,
      minOrderAmount: body.minOrderAmount ?? null,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "validation", title: "Error", status: err.status || 500, detail: err.detail || "Failed to create" },
      { status: err.status || 500 }
    );
  }
}
