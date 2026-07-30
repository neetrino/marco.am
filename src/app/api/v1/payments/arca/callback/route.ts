import { NextRequest, NextResponse } from "next/server";
import { handleArcaReturn } from "@/lib/payments/arca/handle-return";

export const runtime = "nodejs";

function resolveBankOrderId(request: NextRequest): string | null {
  const params = request.nextUrl.searchParams;
  return (
    params.get("orderId")?.trim() ||
    params.get("mdOrder")?.trim() ||
    params.get("order")?.trim() ||
    null
  );
}

/** Browser return from IDBank / ArCa — verify via getOrderStatusExtended.do. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { redirectUrl } = await handleArcaReturn({
    bankOrderId: resolveBankOrderId(request),
  });
  return NextResponse.redirect(redirectUrl, 302);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
