# Production Rollout Runbook (Architecture & Performance Remediation)

This runbook provides a safe execution order for deploying the recent performance and architecture updates.

## Scope

- API telemetry and request-duration headers for hotspot routes
- Checkout guardrails (validation + rate limit)
- Admin auth edge-gating improvements
- DB indexing migration (`20260610142000_perf_indexes_orders_search`)
- Frontend request dedup/refetch optimizations
- Category-count query optimizations

## Preconditions

- CI checks pass (`tsc`, lint, tests if enabled)
- Access to production DB credentials (`DATABASE_URL`, `DIRECT_URL`)
- Deployment window approved
- Monitoring dashboards open (app latency, DB CPU/connections, error rate)

## Step 1 — Pre-deploy validation (local/staging)

1. Typecheck:
   - `pnpm -s tsc --noEmit`
2. Confirm migration state in target environment:
   - `pnpm --filter @white-shop/db run db:migrate:deploy`
   - `pnpm --filter @white-shop/db exec prisma migrate status --schema prisma/schema.prisma`
3. Smoke key endpoints in staging:
   - `GET /api/v1/products?compact=1`
   - `GET /api/v1/products/filters`
   - `POST /api/v1/orders/checkout` (invalid payload -> 400)
   - `GET /api/search/instant?q=...`

## Step 2 — Deploy order

1. Deploy application build (without traffic shift if your platform supports staged rollout).
2. Apply DB migration:
   - `pnpm --filter @white-shop/db run db:migrate:deploy`
3. Shift traffic gradually (10% -> 25% -> 50% -> 100%), pausing after each step for verification.

## Step 3 — Post-deploy smoke checks

- Auth/security:
  - Admin route with non-admin user -> 403
  - Invalid token -> 401
- Checkout:
  - Valid flow still succeeds
  - Burst invalid requests trigger 429 rate limit
- Public APIs:
  - `products`, `filters`, `search` return expected payloads
  - `X-Route-Duration-Ms` header present on instrumented routes

## Step 4 — Performance verification (first 30-60 minutes)

Track and compare to pre-deploy baseline:

- `/api/v1/products` p95 latency
- `/api/v1/products/filters` p95 latency
- `/api/search/instant` p95 latency
- `/api/v1/orders/checkout` p95 + 4xx/5xx rates
- DB connection usage and CPU
- Duplicate request rates on PLP/cart/wishlist/compare user journeys

If severe regression appears, execute rollback immediately.

## Rollback plan

### App rollback

1. Roll back app deployment to previous stable release.
2. Validate critical endpoints and auth paths.

### DB rollback strategy

- Current migration adds indexes and `pg_trgm` extension; these are additive and generally safe.
- If rollback is needed for DB-level impact:
  - Keep migration applied (preferred) while rolling back app first.
  - Only remove indexes manually if a proven issue is tied directly to index behavior.

## Incident thresholds (recommended)

Trigger rollback/escalation if any of the following hold for more than 10 minutes:

- p95 latency regression > 40% on key endpoints
- 5xx error rate > 2% sustained
- Checkout failure rate materially above baseline
- DB saturation (connections/CPU) causing cascading route timeouts

## Ownership checklist

- Release owner assigned
- DB owner on standby
- Monitoring owner on standby
- Communication channel prepared (status updates every 10-15 minutes during rollout)
