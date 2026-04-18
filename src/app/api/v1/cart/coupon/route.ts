import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { cartService } from "@/lib/services/cart.service";

function unauthorized(req: NextRequest) {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "Authentication token required",
      instance: req.url,
    },
    { status: 401 }
  );
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return unauthorized(req);
    }
    const body = (await req.json()) as { couponCode?: string };
    const result = await cartService.setCouponCode(user.id, body.couponCode ?? "");
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return unauthorized(req);
    }
    const result = await cartService.clearCouponCode(user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
