import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsRelatedService } from "@/lib/services/products-related.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const requestedLimit = Number(searchParams.get("limit"));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : undefined;
    const { slug } = await params;
    const result = await productsRelatedService.findBySlug(slug, lang, limit);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
