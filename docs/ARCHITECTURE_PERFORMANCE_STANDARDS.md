# Architecture & Performance Standards

This document defines implementation guardrails to prevent duplicate requests, oversized responses, and query regressions.

## 1) API Endpoint Standards

- Validate all write payloads with schema at route boundary (`zod`).
- Return one consistent problem JSON shape for failures.
- For list/read endpoints, support selective response modes when needed (`fields=ids`, `compact=1`).
- Every high-traffic endpoint must declare cache intent via headers (`Cache-Control`) and be observable by route metrics.

## 2) Auth & Security Standards

- Admin routes must be edge-gated before handler execution.
- Rate limit all expensive public writes (checkout/auth/contact/upload-like operations).
- JWT claim payload should include role claim for fast edge gating; DB check remains source of truth for blocked/deleted state.

## 3) Data Fetching Standards (Frontend)

- Avoid event-wide refetch storms after optimistic updates.
- Prefer cache mutation (`setQueryData`) + narrow invalidation over global invalidation.
- Reuse shared query keys for logically same resources (cart, membership IDs).
- Only warm route-scoped caches; avoid broad prefetch blasts on every admin/page enter.

## 4) Database & Query Standards

- Prefer SQL aggregates (`count`, `aggregate`, grouped query) for analytics/widgets instead of loading full rows into memory.
- Add indexes based on observed filters/sorts/search patterns.
- Text search paths using `ILIKE` must use trigram indexes (`pg_trgm`) or dedicated search engine.
- Large relation joins should have selective/lean paths for “IDs/count-only” use-cases.

## 5) Caching & Invalidation Standards

- Public GET endpoints should use explicit HTTP cache headers.
- Client API layer should not globally force `no-store` for all GET requests.
- Invalidation must be key-scoped:
  - `auth-updated`: force refresh user-bound keys.
  - `wishlist-updated`/`compare-updated`: update local caches and avoid immediate redundant fetch.
  - `language-updated`: invalidate language-scoped keys only.

## 6) Baseline & Regression Monitoring

- Track per-route metrics for hotspot endpoints:
  - `/api/v1/products`
  - `/api/v1/products/filters`
  - `/api/v1/orders/checkout`
  - `/api/v1/supersudo/analytics`
  - `/api/search/instant`
- Required baseline metrics:
  - p95 response time per route
  - duplicate request ratio per route transition
  - query count per request for hotspot routes
- Every optimization PR should include before/after metric snapshot.
