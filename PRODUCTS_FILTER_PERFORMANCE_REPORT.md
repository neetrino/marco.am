# PRODUCTS Filter Performance Report

## 1) What Was Slow Before

- Product listing path was doing significant **in-memory filtering/sorting** after DB fetches (`price`, `brand`, `colors`, `sizes`), which caused over-fetching and high CPU work in Node.
- Query execution loaded heavy nested relations for PLP (`translations`, deep variant option trees, categories, optional product attributes), even when the listing UI did not need all of that data.
- Some query paths used over-fetch (`limit * 10`, up to 200) and then filtered/sorted in memory.
- `PriceFilter` triggered an extra uncached API call (`_ts` cache-busting) on mount even though filter metadata was already available from the existing filters payload.
- `ProductsGrid` maintained extra derived state and re-sorted in effects, causing additional renders/work on large lists.

## 2) What Files Were Changed

- `src/lib/services/products-find-query/query-builder.ts`
- `src/lib/services/products-find-query/query-executor.ts`
- `src/lib/services/products-find-query.service.ts`
- `src/lib/services/products-find.service.ts`
- `src/lib/services/products-find-transform.service.ts`
- `src/lib/services/products-filters.service.ts`
- `src/app/api/v1/products/route.ts`
- `src/lib/cache/parse-products-list-filters.ts`
- `src/lib/constants/shop-plp-pagination.ts`
- `src/app/products/ProductsShopStreamedSection.tsx`
- `src/components/PriceFilter.tsx`
- `src/components/ProductsGrid.tsx`
- `src/components/ProductCard.tsx`
- `src/lib/push-shop-products-listing-url.ts`
- `shared/db/prisma/schema.prisma`
- `shared/db/prisma/migrations/20260529121000_products_listing_perf_indexes/migration.sql`

## 3) Backend/API Optimizations Added

- Moved primary listing filters into DB `where` clauses:
  - `brand`
  - `minPrice` / `maxPrice`
  - `colors`
  - `sizes`
  - existing `category`, `search`, `filter` handling kept
- Added a lean listing query path (`select`-based) for products listing to reduce payload and serialization overhead.
- Reduced unnecessary in-memory filtering in `products-find.service` when DB-backed pagination/count is available.
- Added stricter page-size clamping for PLP (`SHOP_PLP_MAX_PAGE_SIZE = 60`) and reused it in query parsing + `/products` page.
- Updated `/api/v1/products` response to include:
  - `items`
  - `pagination`
  - `filters.availableCategories`
  - `filters.availableBrands`
  - while preserving legacy `data` + `meta` aliases for compatibility.

## 4) Frontend/Render Optimizations Added

- `PriceFilter` now consumes price range from already-fetched filter context instead of making a second standalone request.
- `ProductsGrid` switched from effect+state derived sorting to `useMemo` for cheaper recomputation and fewer renders.
- `ProductCard` wrapped with `memo` and callback handlers (`useCallback`) to reduce unnecessary child updates when parent re-renders with stable props.
- Product listing navigation helper now wraps route updates in `startTransition` to keep UI interactions responsive during filter/sort URL changes.

## 5) Database Indexes Added

### Prisma schema indexes

- `Product`
  - `@@index([primaryCategoryId])`
  - `@@index([published, deletedAt, createdAt(sort: Desc)])`
- `ProductTranslation`
  - `@@index([locale, title])`
- `ProductVariant`
  - `@@index([published, price])`
  - `@@index([productId, published, price])`
- `ProductVariantOption`
  - `@@index([attributeKey, value])`

### Migration

- Added safe additive migration:
  - `shared/db/prisma/migrations/20260529121000_products_listing_perf_indexes/migration.sql`
  - Uses `CREATE INDEX IF NOT EXISTS` only (non-destructive).

## 6) How To Test the Result

## Automated checks run

- `pnpm run lint` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm run build` ✅

## API behavior smoke checks run locally

- No filters:
  - `GET /api/v1/products?limit=24` ✅
- Category filter:
  - `GET /api/v1/products?category=phones&limit=24` ✅ (valid response; empty for this dataset/category combo)
- Price filter:
  - `GET /api/v1/products?minPrice=10000&maxPrice=500000&limit=24` ✅
- Search:
  - `GET /api/v1/products?search=iphone&limit=24` ✅
- Combined filters + pagination:
  - `GET /api/v1/products?search=iphone&brand=apple&minPrice=100000&maxPrice=800000&page=2&limit=24` ✅

## Manual UI test checklist (recommended)

- Open `/products` without filters and confirm first paint + list load speed.
- Apply category filter; confirm URL sync and responsive update.
- Apply price range; confirm smooth dragging and no extra standalone range request.
- Apply search and combined filters; confirm pagination updates and no UI freezing.
- Navigate pages (or infinite behavior if enabled) and verify stable performance.
- Test mobile layout/filter drawer interactions on narrow viewport.

## 7) Risks / Follow-Up Recommendations

- Color/size DB filtering currently relies on variant option data shape and case-insensitive matching; if legacy data is inconsistent, add targeted integration tests for edge SKUs.
- `products-filters.service` is still heavy for very large catalogs; next step is to move more facet aggregation to dedicated SQL/group-by queries (especially technical facets).
- Consider adding request-level performance metrics (query durations + cache hit ratio) for `/api/v1/products` and `/api/v1/products/filters`.
- Consider cursor-first pagination for high-page access patterns to avoid deep offset costs at scale.
