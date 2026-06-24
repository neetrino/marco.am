# Single-Product Migration Plan

> Goal: remove product variant variability from the system entirely. Every product
> becomes a single sellable unit (its own price / stock / SKU). Attributes are kept
> **only as product-level filtering metadata** (color, size, technical specs).
>
> Context: project is **not in production yet**, real catalog is effectively
> single-product (existing variants are placeholders).
>
> **Source of truth = the current database**, not the Excel source. Products and
> categories were hand-curated directly in the DB, so the migration is **in-place
> data backfill** (move variant fields onto product), **not** a reset + Excel
> re-import. Excel/JSON is used only as a pre-migration backup.

**Status:** Proposal — awaiting approval before touching schema / public contracts.
**Owner:** —
**Created:** 2026-06-23

---

## 1. Why

- The storefront hot paths (PLP, PDP, search, home) already read **flat read-models**
  (`product_listing_rows`, `product_pdp_rows`), so variants give **no runtime speed
  benefit** to the live site.
- Variants do add a large maintenance surface: variant builder/generation/conversion/
  validation in admin, PDP variant selection + attribute groups + image switching,
  and `variantId` coupling in cart/orders/checkout.
- Removing variants → simpler schema, simpler admin, cheaper read-model rebuild,
  fewer joins. The win is **simplicity & maintainability**, with a minor build/rebuild
  speed gain.

## 2. Scope

**In scope:** schema, import/seed, read-model builders, cart, orders, checkout, PDP,
admin product editor, attribute model (filter-only), dead-code cleanup.

**Out of scope:** pricing rules (global/category/brand discounts) stay as-is;
filtering UX stays as-is (already token-based in the read-model).

---

## 3. Target data model

### Move sellable-unit fields from `ProductVariant` → `Product`

`Product` gains:

- `sku String? @unique`
- `barcode String?`
- `price Float`
- `compareAtPrice Float?`
- `cost Float?`
- `stock Int @default(0)`
- `stockReserved Int @default(0)`
- `weightGrams Int?`
- `imageUrl String?` (or keep gallery in `media` only — decide in Phase 1)

### Drop tables

- `ProductVariant` (`product_variants`)
- `ProductVariantOption` (`product_variant_options`)

### Attributes become filter-only

- Keep `Attribute`, `AttributeValue`, translations (filter dictionary).
- Replace variant-option linkage with a **product ↔ attribute value** join:
  - New model `ProductAttributeValue` (`product_attribute_values`):
    `id`, `productId`, `attributeValueId`, unique `(productId, attributeValueId)`,
    indexes on both FKs.
  - This feeds `colorTokens` / `sizeTokens` / `technicalSpecTokens` in the read-model.
- `ProductAttribute` (product ↔ attribute) can stay as the "which attributes apply"
  link, or be folded into the value join — decide in Phase 1.

### Cart / Orders decouple from variants

- `CartItem`: drop `variantId` + its relation/index; keep `productId`.
- `OrderItem`: drop `variantId` + relation/index; keep denormalized
  `productTitle` / `sku` / `price` / `imageUrl` (already present). Drop `variantTitle`.

### Read-models

- `ProductListingRow`: drop `defaultVariantId`, `requiresAttributeSelection`
  (single product never requires selection).
- `ProductPdpRow`: payload no longer carries variant arrays / selectors.

---

## 4. Phases

> Each phase should compile + pass typecheck/lint before moving on. The current DB
> is the source of truth → data is **migrated in place (backfill)**, never reset.

### Phase 0 — Backup & audit (before any schema change)
- [ ] Full backup: `pg_dump` (or JSON export) of the current DB. Keep as rollback safety.
- [ ] Audit report: list products with >1 distinct sellable variant (different
      price/stock). Review & resolve manually before the destructive Phase 1c.

### Phase 1 — Schema (DB), in-place backfill
- [ ] **1a (additive):** migration adds **nullable** sellable-unit columns to
      `products` (`price`, `compareAtPrice`, `cost`, `stock`, `stockReserved`, `sku`,
      `barcode`, `weightGrams`, `imageUrl`) and creates `product_attribute_values`.
      Update `product.prisma` / `catalog.prisma` accordingly.
- [ ] **1b (backfill script):** TS + Prisma script that, per product, picks the
      representative variant via existing `pickVariantForListingPrice` logic and writes
      price/stock/sku onto the product; collects distinct attribute values from
      `product_variant_options` (+ `variant.attributes` JSON) into
      `product_attribute_values`. Idempotent + dry-run mode.
- [ ] **1c (destructive):** migration sets `NOT NULL` where required, drops
      `ProductVariant` / `ProductVariantOption`, removes `variantId` from `cart.prisma`
      (`CartItem`) and `order.prisma` (`OrderItem` + `variantTitle`), and drops
      `defaultVariantId` / `requiresAttributeSelection` from `read-models.prisma`.
- [ ] Regenerate Prisma client.

### Phase 2 — Import / Seed (fresh-install path only)
- [ ] `scripts/import-marco-csv-products.cjs` + `src/scripts/import-marco-csv-products.ts`:
      write price/stock/sku onto product; map attributes → `ProductAttributeValue`.
      (Used for new/empty environments — existing DB is migrated in place, not re-imported.)
- [ ] `shared/db/prisma/seed.cjs`, `seed-apple-product.cjs`, `add-40-products.cjs`.
- [ ] Reconcile/sku scripts: `marco-import-reconcile.cjs`,
      `sync-product-skus-from-xlsx.ts`.

### Phase 3 — Read-model builders
- [ ] `src/lib/read-model/product-listing-row-builder.ts`: read attributes/price/stock
      from product (+ `ProductAttributeValue`) instead of walking variants.
- [ ] `src/lib/read-model/product-pdp-row-builder.ts`: drop variant payload.
- [ ] `src/lib/read-model/product-read-model-sync.ts`,
      `product-pdp-read-model-sync.ts`: adjust source queries (no variant include).
- [ ] Delete `src/lib/product-variant-listing-pick.ts`,
      `src/lib/product-requires-attribute-selection.ts` (+ tests).
- [ ] Update `product-listing-card-mapper.ts`.

### Phase 4 — Cart / Orders / Checkout
- [ ] `src/lib/services/cart.service.ts`: key items by `productId`; price from product.
- [ ] Guest cart: `src/app/cart/*` (`guest-cart-local`, `guest-cart-catalog-fetch`,
      `apply-optimistic-cart-add`, `cart-fetcher`, `merge-cart-display`, types).
- [ ] `src/lib/services/checkout-guest-items.service.ts`,
      `src/lib/services/cart-reorder.service.ts`, `orders.service.ts`.
- [ ] `src/lib/cart/format-cart-variant-options.ts` → remove/replace.
- [ ] Checkout flow: `src/app/checkout/*`, `src/app/api/v1/orders/checkout/route.ts`.

### Phase 5 — PDP (storefront)
- [ ] Remove variant selector + helpers: `src/app/products/[slug]/utils/variant-*.ts`,
      `hooks/useVariantSelection.ts`, `useAttributeGroups.ts`, `build-attribute-groups-*`,
      `image-switching.ts`, `stock-calculator.ts`.
- [ ] Simplify `useProductPage.ts`, `ProductPageClient.tsx`,
      `ProductInfoAndActions.tsx`, `ProductAttributesSelector.tsx` (→ show specs only).
- [ ] `src/components/hooks/useAddToCart.ts`: add by `productId` directly.

### Phase 6 — Admin product editor
- [ ] Remove variant UI: `VariantBuilder.tsx`, `useVariantGeneration.ts`,
      `useProductVariantConversion.tsx`, `useVariantConversionToFormData.ts`,
      `useVariantValidation.ts`, `variantImageCollector.ts`,
      `variantAttributeExtraction.ts`, `colorDataBuilder.ts`.
- [ ] `PricingInventorySection.tsx`: price/stock/sku on the product.
- [ ] `AttributesSelection.tsx`: attributes = filter checkboxes (no per-variant values).
- [ ] Services: `admin-products-create.service.ts`,
      `admin-products-update/*` (`variant-processor`, `variant-updater`,
      `attribute-value-updater`, `product-updater`), `admin-products-read/*`
      (`variant-formatter`, `query-executor`, `product-formatter`).
- [ ] Admin types & form state/handlers under `src/app/supersudo/products/add/*`.
- [ ] Stock analytics: `admin-stats/stock-analytics.ts`,
      `StockVariantTable.tsx` (rename → product-level), `top-products.ts`.

### Phase 7 — Cleanup
- [ ] Remove dead types: `src/types/product-variant-for-conversion.ts`,
      variant fields in `src/app/products/[slug]/types.ts`, `cart/types.ts`,
      `profile/types.ts`, `orders/[number]/types.ts`, etc.
- [ ] Remove variant strings from locales (`en/ru/hy` admin/common/product json).
- [ ] Grep `variant` repo-wide → confirm only intentional residue remains.
- [ ] Update docs that describe variant model.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Wide blast radius (many files reference `variant`) | Phased, compile after each phase; keep PRs per phase. |
| Losing hand-curated DB data | DB is source of truth → in-place backfill (Phase 1b), never reset/re-import. Full `pg_dump` backup in Phase 0. |
| Order history shape change | `OrderItem` keeps denormalized snapshot fields (`sku`/`title`/`price`/`imageUrl`); only `variantId` link is dropped. |
| Filtering regressions (color/size/specs) | Read-model tokens unchanged; backfill `product_attribute_values`; cover with builder tests. |
| Hidden multi-variant products | Phase 0 audit report lists them for manual resolution **before** the destructive Phase 1c. |

## 6. Rollback

Work on a feature branch; each phase is a separate commit/PR. The additive Phase 1a and
backfill 1b are non-destructive (old variant tables still intact). If something is wrong
before Phase 1c, just revert the branch. After Phase 1c, restore from the Phase 0
`pg_dump` backup + revert the branch.

## 7. Open decisions (confirm in Phase 1)

1. Keep `Product.imageUrl` or rely solely on `Product.media` gallery?
2. Keep `ProductAttribute` (applies-to link) alongside `ProductAttributeValue`, or fold into one?
3. Keep `OrderItem.sku` required vs optional once variant SKU is gone.
