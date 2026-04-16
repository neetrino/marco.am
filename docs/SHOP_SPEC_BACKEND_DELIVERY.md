# Shop Marco — backend առաջադրանքներ (փուլերով)

> Աղբյուր. `[shop-marco-code-plan.md](./shop-marco-code-plan.md)` (functional spec) — **backend** շերտին և API/CMS պահանջվող կետերը։  
> Ճարտարապետության ամփոփում. `[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)`

**Վերջին թարմացում.** 2026-04-16

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
| 2    | Գլխավոր էջ (Home) — տվյալներ     | `23%`           |
| 3    | Shop (PLP) — կատալոգ API         | `82%`           |
| 4    | Ապրանքի էջ (PDP) — մանրամասն API | `84%`           |
| 5    | Checkout — պատվեր                | `70%`           |
| 6    | Վճարման եղանակներ                | `50%`           |
| 7    | Օգտատիրոջ հաշիվ (Account)        | `82%`           |
| 8    | Admin — catalog & promos         | `42%`           |
| 9    | Admin — orders                   | `88%`           |
| 10   | Admin — analytics                | `75%`           |
| 11   | Reels                            | `0%`            |
| 12   | Site-wide & i18n (API)           | `50%`           |


**Ընդհանուր նախագծի առաջընթաց (backend).** `~51%` — *(12 փուլերի միջին տոկոս, մոտավոր)*։

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

**Փուլի առաջընթաց.** `23%`


| ID  | Առաջադրանք (backend)                                                                                                   | Կատարման % | Կարգավիճակ |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 2.1 | Hero / banner — CMS կամ admin-ից կառավարելի կոնտենտ, CTA (ցուցակ, ակտիվություն, կարգ)                                  | 10         | ⬜          |
| 2.2 | Featured products — bestsellers կամ curated list, տվյալներ PDP հղման համար                                             | 85         | 🔄         |
| 2.3 | Promotions / special offers բլոկի տվյալներ                                                                             | 35         | 🔄         |
| 2.4 | «Why choose us» — 3–4 առավելություն (warranty, fast delivery, installment, original products) — CMS կամ structured API | 5          | ⬜          |
| 2.5 | Հաճախորդների կարծիքների carousel — rating, տեքստ, լուսանկարներ (եթե կան)                                               | 0          | ⬜          |
| 2.6 | Brand partners — բրենդների մետատվյալներ + լոգո asset URL                                                               | 25         | ⬜          |
| 2.7 | Footer — կոնտակտ, սոց հղումներ, քարտեզ embed, legal/quick links (կոնֆիգ/CMS endpoint)                                  | 5          | ⬜          |
| 2.8 | Reels section (home) — կարճ ցուցակ / նախադիտում կամ deep link դեպի Reels էջ (տես Փուլ 11)                              | 15         | ⬜          |


*Նշումներ.* 2.2 — `GET /api/v1/products` + `filter=new|bestseller|featured`։ 2.3 — զեղչերի լոգիկան կա կատալոգի/կարգավորման մակարդակում, առանձին «promo block» API չկա։ Բրենդները DB-ում են, բայց storefront-ի համար հանրային brands API չի երևում (միայն admin)։

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

**Փուլի առաջընթաց.** `84%`


| ID  | Առաջադրանք (backend)                                                                | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------------------------------- | ---------- | ---------- |
| 4.1 | Product gallery — մի քանի պատկերներ, metadata                                       | 90         | 🔄         |
| 4.2 | Կարճ և լիարժեք նկարագրություն (i18n դաշտեր)                                         | 85         | 🔄         |
| 4.3 | Technical specifications table — structured attributes                              | 85         | 🔄         |
| 4.4 | Գնային դաշտեր — current price, old price, discount badge inputs                     | 90         | 🔄         |
| 4.5 | Quantity + Add to cart — զամբյուղի API (կլիենտ state-ի հետ համաձայնեցված)           | 90         | 🔄         |
| 4.6 | Պահեստի կարգավիճակ — in stock / out of stock                                        | 90         | 🔄         |
| 4.7 | Related products — recommendation rule (կատեգորիա/բրենդ/այլ)                        | 55         | 🔄         |
| 4.8 | Reviews — rating aggregate, ցուցակ, review submit (policy + auth, եթե պահանջվում է) | 90         | 🔄         |


*Նշումներ.* 4.7 — առաջարկը հիմնականում կլիենտում է (`/api/v1/products` + category, առանց առանձին recommendation endpoint-ի)։

---

## Փուլ 5 — Checkout

**Փուլի առաջընթաց.** `70%`


| ID  | Առաջադրանք (backend)                                                             | Կատարման % | Կարգավիճակ |
| --- | -------------------------------------------------------------------------------- | ---------- | ---------- |
| 5.1 | Պատվերի սևագիր / validate — անուն, ազգանուն, հեռախոս, email, հասցե, նշումներ     | 80         | 🔄         |
| 5.2 | Delivery method — ինտեգրացիայի hint (օր. Yandex delivery) + admin business rules | 30         | ⬜          |
| 5.3 | Delivery cost և order total — դինամիկ վերահաշվարկ API                            | 85         | 🔄         |
| 5.4 | Payment method ընտրություն — card vs cash, order payload                         | 75         | 🔄         |
| 5.5 | Order confirmation — order ID, summary (email/SMS — եթե scope-ում է)             | 60         | 🔄         |
| 5.6 | Validation և error handling — client + server միասնական մոդել                    | 75         | 🔄         |
| 5.7 | Սերվերային գնային վերահսկում — զամբյուղի հետ համաձայնեցում                       | 85         | 🔄         |


*Նշումներ.* `orders.service` checkout-ում գները վերցվում են DB-ից (ոչ թե client snapshot)։ Զեղչը checkout-ում `TODO` է։ Email/SMS հաստատում backend-ում չի երևում։

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

**Փուլի առաջընթաց.** `82%`


| ID  | Առաջադրանք (backend)                                                             | Կատարման % | Կարգավիճակ |
| --- | -------------------------------------------------------------------------------- | ---------- | ---------- |
| 7.1 | Registration / Login — email **կամ** phone, verification flow (եթե պահանջվում է) | 70         | 🔄         |
| 7.2 | Order history — կարգավիճակ, reorder entry point-ի տվյալներ                       | 90         | 🔄         |
| 7.3 | Reorder — նախորդ պատվերից զամբյուղի prefill / նոր պատվեր                         | 75         | 🔄         |
| 7.4 | Address management — shipping հասցեների CRUD                                     | 90         | 🔄         |
| 7.5 | Personal data — edit profile, password/security                                  | 85         | 🔄         |


*Նշումներ.* 7.1 — գրանցում email կամ phone-ով կա; verification (SMS/email) flow չի երևում։ 7.3 — առանձին reorder endpoint չկա, կլիենտը օգտագործում է զամբյուղի API-ները։

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

**Փուլի առաջընթաց.** `88%`


| ID  | Առաջադրանք (backend)                                        | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------- | ---------- | ---------- |
| 9.1 | Orders list — filters: New, In process, Delivered, Canceled | 85         | 🔄         |
| 9.2 | Order details — line items, customer, payment, delivery     | 90         | 🔄         |
| 9.3 | Order status updates — audit trail կամ timestamp            | 85         | 🔄         |
| 9.4 | Admin comment field — internal notes                        | 90         | 🔄         |


*Նշումներ.* `OrderEvent` և `adminNotes` դաշտեր կան։

---

## Փուլ 10 — Admin: analytics

**Փուլի առաջընթաց.** `75%`


| ID   | Առաջադրանք (backend)                                          | Կատարման % | Կարգավիճակ |
| ---- | ------------------------------------------------------------- | ---------- | ---------- |
| 10.1 | Sales KPIs — total orders, revenue, AOV                       | 85         | 🔄         |
| 10.2 | Order status breakdown — by status, today / week / month      | 80         | 🔄         |
| 10.3 | Product analytics — top 5 best sellers, least selling         | 85         | 🔄         |
| 10.4 | Stock analytics — low stock, out of stock lists               | 75         | 🔄         |
| 10.5 | Customer analytics — new vs repeat, top customers by spend    | 40         | 🔄         |
| 10.6 | Dashboard widgets — today’s sales, monthly sales, top product | 85         | 🔄         |


*Նշումներ.* `admin/stats`, `admin/analytics`, dashboard երթուղիներ; 10.5-ը spec-ի լիությամբ մասնակի է։

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

**Փուլի առաջընթաց.** `50%`


| ID   | Առաջադրանք (backend)                                                                                  | Կատարման % | Կարգավիճակ |
| ---- | ----------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 12.1 | Global search — ապրանքներ, կատեգորիաներ; suggest/debounce-ի համար API                                 | 90         | 🔄         |
| 12.2 | Wishlist — persist per user/session                                                                   | 25         | ⬜          |
| 12.3 | Compare products — spec diff-ի համար ցուցակ, max N ապրանք                                             | 25         | ⬜          |
| 12.4 | About Us, Contact Us, brand pages — CMS կամ static content API                                        | 15         | ⬜          |
| 12.5 | Legal pages — Privacy, Terms, Refund, Delivery Policy (**per locale**)                                | 15         | ⬜          |
| 12.6 | Contact form — validation, spam protection                                                            | 70         | 🔄         |
| 12.7 | i18n — AM primary, RU, EN — թարգմանվող էնտիտիների սխեմա, API-ում locale / `Accept-Language`, fallback | 75         | 🔄         |
| 12.8 | Admin — թարգմանությունների խմբագրում կամ import workflow (եթե պահանջվում է)                           | 70         | 🔄         |
| 12.9 | SEO structured data — backend-ից անհրաժեշտ մետատվյալներ (ըստ frontend պայմանագրի)                     | 70         | 🔄         |


*Նշումներ.* 12.1 — `/api/search/instant`։ 12.2/12.3 — հիմնականում localStorage, ոչ թե սերվերային persist։ 12.6 — `POST /api/v1/contact` վալիդացիայով; spam guard (captcha/rate limit) որպես լիարժեք լուծում չի երևում։

---

## Նշումներ

- Աղբյուրը `**shop-marco-code-plan.md`**-ն է. frontend-only կետերը (zoom UI, skeleton, և այլն) ներառված չեն, եթե առանձին backend չի պահանջում։
- **QA & launch** փուլի E2E, cross-browser, CWV-ը հիմնականում QA/frontend/ops են. **Monitoring / error tracking** (Sentry, logs) — ըստ թիմի պատասխանատվության, կարող են ավելացվել infra առաջադրանքների մեջ։

