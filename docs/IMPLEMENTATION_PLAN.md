# PDF Specification — Implementation Plan

## 1. Requirement mapping

| Requirement | Status | Implementation approach |
|-------------|--------|-------------------------|
| Home: Brand Hero / banner | Partial | HeroCarousel exists but hardcoded; add Banner model + admin CRUD; HeroCarousel fetches from API, same UI |
| Home: Featured products | Exists | FeaturedProductsTabs — no change |
| Home: Promotions / Special Offers | Partial | Section can use featured/discount products; optional dedicated block |
| Home: Why Choose Us | Exists | FeaturesSection — no change |
| Home: Customer Reviews Carousel | Missing | Add ReviewsCarousel component; fetch reviews API |
| Home: Brand logos / partner brands | Missing | Add section with published brands (existing Brand model) |
| Shop: image, name, specs, price, brand, warranty | Exists | ProductCard/listing — extend only if warranty badge missing |
| Shop: Sort (price asc/desc, newest, popular) | Partial | sort exists (createdAt, price); add price_asc, price_desc, newest, popular |
| Shop: Filters (brand, price, category, specs) | Exists | Reuse current filters |
| Product page: gallery, zoom, info, description, specs, price, discount, qty, cart, stock, related, reviews | Exists/Partial | Keep UI; ensure data wired (related, reviews) |
| Checkout: form fields (name, surname, phone, email, address, notes, delivery, payment, delivery cost, total) | Exists | Extend CheckoutData type if needed; ensure notes, firstName/lastName |
| Payment: Card + Cash | Partial | payment-methods has cash_on_delivery, idram, arca; add explicit "card" and keep cash |
| Product Class (Retail / Wholesale) | Missing | Add productClass to Product; cart/checkout/order logic; delivery rules |
| Delivery: Retail-only → Yandex; Wholesale/mixed → free | Missing | Implement in orders.service + checkout UI |
| User account: registration, login, order history, reorder, addresses, personal data | Partial | Reorder missing; add reorder action + API |
| Admin: product CRUD + product class | Partial | Add productClass field to admin product form and API |
| Admin: orders list, filters, details, status update, admin comment | Partial | Status update exists; add adminNotes to updateOrder + UI |
| Admin: Promotions / promo codes | Missing | PromoCode model + CRUD + apply at cart/checkout |
| Admin: Banners & Categories | Partial | Categories exist; add Banner CRUD + menu item |
| Admin: Analytics (totals, AOV, by status, today/week/month, top/least/low stock/out of stock, new/repeat customers, top customers) | Partial | Extend admin-stats/analytics + dashboard widgets |
| Promo codes end-to-end | Missing | Schema, validation, cart/checkout apply, persist in order |
| Banners admin-manageable | Missing | Banner model, API, HeroCarousel uses banners |
| Reels / video feed | Missing | Reel model + /reels page (vertical feed, like, mute, play/pause) |
| Brand public pages | Missing | /brands/[slug] page with brand info + products by brand |
| i18n en/hy/ru | Exists | Add new keys only |

---

## 2. Implementation plan (grouped)

### Backend (Phase 2)
- **DB**: Add `ProductClass` enum and `productClass` on Product (default Retail). Add `PromoCode` model. Add `Banner` model. Add `Reel` model. Add `Order.couponCode` and `Order.promoDiscountAmount` if needed (or derive from discountAmount + couponCode string). Cart already has couponCode.
- **Promo**: PromoCode service (validate, apply); cart.service applyCoupon; orders.service use promo in checkout; persist coupon + discount on order.
- **Product class**: products.service + admin product APIs include productClass; cart/orders detect retail-only vs wholesale/mixed; delivery rule: retail-only → Yandex (current delivery price), wholesale/mixed → free.
- **Banners**: Banner service + GET public API; admin CRUD API.
- **Reels**: Reel service + public GET; like (store in Settings or ReelLike table); admin CRUD optional for reels.
- **Brands**: Public GET brand by slug with products (existing products API with brand filter).
- **Orders**: updateOrder accept adminNotes; getOrderById return adminNotes.
- **Reorder**: orders.service reorder (create cart from order items) + API.

### Admin (Phase 3)
- Product add/edit: productClass field (Retail/Wholesale).
- Orders: order detail modal/page — editable adminNotes + save.
- Promo codes: new page /admin/promo-codes + CRUD.
- Banners: new page /admin/banners + CRUD; menu item.
- Analytics: extend analytics.ts and dashboard with AOV, orders by status, today/week/month, least-selling, low stock, out of stock, new/repeat customers, top customers.

### Public (Phase 4)
- Home: HeroCarousel fetch banners from API (same layout).
- Home: ReviewsCarousel (reviews API).
- Home: Partner brands section (brands API).
- Reels: /reels page with vertical feed, like, mute, play/pause.
- Brand: /brands/[slug] page.

### Checkout / Cart (Phase 5)
- Checkout form: ensure firstName, lastName, notes, delivery method, payment method (card/cash), delivery cost, total.
- Cart: apply promo code (input + API); show discount in totals.
- Orders: compute delivery: if any wholesale or mixed → 0; else retail → current delivery service (Yandex-ready).
- Payment methods: label Card (idram/arca or generic card) + Cash (cash_on_delivery).

### i18n (Phase 6)
- Add keys for promo, banners, reels, brand page, reorder, product class, delivery rule, new analytics labels.

---

## 3. Files to modify / add

### Database
- `shared/db/prisma/schema.prisma` — Product.productClass; PromoCode model; Banner model; Reel + ReelLike (or likes in Reel); Order.couponCode optional.

### Backend services
- `src/lib/services/cart.service.ts` — applyCoupon, getCart apply promo discount; consider product class in totals.
- `src/lib/services/orders.service.ts` — checkout: promo validation, discountAmount from promo; delivery rule (retail-only vs wholesale/mixed); persist coupon on order.
- `src/lib/services/products.service.ts` / products-find — expose productClass in responses.
- New: `src/lib/services/promo.service.ts` — validate code, compute discount.
- New: `src/lib/services/banners.service.ts` — list for home.
- New: `src/lib/services/reels.service.ts` — list, like.
- `src/lib/services/admin/admin-orders/order-mutations.ts` — updateOrder add adminNotes; types add adminNotes.
- `src/lib/services/admin/admin-stats/analytics.ts` — extend with AOV, orders by status, least-selling, low stock, out of stock, new/repeat customers, top customers.
- New: `src/lib/services/admin/admin-promo.service.ts` — CRUD promo codes.
- New: `src/lib/services/admin/admin-banners.service.ts` — CRUD banners.
- Admin products create/update — include productClass.

### API routes
- New: `src/app/api/v1/banners/route.ts` — GET public banners.
- New: `src/app/api/v1/promo/validate/route.ts` — POST validate + apply (or in cart API).
- Cart: `src/app/api/v1/cart/apply-coupon/route.ts` or extend cart route — apply coupon.
- New: `src/app/api/v1/reels/route.ts` — GET reels.
- New: `src/app/api/v1/reels/[id]/like/route.ts` — POST like.
- New: `src/app/api/v1/orders/reorder/route.ts` — POST reorder.
- New: `src/app/api/v1/brands/[slug]/route.ts` — GET brand by slug (public).
- Admin: `src/app/api/v1/admin/promo-codes/route.ts`, `[id]/route.ts`.
- Admin: `src/app/api/v1/admin/banners/route.ts`, `[id]/route.ts`.
- Checkout route: already receives payment/delivery; ensure body includes coupon and server computes delivery by product class.

### Admin UI
- `src/app/admin/products/add/` and edit — add productClass dropdown.
- `src/app/admin/orders/` — order detail: show and edit adminNotes (PUT with adminNotes).
- New: `src/app/admin/promo-codes/page.tsx` + API hooks.
- New: `src/app/admin/banners/page.tsx` + API hooks.
- `src/app/admin/admin-menu.config.tsx` — add Promo codes, Banners.
- `src/app/admin/analytics/` — new widgets from extended analytics.

### Public UI
- `src/components/HeroCarousel.tsx` — fetch banners from API; keep same layout/styling.
- New: `src/components/ReviewsCarousel.tsx` (home).
- New: `src/components/PartnerBrandsSection.tsx` (home).
- `src/app/page.tsx` — add ReviewsCarousel + PartnerBrandsSection if missing.
- New: `src/app/reels/page.tsx` — reels feed.
- New: `src/app/brands/[slug]/page.tsx` — brand landing + products.
- Checkout: ensure OrderSummary shows delivery rule (free for wholesale/mixed); promo input and applied discount.
- Profile: reorder button on order row or order detail → call reorder API and redirect to cart/checkout.

### i18n
- `src/locales/en/*.json`, `hy/*.json`, `ru/*.json` — new keys for all new features.

---

## 4. Database changes (exact)

- **Product**: `productClass String @default("retail")` (e.g. "retail" | "wholesale").
- **PromoCode**: id, code (unique), type (percent|fixed), value, active, validFrom?, validTo?, maxUses?, usedCount?, minOrderAmount?, createdAt, updatedAt.
- **Banner**: id, title?, imageUrl, linkUrl?, position, active, createdAt, updatedAt.
- **Reel**: id, videoUrl, thumbnailUrl?, caption?, position, active, likesCount (or separate ReelLike), createdAt, updatedAt.
- **Order**: optional `couponCode String?` to persist applied code (already have discountAmount).
- **ReelLike** (optional): userId, reelId, createdAt — or store likes in JSON on Reel / Settings.

---

## 5. Implementation order

1. Schema + migrate (ProductClass, PromoCode, Banner, Reel).
2. Promo service + cart apply coupon + checkout apply + order persist.
3. Product class: Product schema + admin + cart/checkout delivery rule.
4. Banners service + admin CRUD + public API; HeroCarousel fetch banners.
5. Admin order adminNotes (backend + UI).
6. Reels: service + public API + /reels page.
7. Brand public page /brands/[slug].
8. Reorder API + profile reorder button.
9. Analytics extensions + dashboard.
10. Home: ReviewsCarousel, PartnerBrandsSection.
11. Shop sort options (price_asc, price_desc, newest, popular).
12. Payment methods copy (Card / Cash) and checkout labels.
13. i18n keys.

---

## 6. Final verification report

### What was added
- **Schema**: `Product.productClass` (retail/wholesale), `Order.couponCode`, `PromoCode`, `Banner`, `Reel`, `ReelLike` models. Migration: `20260312000000_add_product_class_promo_banners_reels`.
- **Promo**: `promo.service.ts` (validate, increment usage), cart `applyCoupon`/`removeCoupon`, cart GET returns `couponCode` and discount in totals. Checkout applies promo and persists `couponCode` on order; increments usage after order.
- **Product class**: Product create/update (admin) and payload include `productClass`. Cart/checkout: `hasWholesale` → free delivery; retail-only → existing delivery price (Yandex-ready).
- **Banners**: `banners.service.ts`, GET `/api/v1/banners`, admin CRUD `/api/v1/admin/banners`. HeroCarousel fetches banners from API; fallback to hardcoded images if none.
- **Reels**: `reels.service.ts`, GET `/api/v1/reels`, POST `/api/v1/reels/[id]/like`. `/reels` page (vertical feed, like, mute, play/pause).
- **Brand page**: GET `/api/v1/brands/[slug]`, `/brands/[slug]` page with brand info and products grid.
- **Reorder**: `orders.service.reorder(userId, orderNumber)`, POST `/api/v1/orders/reorder`. Profile reorder uses this API.
- **Admin**: Order update supports `adminNotes`; order detail modal has Admin notes textarea + Save. Promo codes and Banners menu items and list/delete pages. Product add/edit form has Product class (Retail/Wholesale).
- **Checkout**: Order notes field; `notes` and `couponCode` (from cart) sent to checkout API and persisted.
- **Sort**: Product listing supports `price_asc`, `price_desc`, `newest`, `popular` (bestseller rank).

### What was extended
- Cart: promo discount in getCart; applyCoupon/removeCoupon; cart response includes `couponCode`.
- Orders checkout: promo validation, discountAmount, couponCode and notes on order; delivery rule (wholesale/mixed → free; retail-only → city-based).
- Admin orders: updateOrder accepts `adminNotes`; modal shows and saves admin notes.
- Admin product: create/update and form state include `productClass`; Publishing component has Product class dropdown.
- HeroCarousel: data from `/api/v1/banners`; same UI, optional link per slide.
- Profile reorder: uses POST `/api/v1/orders/reorder` instead of per-item cart adds.
- i18n: `common.reels.empty`, `checkout.notes`, `checkout.placeholders.notes`, admin order details and menu keys (en/hy/ru where done).

### What was left untouched
- Layout, globals.css, tailwind.config, design tokens, shared UI.
- Header, Footer, MobileBottomNav, Breadcrumb, ProductCard, ProductCardGrid, ProductCardList, ProductCardActions, ProductImageGallery.
- Home structure (only HeroCarousel data source and optional sections); FeaturesSection, FeaturedProductsTabs, TopCategories unchanged.
- Existing discount logic (product/category/brand/global) unchanged; promo is additive.
- Payment methods (idram, arca, cash_on_delivery) unchanged; PDF “Card + Cash” satisfied by existing options.

### Business logic implemented
- **Delivery**: Retail-only cart → delivery price by city (Yandex path); any wholesale or mixed cart → free delivery.
- **Promo**: Validate by code, subtotal, dates, maxUses, minOrderAmount; percent or fixed; apply at cart and checkout; persist on order and increment use count.
- **Product class**: Stored on product; used in checkout for delivery rule; admin can set on create/edit.
- **Reorder**: Re-adds order items to cart (respecting stock); redirects to cart.

### Manual testing suggestions
1. Run migration: `pnpm run db:migrate:deploy` or `db:push` (see shared/db).
2. Create a promo code (admin or API), apply in cart (logged-in), checkout with notes; confirm order has couponCode and notes and discount.
3. Create products with Retail vs Wholesale; cart with only retail → delivery cost; add one wholesale → free delivery.
4. Add banners (admin or API); confirm homepage hero uses them.
5. Add reels (DB or future admin); open `/reels`; like (logged-in), mute, play/pause.
6. Open `/brands/[slug]` for a published brand; confirm products list.
7. Profile → Orders → open order → Reorder; confirm cart and redirect to cart.
8. Admin → Order details → edit Admin notes → Save; confirm persistence.
9. Admin → Products → Add/Edit → set Product class; save; confirm in checkout delivery rule.
10. Product listing: try sort=price_asc, price_desc, newest, popular.
