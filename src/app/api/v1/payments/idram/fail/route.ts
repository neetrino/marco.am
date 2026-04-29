import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/config/deployment-env";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber =
    searchParams.get("order_number") ??
    searchParams.get("EDP_BILL_NO") ??
    searchParams.get("bill_no");

  const base = getPublicAppUrl();
  if (orderNumber) {
    return NextResponse.redirect(
      new URL(`/orders/${encodeURIComponent(orderNumber)}?payment=failed`, base)
    );
  }
  return NextResponse.redirect(new URL("/checkout?payment=failed", base));
}
