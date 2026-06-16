# Կատարված աշխատանքներ — Shop PLP cache և արագացում

Ամփոփում է commit `3f6f293` («products») շրջանակում արված փոփոխությունները։  
Ներառված են միայն իրականացված իրեր, առանց հետագա պլանների կամ խորհուրդների։

---

## 1. Redis cache — ապրանքների ցանկ

| Իր | Ֆայլ(եր) |
|-----|-----------|
| Listing cache key-երի կենտրոնացված builder (`v10`) | `src/lib/cache/products-listing-cache-keys.ts` |
| Count cache key-երի builder (`v1`) | `src/lib/cache/products-listing-cache-keys.ts` |
| Listing scope fingerprint (pagination/sort-ից առանձին count key) | `src/lib/cache/products-listing-scope-fingerprint.ts` |
| Cached `db.product.count` — scope-ով, shared Redis | `src/lib/cache/products-listing-count-redis.ts` |
| TTL policy — default PLP lean listing 300s, featured rails 600s, մնացած 120s | `src/lib/cache/products-listing-count-ttl.ts` |
| Default `/products` (առանց ֆիլտրի, page 1) detection cache policy-ի համար | `src/lib/cache/shop-plp-listing-cache-policy.ts` |
| `products-listing-redis.ts` refactor — key/TTL logic տեղափոխված dedicated մոդուլներ | `src/lib/cache/products-listing-redis.ts` |
| Unit tests cache key-երի և policy-ի համար | `products-listing-cache-keys.test.ts`, `shop-plp-listing-cache-policy.test.ts` |

---

## 2. Query օպտիմիզացիա — lean listing և price sort

| Իր | Ֆայլ(եր) |
|-----|-----------|
| Նոր `plpLeanListing` flag — թեթև PLP query (առանց attributeValue join-ների) | `plp-lean-listing-query.ts`, `types.ts`, `parse-products-list-filters.ts` |
| PLP server listing-ում միացված `plpLeanListing` + `listingOmitProductAttributes` | `ProductsShopListingSection.tsx` |
| Price sort DB path — `groupBy` variant `MIN(price)`-ով, երբ lean listing path-ն ակտիվ է | `price-sorted-listing-ids.ts` |
| `products-find-query.service.ts` — lean query branch, price DB sort path, cached count integration | `products-find-query.service.ts` |
| Tests price sort path-ի համար | `price-sorted-listing-ids.test.ts` |

---

## 3. Server boot — Redis warmup

| Իր | Ֆայլ(եր) |
|-----|-----------|
| Internal POST endpoint cache warm-ի համար | `src/app/api/v1/internal/warm-storefront-listing/route.ts` |
| Auth — `WARMUP_INTERNAL_SECRET` header կամ localhost hostname | նույն route |
| Warmup orchestration — home rails + default PLP + public shop caches | `storefront-listing-warmup.ts` |
| Default PLP Redis prime (`hy`, `en`, page 1, lean flags) | `warm-shop-plp-cache.ts` |
| Loopback fetch trigger (instrumentation-ից, առանց ioredis import chain) | `trigger-storefront-listing-warmup.ts` |
| `instrumentation.ts` — JWT secret guard + delayed warmup schedule | `instrumentation.ts` |
| Env flags — `HOME_CACHE_WARMUP`, `CACHE_WARM_ON_START`, `HOME_CACHE_WARMUP_DELAY_MS` | `.env.example` (մասնակի) |

---

## 4. API params — storefront PLP

| Իր | Ֆայլ(եր) |
|-----|-----------|
| Server-aligned query params builder (`lang`, `plpLeanListing`, `listingOmitProductAttributes`, `compact`, default `limit`) | `shop-products-listing-api-params.ts` |
| Test | `shop-products-listing-api-params.test.ts` |
| Prefetch և client listing-ը օգտագործում են նույն builder-ը | `shop-products-plp-prefetch.ts`, `ProductsShopListingClient.tsx` |

---

## 5. `/products` էջ — streaming և client cache

| Իր | Ֆայլ(եր) |
|-----|-----------|
| Page shell — header անմիջապես, body Suspense-ով | `page.tsx`, `loading.tsx` |
| Streamed section — filters + listing parallel Suspense | `ProductsShopStreamedSection.tsx` |
| Server listing section — Redis cached fetch lean flags-ով | `ProductsShopListingSection.tsx` |
| Client-only section (առանց server cookies/RSC data fetch) | `ProductsShopClientSection.tsx`, `ProductsShopClientListing.tsx` |
| Client URL context resolver | `products-shop-listing-client-context.ts` |
| Listing client — session cache read/write, optimistic filter, API params builder | `ProductsShopListingClient.tsx` (refactor) |
| Default page size 21, max 60, PDP sync batch size 8 | `shop-plp-pagination.ts` |

---

## 6. Client prefetch և navigation

| Իր | Ֆայլ(եր) |
|-----|-----------|
| `GlobalRoutePrefetch` — marketing routes staggered prefetch, idle warm products/brands/reels | `GlobalRoutePrefetch.tsx` |
| Link interaction prefetch — pointerdown/focusin, same-origin check, `/api/` block | նույն ֆայլ |
| `warmShopProductsClientCaches` — listing + filters session cache, dedupe in-flight | `shop-products-plp-prefetch.ts` |
| Brands page — client component (`'use client'`), loading skeleton | `brands/page.tsx`, `brands/loading.tsx`, `BrandsPageContent.tsx` |

---

## 7. PLP → PDP cache sync

| Իր | Ֆայլ(եր) |
|-----|-----------|
| Viewport-based PDP cache seed — IntersectionObserver + MutationObserver | `use-plp-viewport-pdp-sync.ts` |
| `data-plp-slug` attribute product card-ներում observer-ի համար | `ProductsGrid.tsx` |
| Listing client-ում hook integration | `ProductsShopListingClient.tsx` |

---

## 8. Այլ կապված փոփոխություններ

| Իր | Ֆայլ(եր) |
|-----|-----------|
| About / Contact — client page export pattern (`'use client'`) | `about/page.tsx`, `contact/page.tsx` |
| Reels cache fallback — minor tweak | `ReelsPageCacheFallback.tsx` |
| `cache.service.ts` — cache backend improvements | `cache.service.ts` |
| Product listing query limits constant update | `product-listing-query-limits.ts` |

---

## Նոր env փոփոխականներ (օգտագործվող)

| Փոփոխական | Նշանակություն |
|------------|----------------|
| `HOME_CACHE_WARMUP` | `false` — անջատել boot warmup |
| `CACHE_WARM_ON_START` | `1` — force warmup |
| `HOME_CACHE_WARMUP_DELAY_MS` | Warmup delay after boot (default 2000) |
| `WARMUP_INTERNAL_SECRET` | Internal warmup endpoint secret header |

---

*Վերջին թարմացում՝ 2026-06-16 · commit `3f6f293`*
