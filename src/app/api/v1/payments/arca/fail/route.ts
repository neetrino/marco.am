import { NextRequest, NextResponse } from "next/server";
import { handleArcaFail } from "@/lib/payments/arca/handle-return";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { redirectUrl } = await handleArcaFail({
    bankOrderId: resolveBankOrderId(request),
  });
  return NextResponse.redirect(redirectUrl, 302);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
