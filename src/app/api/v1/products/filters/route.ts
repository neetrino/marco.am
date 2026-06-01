import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { parseTechnicalSpecFiltersFromSearchParams } from "@/lib/services/products-technical-filters";
import { getProductsFiltersCached } from "@/lib/cache/products-filters-redis";

const PRODUCTS_FILTERS_API_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=180";

function parseBooleanFlag(raw: string | null): boolean | undefined {
  if (raw === null) {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    let searchParams: URLSearchParams;
    try {
      const url = req.url || "";
      searchParams = new URL(url).searchParams;
    } catch (urlError) {
      console.error("❌ [PRODUCTS FILTERS] Error parsing URL:", urlError);
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/internal-error",
          title: "Internal Server Error",
          status: 500,
          detail: "Invalid request URL",
          instance: req.url || "",
        },
        { status: 500 }
      );
    }

    const filters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      filter: searchParams.get("filter") || undefined,
      includeCategories: parseBooleanFlag(searchParams.get("includeCategories")),
      categoriesOnly: parseBooleanFlag(searchParams.get("categoriesOnly")),
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
      technicalSpecs: parseTechnicalSpecFiltersFromSearchParams(searchParams),
    };

    const result = await getProductsFiltersCached({
      category: filters.category,
      search: filters.search,
      filter: filters.filter,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      lang: filters.lang,
      technicalSpecs: filters.technicalSpecs,
      includeCategories: filters.includeCategories,
      categoriesOnly: filters.categoriesOnly,
    });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": PRODUCTS_FILTERS_API_CACHE_CONTROL,
      },
    });
  } catch (error: unknown) {
    console.error("❌ [PRODUCTS FILTERS] Error:", error);
    return toApiErrorResponse(error, req.url || "");
  }
}
