import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/config/deployment-env";
import { handleArcaCallbackGet } from "@/lib/services/payment-arca.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const localOrderId = searchParams.get("localOrderId");
  const arcaOrderId = searchParams.get("orderId") ?? searchParams.get("mdOrder");

  if (!localOrderId) {
    return NextResponse.redirect(new URL("/checkout?payment=error", getPublicAppUrl()));
  }

  const { redirectPath } = await handleArcaCallbackGet(localOrderId, arcaOrderId);
  return NextResponse.redirect(new URL(redirectPath, getPublicAppUrl()));
}
