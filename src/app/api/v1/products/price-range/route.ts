import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsService } from "@/lib/services/products.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      category: searchParams.get("category") || undefined,
      lang: searchParams.get("lang") || "en",
    };

    const result = await productsService.getPriceRange(filters);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [PRODUCTS] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

