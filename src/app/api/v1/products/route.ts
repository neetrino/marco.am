import { NextRequest, NextResponse } from "next/server";
import { productsService } from "@/lib/services/products.service";
import { cacheService } from "@/lib/services/cache.service";
import { logger } from "@/lib/utils/logger";
import { parseTechnicalSpecFiltersFromSearchParams } from "@/lib/services/products-technical-filters";

const PRODUCTS_CACHE_TTL = 120; // 2 minutes
const FEATURED_CACHE_TTL = 600; // 10 minutes for home featured tabs (new/bestseller/featured)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    const parsedMinPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
    const parsedMaxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
    const hasValidMinPrice =
      typeof parsedMinPrice === "number" && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0;
    const hasValidMaxPrice =
      typeof parsedMaxPrice === "number" && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0;
    const minPrice = hasValidMinPrice ? parsedMinPrice : undefined;
    const maxPrice = hasValidMaxPrice ? parsedMaxPrice : undefined;
    const normalizedMinPrice =
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? maxPrice
        : minPrice;
    const normalizedMaxPrice =
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? minPrice
        : maxPrice;
    const parsedPage = Number(searchParams.get("page"));
    const page =
      Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const parsedLimit = Number(searchParams.get("limit"));

    const idsParam = searchParams.get("ids");
    const productIdsFromQuery =
      idsParam
        ?.split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
        .slice(0, 500) ?? [];

    const limit =
      productIdsFromQuery.length > 0
        ? Math.min(Math.max(productIdsFromQuery.length, 1), 500)
        : Number.isInteger(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, 200)
          : 12;
    const cursor = searchParams.get("cursor") || undefined;

    const technicalSpecs = parseTechnicalSpecFiltersFromSearchParams(searchParams);
    const filters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      filter: searchParams.get("filter") || searchParams.get("filters") || undefined,
      minPrice: normalizedMinPrice,
      maxPrice: normalizedMaxPrice,
      colors: searchParams.get("colors") || undefined,
      sizes: searchParams.get("sizes") || undefined,
      brand: searchParams.get("brand") || undefined,
      sort: searchParams.get("sort") || "createdAt",
      page,
      limit,
      cursor,
      lang: searchParams.get("lang") || "en",
      technicalSpecs,
      productIds: productIdsFromQuery.length > 0 ? productIdsFromQuery : undefined,
    };

    const cacheKey = `products:${searchParams.toString()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached !== null && cached !== undefined) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return NextResponse.json(data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const result = await productsService.findAll(filters);

    const onlyFeatured =
      filters.filter &&
      ["new", "bestseller", "featured", "promotion", "special_offer"].includes(filters.filter) &&
      !filters.category &&
      !filters.search &&
      (filters.limit ?? 12) <= 24;
    const ttl = onlyFeatured ? FEATURED_CACHE_TTL : PRODUCTS_CACHE_TTL;
    await cacheService.setex(cacheKey, ttl, JSON.stringify(result));

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: unknown) {
    logger.error("Products API error", { error });
    const err = error as { type?: string; title?: string; status?: number; detail?: string; message?: string };
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}

