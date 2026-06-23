# Single-Product Migration Plan

> Goal: remove product variant variability from the system entirely. Every product
> becomes a single sellable unit (its own price / stock / SKU). Attributes are kept
> **only as product-level filtering metadata** (color, size, technical specs).
>
> Context: project is **not in production yet**, real catalog is effectively
> single-product (existing variants are placeholders). This removes the historical
> data-migration risk and makes a clean cut safe.

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

> Each phase should compile + pass typecheck/lint before moving on. Since not in prod,
> DB is reset & re-seeded rather than data-migrated.

### Phase 1 — Schema (DB)
- [ ] Update `shared/db/prisma/models/product.prisma` (move fields onto `Product`).
- [ ] Add `ProductAttributeValue` model; adjust `catalog.prisma` relations.
- [ ] Remove `ProductVariant` / `ProductVariantOption` models.
- [ ] Update `cart.prisma` (`CartItem` drop `variantId`).
- [ ] Update `order.prisma` (`OrderItem` drop `variantId` / `variantTitle`).
- [ ] Update `read-models.prisma` (drop `defaultVariantId`, `requiresAttributeSelection`).
- [ ] Create migration; reset dev DB (`prisma migrate reset`) — no prod data.
- [ ] Regenerate Prisma client.

### Phase 2 — Import / Seed
- [ ] `scripts/import-marco-csv-products.cjs` + `src/scripts/import-marco-csv-products.ts`:
      write price/stock/sku onto product; map attributes → `ProductAttributeValue`.
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
| Order history shape change | Not in prod → reset DB; `OrderItem` keeps denormalized snapshot fields anyway. |
| Filtering regressions (color/size/specs) | Read-model tokens unchanged; cover with builder tests. |
| Hidden multi-variant products in real data | Confirmed single; add import guard that fails if a source row implies >1 sellable unit. |

## 6. Rollback

Work on a feature branch; each phase is a separate commit/PR. Since DB is reset (no prod),
rollback = revert branch + `prisma migrate reset` to the previous schema.

## 7. Open decisions (confirm in Phase 1)

1. Keep `Product.imageUrl` or rely solely on `Product.media` gallery?
2. Keep `ProductAttribute` (applies-to link) alongside `ProductAttributeValue`, or fold into one?
3. Keep `OrderItem.sku` required vs optional once variant SKU is gone.
