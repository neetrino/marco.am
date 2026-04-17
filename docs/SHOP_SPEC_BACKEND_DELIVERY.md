# Shop Marco — backend առաջադրանքներ (փուլերով)

> Աղբյուր. `[shop-marco-code-plan.md](./shop-marco-code-plan.md)` (functional spec) — **backend** շերտին և API/CMS պահանջվող կետերը։  
> Ճարտարապետության ամփոփում. `[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)`

**Վերջին թարմացում.** 2026-04-17

**Արվածության գնահատում.** Կոդբազայի աուդիտ (`shared/db/prisma/schema.prisma`, `src/app/api/`**, `src/lib/services/`**) — տոկոսները արտահայտում են **ընթացիկ repo-ում իմպլեմենտացիայի** համապատասխանությունը spec-ի backend պահանջին (ոչ թե դիզայն/QA փուլը)։

---

## Ինչպես թարմացնել առաջընթացը

1. **Առանձին task** — `Կատարման %` սյունակում գրել `0`–`100`։
2. **Կարգավիճակ** — `⬜ Չսկսված`  `🔄 Ընթացիկ`  `✅ Ավարտված` (կամ փոխարինել checkbox-ներով ներքևի աղյուսակներում)։
3. **Փուլի %** — տողում **Փուլի առաջընթաց** — կարող եք դնել **task-ների միջին արժեք** (հաշվարկ՝ բոլոր task-ների % գումար / task-ների քանակ)։

Օրինակ. 4 task՝ 100%, 100%, 50%, 0% → փուլ ≈ **62.5%**։

---

## Ընդհանուր ամփոփ աղյուսակ


| Փուլ | Անվանում                         | Փուլի առաջընթաց |
| ---- | -------------------------------- | --------------- |
| 1    | Infra & API կոնտրակտ             | `100%`          |
| 2    | Գլխավոր էջ (Home) — տվյալներ     | `41%`           |
| 3    | Shop (PLP) — կատալոգ API         | `82%`           |
| 4    | Ապրանքի էջ (PDP) — մանրամասն API | `85%`           |
| 5    | Checkout — պատվեր                | `85%`           |
| 6    | Վճարման եղանակներ                | `50%`           |
| 7    | Օգտատիրոջ հաշիվ (Account)        | `100%`          |
| 8    | Admin — catalog & promos         | `42%`           |
| 9    | Admin — orders                   | `91%`           |
| 10   | Admin — analytics                | `95%`           |
| 11   | Reels                            | `0%`            |
| 12   | Site-wide & i18n (API)           | `62%`           |


**Ընդհանուր նախագծի առաջընթաց (backend).** `~65%` — *(12 փուլերի միջին տոկոս, մոտավոր)*։

---

## Փուլ 1 — Infra & API կոնտրակտ

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                                                      | Կատարման % | Կարգավիճակ |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 1.1 | Հաստատել API կոնտրակտը frontend-ի հետ — REST կամ GraphQL, auth headers, սխալների մոդել                    | 100        | ✅         |
| 1.2 | Միջավայրեր (dev / staging / prod) — env, build/deploy-ին համապատասխան կոնֆիգ (ըստ թիմի պատասխանատվության) | 100        | ✅         |


*Նշումներ.* **1.1 ✅ ավարտված (2026-04-16).** Պաշտոնական կոնտրակտ՝ [`docs/API_CONTRACT.md`](./API_CONTRACT.md) (REST JSON, `Authorization: Bearer <JWT>`, RFC7807-անման `type`/`title`/`status`/`detail`/`instance`), մեքենայական սխեմա՝ [`docs/openapi/shop-api.yaml`](./openapi/shop-api.yaml)։ GraphQL չի օգտագործվում։ Implementation՝ `src/app/api` (ներառյալ `v1`), `src/lib/types/errors.ts`։

**1.2 ✅ ավարտված (2026-04-16).** Env-ի մեկ կետ հանրային URL/CORS-ի համար՝ `src/lib/config/deployment-env.ts` (`APP_ENV`, Vercel-ում `VERCEL_ENV` → preview=staging), `getCorsAllowedOrigin()` — `middleware.ts`-ում, `getPublicAppUrl()` — `src/lib/api-client/url-builder.ts`, health-ում `deployment` դաշտ՝ `GET /api/health`։ Կաղապար և միջավայրերի նկարագրություն՝ [`.env.example`](../.env.example)։ Build/deploy՝ `vercel.json` (`pnpm run build`, `output: standalone` — `next.config.js`), թեստեր՝ `src/lib/config/deployment-env.test.ts`։

---

## Փուլ 2 — Գլխավոր էջ (Home)

**Փուլի առաջընթաց.** `41%`


| ID  | Առաջադրանք (backend)                                                                                                   | Կատարման % | Կարգավիճակ |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 2.1 | Hero / banner — CMS կամ admin-ից կառավարելի կոնտենտ, CTA (ցուցակ, ակտիվություն, կարգ)                                  | 10         | ⬜          |
| 2.2 | Featured products — bestsellers կամ curated list, տվյալներ PDP հղման համար                                             | 85         | 🔄         |
| 2.3 | Promotions / special offers բլոկի տվյալներ                                                                             | 100        | ✅         |
| 2.4 | «Why choose us» — 3–4 առավելություն (warranty, fast delivery, installment, original products) — CMS կամ structured API | 5          | ⬜          |
| 2.5 | Հաճախորդների կարծիքների carousel — rating, տեքստ, լուսանկարներ (եթե կան)                                               | 0          | ⬜          |
| 2.6 | Brand partners — բրենդների մետատվյալներ + լոգո asset URL                                                               | 25         | ⬜          |
| 2.7 | Footer — կոնտակտ, սոց հղումներ, քարտեզ embed, legal/quick links (կոնֆիգ/CMS endpoint)                                  | 5          | ⬜          |
| 2.8 | Reels section (home) — կարճ ցուցակ / նախադիտում կամ deep link դեպի Reels էջ (տես Փուլ 11)                              | 100        | ✅         |


*Նշումներ.* 2.2 — `GET /api/v1/products` + `filter=new|bestseller|featured`։ 2.3 — `GET /api/v1/products` + `filter=promotion` կամ `filter=special_offer` — ակցիայի ապրանքներ՝ ապրանքի `discountPercent > 0`, կատեգորիայի/բրենդի զեղչ admin settings-ից (`categoryDiscounts` / `brandDiscounts`), կամ variant-ում `compareAtPrice > price` (SQL DISTINCT `productId`)։ Home «Հատուկ առաջարկներ» բլոկը կարդում է այս ֆիլտրը; CTA՝ `/products?filter=promotion`։ **Ուշադրություն**՝ միայն **global** զեղչը (առանց ապրանք/կատեգորիա/բրենդ/compare-at) այս ցուցակի մեջ չի ներառվում — ամբողջ կատալոգը չլցնելու համար։ Բրենդները DB-ում են, բայց storefront-ի համար հանրային brands API չի երևում (միայն admin)։

**2.3 ✅ ավարտված (2026-04-16).** `GET /api/v1/products?filter=promotion|special_offer` — տես վերևի *Նշումներ* 2.3 բլոկը; UI՝ `HomeSpecialOffersSection`։

**2.8 ✅ ավարտված (2026-04-16).** Storefront՝ `HomeReelsSection` (գլխավոր) + ներքին `/reels` էջ vertical snap ֆիդ (պաստեր նկարներ, deep link `/reels?i=<index>` home-ի յուրաքանչյուր tile-ից), header-ի «Reels» հղումը՝ `/reels` (ոչ արտաքին URL)։ Սերվերային reels մոդել/API չի ավելացվել — տես Փուլ 11։

---

## Փուլ 3 — Shop (Product listing)

**Փուլի առաջընթաց.** `82%`


| ID  | Առաջադրանք (backend)                                                                 | Կատարման % | Կարգավիճակ |
| --- | ------------------------------------------------------------------------------------ | ---------- | ---------- |
| 3.1 | Ապրանքների ցուցակ API — նկար, անվանում, հիմնական սպեկներ, գին, բրենդ, warranty badge | 90         | 🔄         |
| 3.2 | Sorting — price ASC/DESC, newest, popular                                            | 85         | 🔄         |
| 3.3 | Filters — brand, price range, category                                               | 85         | 🔄         |
| 3.4 | Filters — technical specs (faceted կամ step filters, schema-ից դինամիկ)              | 60         | 🔄         |
| 3.5 | Pagination կամ cursor API — infinite scroll / SEO-ի համար էջավորում                  | 90         | 🔄         |


*Նշումներ.* 3.4 — գունային/չափային ֆիլտրեր variant options/ատրիբուտների հիման վրա կան; լիարժեք generic faceted API բոլոր ատրիբուտների համար spec-ի իմաստով մասնակի է։

---

## Փուլ 4 — Product (PDP)

**Փուլի առաջընթաց.** `85%`


| ID  | Առաջադրանք (backend)                                                                | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------------------------------- | ---------- | ---------- |
| 4.1 | Product gallery — մի քանի պատկերներ, metadata                                       | 90         | 🔄         |
| 4.2 | Կարճ և լիարժեք նկարագրություն (i18n դաշտեր)                                         | 85         | 🔄         |
| 4.3 | Technical specifications table — structured attributes                              | 85         | 🔄         |
| 4.4 | Գնային դաշտեր — current price, old price, discount badge inputs                     | 90         | 🔄         |
| 4.5 | Quantity + Add to cart — զամբյուղի API (կլիենտ state-ի հետ համաձայնեցված)           | 90         | 🔄         |
| 4.6 | Պահեստի կարգավիճակ — in stock / out of stock                                        | 90         | 🔄         |
| 4.7 | Related products — recommendation rule (կատեգորիա/բրենդ/այլ)                        | 55         | 🔄         |
| 4.8 | Reviews — rating aggregate, ցուցակ, review submit (policy + auth, եթե պահանջվում է) | 100        | ✅         |


*Նշումներ.* 4.7 — առաջարկը հիմնականում կլիենտում է (`/api/v1/products` + category, առանց առանձին recommendation endpoint-ի)։

**4.8 ✅ ավարտված (2026-04-16).** `GET /api/v1/products/[slug]/reviews` — վերադարձնում է `{ reviews, aggregate }` (միջին գնահատական, քանակ, աստղերի բաշխում) + հրապարակված կարծիքների ցուցակ։ `POST` — JWT, `policyAccepted: true` (UI-ում checkbox + `/terms` հղում), մարմնում `rating` + `comment`։ Պրոդում կամընտիր `REVIEW_REQUIRE_PURCHASE=true` — կարծիք միայն այն օգտատիրոջ համար, ում մոտ կա չչեղարկված պատվեր ապրանքով (variant → product)։ `reviews.service.ts`, PDP `ProductReviews` / `ReviewSummary` / `useReviews`։

---

## Փուլ 5 — Checkout

**Փուլի առաջընթաց.** `85%`


| ID  | Առաջադրանք (backend)                                                             | Կատարման % | Կարգավիճակ |
| --- | -------------------------------------------------------------------------------- | ---------- | ---------- |
| 5.1 | Պատվերի սևագիր / validate — անուն, ազգանուն, հեռախոս, email, հասցե, նշումներ     | 100        | ✅         |
| 5.2 | Delivery method — ինտեգրացիայի hint (օր. Yandex delivery) + admin business rules | 100        | ✅         |
| 5.3 | Delivery cost և order total — դինամիկ վերահաշվարկ API                            | 100        | ✅         |
| 5.4 | Payment method ընտրություն — card vs cash, order payload                         | 75         | 🔄         |
| 5.5 | Order confirmation — order ID, summary (email/SMS — եթե scope-ում է)             | 60         | 🔄         |
| 5.6 | Validation և error handling — client + server միասնական մոդել                    | 75         | 🔄         |
| 5.7 | Սերվերային գնային վերահսկում — զամբյուղի հետ համաձայնեցում                       | 85         | 🔄         |


*Նշումներ.* `orders.service` checkout-ում գները վերցվում են DB-ից (ոչ թե client snapshot)։ Զեղչը checkout-ում `TODO` է։ Email/SMS հաստատում backend-ում չի երևում։

**5.1 ✅ ավարտված (2026-04-16).** Storefront `CheckoutForm` — անուն/ազգանուն, հեռախոս, email, առաքման հասցե (փողոց + քաղաք, երբ `courier`), նշումներ (`notes`, մինչև 2000 նիշ)։ `POST /api/v1/orders/checkout` մարմնում `firstName`/`lastName`/`notes` + `shippingAddress`։ Սերվեր՝ `Order.notes`, հասցեի JSON (`buildOrderAddressJson` — `firstName`/`lastName`/`addressLine1`/`city`)։

**5.2 ✅ ավարտված (2026-04-16).** Առաքման եղանակի ընտրություն checkout-ում՝ **`pickup`** (խանութից վերցնել) կամ **`courier`** (կուրիերով առաքում) — `CheckoutForm` radio, `shippingMethod` դաշտը API payload-ում։ Հին արժեք **`delivery`** սերվերում նորմալացվում է `courier`-ի (`normalizeShippingMethod` — `src/lib/constants/shipping-method.ts`)։ `courier`-ի դեպքում պահանջվում են հասցե + քաղաք, առաքման արժեքը հաշվարկվում է սերվերում `adminDeliveryService.getDeliveryPrice`-ով (քաղաք, երկիր) — նախադիտում storefront-ում `GET /api/v1/delivery/price`։ Թարգմանություններ՝ `checkout.shipping.courier` / `courierDescription` (hint՝ admin կանոններ / գործընկեր կուրիեր, ոչ թե լիարժեք Yandex API ինտեգրացիա)։

**5.3 ✅ ավարտված (2026-04-16).** **`POST /api/v1/checkout/totals`** — դինամիկ ենթագումար + առաքում + հարկ (0) + ընդհանուր **AMD**-ով (նույն բանաձևը, ինչ `POST /api/v1/orders/checkout` գնահատում է)։ Մարմին՝ `shippingMethod`, `country`/`city` (courier-ի համար), `cartId` (JWT-ով միացնելիս) կամ `items[]` (հյուր)։ Իրականացում՝ `checkoutTotalsService` (`cartService.getCart` զեղչերով միացնելիս, հյուր՝ variant-ի DB գին) + `adminDeliveryService.getDeliveryPrice`։ Storefront՝ `useCheckoutTotals` (debounce) + ամփոփման UI-ը ցուցադրում է արդյունքը; fallback՝ `useOrderSummary`-ում զամբյուղի AMD-ում ենթագումար, եթե POST-ը դեռ չի կանչվել։

---

## Փուլ 6 — Վճարման եղանակներ

**Փուլի առաջընթաց.** `50%`


| ID  | Առաջադրանք (backend)                                                    | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------------------- | ---------- | ---------- |
| 6.1 | Քարտային վճարում — PSP ինտեգրացիա, session/webhook, կարգավիճակների flow | 25         | ⬜          |
| 6.2 | Կանխիկ վճարում — պատվերի մեթոդ, կարգավիճակների flow                     | 75         | 🔄         |


*Նշումներ.* `Payment` գրառում է ստեղծվում; `paymentUrl` և PSP webhook — `TODO`/բացակայում են։

---

## Փուլ 7 — Account (հաճախորդի պրոֆիլ)

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                             | Կատարման % | Կարգավիճակ |
| --- | -------------------------------------------------------------------------------- | ---------- | ---------- |
| 7.1 | Registration / Login — email **կամ** phone, verification flow (եթե պահանջվում է) | 100        | ✅         |
| 7.2 | Order history — կարգավիճակ, reorder entry point-ի տվյալներ                       | 100        | ✅         |
| 7.3 | Reorder — նախորդ պատվերից զամբյուղի prefill / նոր պատվեր                         | 100        | ✅         |
| 7.4 | Address management — shipping հասցեների CRUD                                     | 100        | ✅         |
| 7.5 | Personal data — edit profile, password/security                                  | 100        | ✅         |


*Նշումներ.* 7.3 — `POST /api/v1/orders/{number}/reorder` (JWT) — պատվերի տողերը ավելացվում են զամբյուղում (`cartService.addItem`), հասանելիության սահմաններով (published, stock); պատասխանում `added` / `skipped` + թարմ `cart` (ինչպես `GET /api/v1/cart`)։

**7.2 ✅ ավարտված (2026-04-16, backend ստուգում 2026-04-17).** `GET /api/v1/orders` (JWT) — պատմության ցուցակ՝ `status`, `paymentStatus`, `fulfillmentStatus`, գումարներ, `itemsCount`, `createdAt` (ISO8601), և **`links`**՝ `{ self: { method: GET, href }, reorder: { method: POST, href } }` (href-երը `/api/v1/orders/<number>` և `/api/v1/orders/<number>/reorder`)։ Նույն **`links`** դաշտը ավելացված է `GET /api/v1/orders/[number]` պատասխանին և `GET /api/v1/users/dashboard`-ի `recentOrders` տողերին։ OpenAPI՝ `OrderListResponse` / `CustomerOrderLinks` (`docs/openapi/shop-api.yaml`)։ Սերվերում `page`/`limit` query-ի անվավեր արժեքները (`NaN`, բացասական) անտեսվում են — fallback `1` / `20` (`orders.service.ts` `list`)։ Vitest՝ `src/lib/constants/customer-order-api-paths.test.ts` (3 թեստ) անցել է։

**7.3 ✅ ավարտված (2026-04-16).** `POST /api/v1/orders/[number]/reorder` — նախորդ պատվերի `OrderItem` տողերից զամբյուղի լցում (`src/lib/services/cart-reorder.service.ts` → `cartService.addItem`). Չլրացված տողերը `skipped`-ում են `no_variant` | `variant_not_found` | `unpublished` | `out_of_stock` պատճառներով։ Դատարկ պատվերի դեպքում `400`։

**7.4 ✅ ավարտված (2026-04-16).** Shipping հասցեների CRUD՝ JWT-ով `GET`/`POST /api/v1/users/addresses`, `PUT`/`DELETE /api/v1/users/addresses/[addressId]`, default՝ `PATCH /api/v1/users/addresses/[addressId]/default`։ Zod վալիդացիա (`shipping-address.schema.ts`), սերվերային լոգիկա՝ `shipping-addresses.service.ts` — առաջին հասցեն default, `isDefault: true`-ի դեպքում մյուսները անջատված, default հասցեի նշումը ստուգվում է `userId`-ով (ID-ով կեղծ default անել հնարավոր չէ), ջնջումից հետո մնացածների համար default-ի ապահովում։ `GET /api/v1/users/profile`-ի `addresses` դաշտը նույն մոդելն է։

**7.1 ✅ ավարտված (2026-04-16).** `AUTH_REQUIRE_VERIFICATION` env (`true`/`false`, default `false`) — երբ `true`, գրանցում/մուտքից հետո JWT չի տրվում մինչև OTP հաստատում։ `POST /api/v1/auth/register` կամ `POST /api/v1/auth/login` կարող են վերադարձնել `{ needsVerification, channel, verificationToken }` — 15 րոպե TTL սեսիոն JWT։ `POST /api/v1/auth/verify` (`verificationToken`, `code`) — `{ user, token }` + `emailVerified`/`phoneVerified` թարմացում։ `POST /api/v1/auth/resend-verification` — նոր OTP, 60 վրկ cooldown։ Էլ. փոստ՝ Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), հեռախոս՝ մինչև SMS ինտեգրացիա՝ սերվերային log (dev)։ DB՝ `auth_verification_codes`։ Storefront՝ `/verify` էջ, `AuthContext` OTP քայլ։

**7.5 ✅ ավարտված (2026-04-16).** Անձնական տվյալներ՝ `GET`/`PUT /api/v1/users/profile` — Zod վալիդացիա, `firstName`/`lastName`/`email`/`phone`/`locale` թարմացում (email lowercase), առնվազն մեկ `email` կամ `phone`, միակության ստուգում + `P2002` → 409, email/phone փոփոխության դեպքում `emailVerified`/`phoneVerified` → `false`։ Պատասխանը նույն ձևաչափն է, ինչ `GET`-ը (ներառյալ `addresses`, `roles`)։ Գաղտնաբառ՝ `PUT /api/v1/users/password` (`currentPassword`, `newPassword`) — `usersService.changePassword`։ Կոդ՝ `src/lib/schemas/user-profile.schema.ts`, `src/lib/services/user-profile-update.ts`, `src/app/api/v1/users/profile/route.ts`, `src/app/api/v1/users/password/route.ts`, storefront `/profile` (`usePersonalInfo`, `usePassword`)։

---

## Փուլ 8 — Admin: catalog & promos

**Փուլի առաջընթաց.** `42%`


| ID  | Առաջադրանք (backend)                                                                                                  | Կատարման % | Կարգավիճակ |
| --- | --------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 8.1 | Product CRUD — images, specs, pricing, stock, brand, categories                                                       | 90         | 🔄         |
| 8.2 | Product class — Retail / Wholesale դաշտ SKU/ապրանքի վրա                                                               | 0          | ⬜          |
| 8.3 | Delivery rules — Retail-only → Yandex delivery; Wholesale կամ mixed cart → free delivery (**սերվերային enforcement**) | 25         | ⬜          |
| 8.4 | Promo codes և discounts — rules, limits, date ranges                                                                  | 30         | ⬜          |
| 8.5 | Banner management — slots, scheduling, links                                                                          | 15         | ⬜          |
| 8.6 | Categories management — tree, SEO fields                                                                              | 90         | 🔄         |


*Նշումներ.* 8.2/8.3 — սխեմայում և կոդում retail/wholesale և mixed-cart կանոններ չեն գտնվել։ 8.4 — կան global/category/brand զեղչերի կարգավորումներ; checkout-ում coupon-ը `TODO` է, `couponCode` դաշտը ամբողջությամբ չի կապված։

---

## Փուլ 9 — Admin: orders

**Փուլի առաջընթաց.** `91%`


| ID  | Առաջադրանք (backend)                                        | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------- | ---------- | ---------- |
| 9.1 | Orders list — filters: New, In process, Delivered, Canceled | 85         | 🔄         |
| 9.2 | Order details — line items, customer, payment, delivery     | 90         | 🔄         |
| 9.3 | Order status updates — audit trail կամ timestamp            | 100        | ✅         |
| 9.4 | Admin comment field — internal notes                        | 90         | 🔄         |


*Նշումներ.* `OrderEvent` և `adminNotes` դաշտեր կան։

**9.3 ✅ ավարտված (2026-04-17).** Admin `PUT /api/v1/admin/orders/[id]`-ի ժամանակ կարգավիճակների փոփոխությունները գրանցվում են `order_events`-ում՝ **`changes`** (from/to `status`, `paymentStatus`, `fulfillmentStatus`), `updatedFields`, **`userId`** (ընթացիկ ադմին JWT), ISO **`createdAt`**։ Նույն արժեքի վրա no-op թարմացում event չի ստեղծվում։ `GET /api/v1/admin/orders/[id]` պատասխանում **`auditTrail`**՝ `{ id, type, createdAt, data, actor }` (actor՝ `users`-ից email/անուն)։ Checkout-ի `order_created` event-ը ներառվում է timeline-ում։ Admin UI՝ `OrderDetailsAuditTrail`։ Vitest՝ `audit-trail-lines.test.ts`։

---

## Փուլ 10 — Admin: analytics

**Փուլի առաջընթաց.** `95%`


| ID   | Առաջադրանք (backend)                                          | Կատարման % | Կարգավիճակ |
| ---- | ------------------------------------------------------------- | ---------- | ---------- |
| 10.1 | Sales KPIs — total orders, revenue, AOV                       | 85         | 🔄         |
| 10.2 | Order status breakdown — by status, today / week / month      | 100        | ✅         |
| 10.3 | Product analytics — top 5 best sellers, least selling         | 100        | ✅         |
| 10.4 | Stock analytics — low stock, out of stock lists               | 100        | ✅         |
| 10.5 | Customer analytics — new vs repeat, top customers by spend    | 100        | ✅         |
| 10.6 | Dashboard widgets — today’s sales, monthly sales, top product | 85         | 🔄         |


*Նշումներ.* `admin/stats`, `admin/analytics`, `GET .../admin/analytics/order-status-breakdown`, dashboard երթուղիներ։

**10.2 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics/order-status-breakdown` (JWT + admin) — վերադարձնում է `windows`՝ երեք ժամանակահատված՝ **today** (այս օրը 00:00–23:59:59), **week** (վերջին 7 օրը, ինչպես հիմնական analytics-ի `period=week`), **month** (վերջին 30 օրը) — յուրաքանչյուրում `byStatus`՝ `pending` / `processing` / `completed` / `cancelled` / `other` (ոչ ստանդարտ `status` արժեքներ DB-ում), `totalOrders`, `dateRange` (ISO)։ Հաշվարկը՝ `Order.createdAt`։ Իրականացում՝ `order-status-breakdown.ts`, ամսաթվերի պատուհոն՝ `analytics-date-range.ts`։ Admin Analytics՝ `useAnalytics`-ը զուգահեռ է կանչում analytics-ը և այս endpoint-ը; UI աղյուսակ՝ `OrderStatusBreakdown`։

**10.4 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics/stock` (JWT + admin) — վերադարձնում է `outOfStock` և `lowStock` ցուցակներ (տողեր՝ variant/product/sku/stock, բրենդի անուն ընտրված `locale`-ով, նկարի URL) և `total` հաշվիչներ pagination-ի (`limit`/`offset`) համար։ «Ցածր պաշար»՝ `1 … threshold−1` հատ պաշար (default `threshold=10`, `src/lib/constants/low-stock-threshold.ts`), «Ավարտված»՝ `stock === 0`։ Միայն **published** variant-ներ, **չջնջված** ապրանքներ։

**10.3 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics` (նույն JWT + admin, `period` / `startDate` / `endDate`) — պատասխանում **`topProducts`**՝ **թոփ 5** ապրանք **վաճառված քանակով** (բոլոր variant-ների գումար, ապրանքային ագրեգացիա), **`leastSellingProducts`**՝ **թոփ 5 ամենցածր** արտահայտված քանակով՝ **առանց կրկնվելու** `topProducts`-ի հետ (մնացած ապրանքներից)։ Տողերում՝ `productId`, `title`, `sku` (բազմակի variant-ի դեպքում sentinel `Multiple SKUs`), `totalQuantity`, `totalRevenue`, `orderCount`, `image`։ Կոդ՝ `product-sales-analytics.ts`, `PRODUCT_ANALYTICS_RANK_LIMIT` (`product-analytics.ts`), Admin UI՝ `TopProducts` + `LeastSellingProducts`։ Vitest՝ `product-sales-analytics.test.ts`։

**10.5 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics` պատասխանի մեջ **`customerAnalytics`** — **`newVsRepeat`**՝ նոր հաճախորդներ (առաջին պատվերը երբևէ ընկնում է ընտրած `dateRange`-ում), կրկնվող (պատվեր էր մինչև պատուհանի սկիզբը և նորից պատվերել է պատուհանում), պատվերների քանակներ նոր/կրկնվող բաժանումով, `ordersUnattributed` (առանց `userId` և email), և **`topCustomersBySpend`**՝ մինչև **10** հաճախորդ **վճարված** (`paymentStatus=paid`) պատվերների գումարով ընտրած ժամանակահատվածում (նույն պատուհանը, ինչ KPI եկամուտը)։ Հաճախորդի ինքնություն՝ `userId`, այլապես նորմալացված `customerEmail`։ Կոդ՝ `customer-identity.ts`, `customer-analytics.ts`, `TOP_CUSTOMERS_BY_SPEND_LIMIT`, Admin Analytics UI՝ `CustomerAnalytics`։

---

## Փուլ 11 — Reels

**Փուլի առաջընթաց.** `0%`


| ID   | Առաջադրանք (backend)                                                | Կատարման % | Կարգավիճակ |
| ---- | ------------------------------------------------------------------- | ---------- | ---------- |
| 11.1 | Content source — admin upload vs external URLs, moderation workflow | 0          | ⬜          |
| 11.2 | Vertical feed — մետատվյալներ (URL, poster, order)                   | 0          | ⬜          |
| 11.3 | Like functionality — like/unlike, հաշվարկ օգտատիրոջ համար           | 0          | ⬜          |


*(Mute/Play/Pause — հիմնականում client; եթե view-ներն են պահանջվում analytics-ի համար, ավելացնել առանձին event API։)*

*Նշումներ.* Backend մոդել/API reels-ի համար repo-ում չի երևում (home-ում հավանաբար ստատիկ/կլիենտ)։

---

## Փուլ 12 — Site-wide & i18n (API)

**Փուլի առաջընթաց.** `58%`


| ID   | Առաջադրանք (backend)                                                                                  | Կատարման % | Կարգավիճակ |
| ---- | ----------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 12.1 | Global search — ապրանքներ, կատեգորիաներ; suggest/debounce-ի համար API                                 | 90         | 🔄         |
| 12.2 | Wishlist — persist per user/session                                                                   | 100        | ✅          |
| 12.3 | Compare products — spec diff-ի համար ցուցակ, max N ապրանք                                             | 25         | ⬜          |
| 12.4 | About Us, Contact Us, brand pages — CMS կամ static content API                                        | 15         | ⬜          |
| 12.5 | Legal pages — Privacy, Terms, Refund, Delivery Policy (**per locale**)                                | 15         | ⬜          |
| 12.6 | Contact form — validation, spam protection                                                            | 100        | ✅         |
| 12.7 | i18n — AM primary, RU, EN — թարգմանվող էնտիտիների սխեմա, API-ում locale / `Accept-Language`, fallback | 75         | 🔄         |
| 12.8 | Admin — թարգմանությունների խմբագրում կամ import workflow (եթե պահանջվում է)                           | 70         | 🔄         |
| 12.9 | SEO structured data — backend-ից անհրաժեշտ մետատվյալներ (ըստ frontend պայմանագրի)                     | 70         | 🔄         |


**12.2 ✅ ավարտված (2026-04-17).** Wishlist-ը պահվում է PostgreSQL-ում (`wishlists`, `wishlist_items`)։ Մուտք գործած օգտատիրոջ համար՝ `userId` (մեկ ցուցակ)։ Հյուրի համար՝ `sessionToken` + `Set-Cookie: shop_wishlist_session` (կամ `x-wishlist-session`)։ Միայն **published** և չջնջված ապրանքներ։ `POST /api/v1/wishlist/merge` — հյուրի ցուցակը միացնել JWT օգտատիրոջը (կրկնվող productId-ները բաց են թողնվում)։ OpenAPI՝ `docs/openapi/shop-api.yaml`։

*Նշումներ.* 12.1 — `/api/search/instant`։ 12.2 — **սերվերային persist**՝ `GET`/`POST /api/v1/wishlist`, `DELETE /api/v1/wishlist/{productId}`, `POST /api/v1/wishlist/merge` (JWT) — DB `wishlists` / `wishlist_items`, հյուրի համար `shop_wishlist_session` cookie կամ `x-wishlist-session` header։ 12.3 — հիմնականում localStorage, ոչ թե սերվերային persist։

**12.6 ✅ ավարտված (2026-04-17).** `POST /api/v1/contact` — **Zod** վալիդացիա (`name`, `email`, `subject`, `message` — երկարության վերին սահմաններ), **honeypot** `website` դաշտ (ոչ դատարկ՝ `400` ընդհանուր հաղորդագրությամբ, DB գրառում չի կատարվում), **rate limit**՝ մինչև 5 ուղարկում/ժամ IP-ի հիման վրա (`x-forwarded-for` / `x-real-ip`) — **Upstash Ratelimit** (`UPSTASH_REDIS_REST_*`), այլապես **in-memory** fallback (dev/մեկ instance)։ **Cloudflare Turnstile** — կամընտիր՝ երբ `TURNSTILE_SECRET_KEY` է սահմանված, մարմնում պահանջվում է `turnstileToken` (սերվերը verify-ում է `siteverify` API-ով)։ Կոդ՝ `src/lib/schemas/contact-form.schema.ts`, `contact-rate-limit.service.ts`, `contact-turnstile.service.ts`, `src/app/api/v1/contact/route.ts`։

---

## Նշումներ

- Աղբյուրը `**shop-marco-code-plan.md`**-ն է. frontend-only կետերը (zoom UI, skeleton, և այլն) ներառված չեն, եթե առանձին backend չի պահանջում։
- **QA & launch** փուլի E2E, cross-browser, CWV-ը հիմնականում QA/frontend/ops են. **Monitoring / error tracking** (Sentry, logs) — ըստ թիմի պատասխանատվության, կարող են ավելացվել infra առաջադրանքների մեջ։

