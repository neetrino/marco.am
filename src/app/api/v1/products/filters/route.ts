import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsService } from "@/lib/services/products.service";

export async function GET(req: NextRequest) {
  try {
    let searchParams;
    try {
      const url = req.url || '';
      searchParams = new URL(url).searchParams;
    } catch (urlError) {
      console.error("❌ [PRODUCTS FILTERS] Error parsing URL:", urlError);
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/internal-error",
          title: "Internal Server Error",
          status: 500,
          detail: "Invalid request URL",
          instance: req.url || '',
        },
        { status: 500 }
      );
    }

    const filters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      minPrice: (() => {
        const raw = searchParams.get("minPrice");
        const parsed = raw ? Number(raw) : undefined;
        return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0
          ? parsed
          : undefined;
      })(),
      maxPrice: (() => {
        const raw = searchParams.get("maxPrice");
        const parsed = raw ? Number(raw) : undefined;
        return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0
          ? parsed
          : undefined;
      })(),
      lang: searchParams.get("lang") || "en",
    };

    const result = await productsService.getFilters(filters);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [PRODUCTS FILTERS] Error:", error);
    return toApiErrorResponse(error, req.url || '');
  }
}

