import { NextRequest, NextResponse } from "next/server";
import { handleIdramBrowserReturn } from "@/lib/payments/idram/handle-result";

export const runtime = "nodejs";

function resolveOrderNumber(request: NextRequest): string | null {
  const params = request.nextUrl.searchParams;
  return (
    params.get("EDP_BILL_NO")?.trim() ||
    params.get("order")?.trim() ||
    params.get("bill")?.trim() ||
    null
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { redirectUrl } = await handleIdramBrowserReturn({
    orderNumber: resolveOrderNumber(request),
    success: false,
  });
  return NextResponse.redirect(redirectUrl, 302);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
