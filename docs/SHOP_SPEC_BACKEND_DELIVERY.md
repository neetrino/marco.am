# Shop Marco — backend առաջադրանքներ (փուլերով)

> Աղբյուր. `[shop-marco-code-plan.md](./shop-marco-code-plan.md)` (functional spec) — **backend** շերտին և API/CMS պահանջվող կետերը։  
> Ճարտարապետության ամփոփում. `[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)`

**Վերջին թարմացում.** 2026-04-18 (փուլ 8 — promo codes/discounts)

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
| 2    | Գլխավոր էջ (Home) — տվյալներ     | `100%`          |
| 3    | Shop (PLP) — կատալոգ API         | `100%`          |
| 4    | Ապրանքի էջ (PDP) — մանրամասն API | `100%`          |
| 5    | Checkout — պատվեր                | `100%`          |
| 6    | Վճարման եղանակներ                | `100%`          |
| 7    | Օգտատիրոջ հաշիվ (Account)        | `100%`          |
| 8    | Admin — catalog & promos         | `84%`           |
| 9    | Admin — orders                   | `98%`           |
| 10   | Admin — analytics                | `95%`           |
| 11   | Reels                            | `0%`            |
| 12   | Site-wide & i18n (API)           | `62%`           |


**Ընդհանուր նախագծի առաջընթաց (backend).** `~69%` — *(12 փուլերի միջին տոկոս, մոտավոր)*։

---

## Փուլ 1 — Infra & API կոնտրակտ

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                                                      | Կատարման % | Կարգավիճակ |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 1.1 | Հաստատել API կոնտրակտը frontend-ի հետ — REST կամ GraphQL, auth headers, սխալների մոդել                    | 100        | ✅          |
| 1.2 | Միջավայրեր (dev / staging / prod) — env, build/deploy-ին համապատասխան կոնֆիգ (ըստ թիմի պատասխանատվության) | 100        | ✅          |


*Նշումներ.* **1.1 ✅ ավարտված (2026-04-16).** Պաշտոնական կոնտրակտ՝ `[docs/API_CONTRACT.md](./API_CONTRACT.md)` (REST JSON, `Authorization: Bearer <JWT>`, RFC7807-անման `type`/`title`/`status`/`detail`/`instance`), մեքենայական սխեմա՝ `[docs/openapi/shop-api.yaml](./openapi/shop-api.yaml)`։ GraphQL չի օգտագործվում։ Implementation՝ `src/app/api` (ներառյալ `v1`), `src/lib/types/errors.ts`։

**1.2 ✅ ավարտված (2026-04-16).** Env-ի մեկ կետ հանրային URL/CORS-ի համար՝ `src/lib/config/deployment-env.ts` (`APP_ENV`, Vercel-ում `VERCEL_ENV` → preview=staging), `getCorsAllowedOrigin()` — `middleware.ts`-ում, `getPublicAppUrl()` — `src/lib/api-client/url-builder.ts`, health-ում `deployment` դաշտ՝ `GET /api/health`։ Կաղապար և միջավայրերի նկարագրություն՝ `[.env.example](../.env.example)`։ Build/deploy՝ `vercel.json` (`pnpm run build`, `output: standalone` — `next.config.js`), թեստեր՝ `src/lib/config/deployment-env.test.ts`։

---

## Փուլ 2 — Գլխավոր էջ (Home)

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                                                                   | Կատարման % | Կարգավիճակ |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 2.1 | Hero / banner — CMS կամ admin-ից կառավարելի կոնտենտ, CTA (ցուցակ, ակտիվություն, կարգ)                                  | 100        | ✅          |
| 2.2 | Featured products — bestsellers կամ curated list, տվյալներ PDP հղման համար                                             | 100        | ✅          |
| 2.3 | Promotions / special offers բլոկի տվյալներ                                                                             | 100        | ✅          |
| 2.4 | «Why choose us» — 3–4 առավելություն (warranty, fast delivery, installment, original products) — CMS կամ structured API | 100        | ✅          |
| 2.5 | Հաճախորդների կարծիքների carousel — rating, տեքստ, լուսանկարներ (եթե կան)                                               | 100        | ✅          |
| 2.6 | Brand partners — բրենդների մետատվյալներ + լոգո asset URL                                                               | 100        | ✅          |
| 2.7 | Footer — կոնտակտ, սոց հղումներ, քարտեզ embed, legal/quick links (կոնֆիգ/CMS endpoint)                                  | 100        | ✅          |
| 2.8 | Reels section (home) — կարճ ցուցակ / նախադիտում կամ deep link դեպի Reels էջ (տես Փուլ 11)                              | 100        | ✅          |


*Նշումներ.* 2.2 — `GET /api/v1/products` + `filter=new|bestseller|featured` (տես **2.2** ներքևի ✅ բլոկը)։ 2.3 — `GET /api/v1/products` + `filter=promotion` կամ `filter=special_offer` — ակցիայի ապրանքներ՝ ապրանքի `discountPercent > 0`, կատեգորիայի/բրենդի զեղչ admin settings-ից (`categoryDiscounts` / `brandDiscounts`), կամ variant-ում `compareAtPrice > price` (SQL DISTINCT `productId`)։ Home «Հատուկ առաջարկներ» բլոկը կարդում է այս ֆիլտրը; CTA՝ `/products?filter=promotion`։ **Ուշադրություն**՝ միայն **global** զեղչը (առանց ապրանք/կատեգորիա/բրենդ/compare-at) այս ցուցակի մեջ չի ներառվում — ամբողջ կատալոգը չլցնելու համար։

**2.6 ✅ ավարտված (2026-04-17).** `settings.key = homeBrandPartners` (JSON, Zod `homeBrandPartnersStorageSchema`) — բաժնի վերնագիր AM/RU/EN, ցուցակ՝ `id`, `brandId`, `active`, `sortOrder`, կամընտիր `logoScale` (`default`  `large`)։ **Դատարկ `entries`** — ցուցադրվում են բոլոր **published** բրենդները (`slug` կարգով)։ Հանրային՝ `GET /api/v1/home/brand-partners?locale=en|hy|ru` — մեկ լեզվով վերնագիր + անուն/նկարագրություն (բրենդի թարգմանություններից, fallback), `logoUrl`, `href` → `/products?brand=<brandId>`։ Admin՝ `GET`/`PUT /api/v1/supersudo/home-brand-partners` (JWT admin)։ Storefront՝ `FeaturedProductsTabs` → `HomeBrandsSlide` + վերնագիր `HomeBrandsHeading` (API-ից կամ i18n fallback); լոգոյի բացակայության դեպքում՝ տեքստային անուն։ OpenAPI՝ `BrandPartnersPublicResponse` / `BrandPartnersStorageDocument`։

**2.2 ✅ ավարտված (2026-04-17).** Հանրային `GET /api/v1/products` — `filter=new` (ստեղծման ամսաթիվ՝ վերջին 30 օրը), `filter=bestseller` (տողային վաճառք `order_items`-ից, կարգ՝ ընդհանուր քանակով; պատվերների բացակայության դեպքում դատարկ ցուցակ, ոչ ամբողջ կատալոգը), `filter=featured` (curated՝ `Product.featured = true`)։ Յուրաքանչյուր ապրանքի JSON-ում `slug` և `href` (`/products/<slug>`) PDP հղման համար (`products-find-transform.service.ts`)։ Storefront՝ `FeaturedProductsTabs` (tabs՝ new / bestseller / featured), `HomeProductSection` (`filter`: `featured`  `new`)։ Route cache՝ home featured tab-ների համար մինչև 10 րոպե TTL (`FEATURED_CACHE_TTL` — `src/app/api/v1/products/route.ts`)։

**2.1 ✅ ավարտված (2026-04-17).** Պահեստ՝ `settings.key = homeHeroBanner` (JSON, Zod `homeHeroBannerStorageSchema`) — վերնագիր AM/RU/EN, դեսքտոպ/մոբայլ ֆոնի URL (դատարկ = default `/assets/hero/...`), CTA ցուցակ՝ `id`, `label` երեք լեզվով, `href`, `active`, `sortOrder`։ Հանրային՝ `GET /api/v1/home/hero?locale=en|hy|ru` — լուծված մեկ լեզվով headline + պատկերների URL + ակտիվ CTA-ները կարգով։ Admin՝ `GET`/`PUT /api/v1/supersudo/home-hero` (JWT admin)։ Storefront՝ `HeroCarousel` / `HeroCarouselSlides` — SSR cookie `shop_language` + client refetch լեզվի փոփոխման ժամանակ։ Արտաքին պատկերի URL-ի դեպքում `<img>` (առանց `next/image` remote config)։

**2.3 ✅ ավարտված (2026-04-16).** `GET /api/v1/products?filter=promotion|special_offer` — տես վերևի *Նշումներ* 2.3 բլոկը; UI՝ `HomeSpecialOffersSection`։

**2.4 ✅ ավարտված (2026-04-17).** Պահեստ՝ `settings.key = homeWhyChooseUs` (JSON, Zod `whyChooseUsStorageSchema`) — բաժնի վերնագիր AM/RU/EN, 1–8 կետ՝ `id`, `title`/`body` երեք լեզվով, `iconKey` (`warranty`  `fast_delivery`  `installment`  `original`), `active`, `sortOrder`։ Հանրային՝ `GET /api/v1/home/why-choose-us?locale=en|hy|ru` — լուծված մեկ լեզվով վերնագիր + ակտիվ կետերը կարգով։ Admin՝ `GET`/`PUT /api/v1/supersudo/why-choose-us` (JWT admin)։ Storefront՝ `HomeWhyChooseUsSection` — SSR cookie լեզվով + client refetch (`/api/v1/home/why-choose-us`)։ OpenAPI՝ `WhyChooseUsPublicResponse` / `WhyChooseUsStorageDocument`։

**2.5 ✅ ավարտված (2026-04-17).** Պահեստ՝ `settings.key = homeCustomerReviews` (JSON, Zod `homeCustomerReviewsStorageSchema`) — բաժնի վերնագիր AM/RU/EN, մինչև 24 կարծիք՝ `id`, `rating` (1–5), `text`/`authorName` երեք լեզվով, `photoUrls` (մինչև 6 URL), `active`, `sortOrder`։ Լռելյայն օրինակներ DB գրառում չեն պահանջում (կոդի default)։ Հանրային՝ `GET /api/v1/home/customer-reviews?locale=en|hy|ru` — մեկ լեզվով վերնագիր + ակտիվ կարծիքները կարգով։ Admin՝ `GET`/`PUT /api/v1/supersudo/home-customer-reviews` (JWT admin)։ Storefront՝ `HomeCustomerReviewsSection` — հորիզոնական snap carousel (սլայդեր/սքրոլ), աստղեր, տեքստ, լուսանկարների ցանց եթե `photoUrls` դատարկ չեն։ OpenAPI՝ `CustomerReviewsPublicResponse` / `CustomerReviewsStorageDocument`։

**2.8 ✅ ավարտված (2026-04-16).** Storefront՝ `HomeReelsSection` (գլխավոր) + ներքին `/reels` էջ vertical snap ֆիդ (պաստեր նկարներ, deep link `/reels?i=<index>` home-ի յուրաքանչյուր tile-ից), header-ի «Reels» հղումը՝ `/reels` (ոչ արտաքին URL)։ Սերվերային reels մոդել/API չի ավելացվել — տես Փուլ 11։

**2.7 ✅ ավարտված (2026-04-17).** Պահեստ՝ `settings.key = homeSiteFooter` (JSON, Zod `siteFooterStorageSchema`) — սյունակների վերնագիր AM/RU/EN, կոնտակտ (`address` / `phoneDisplay` երեք լեզվով, `phoneTel`, `email`), `mapEmbed` (`enabled` + կամընտիր `iframeSrc` — միայն HTTPS թույլատրված հոսթեր՝ Google Maps / OpenStreetMap embed), `companyLinks` / `supportLinks` / `legalLinks` (href՝ ներքին path կամ http(s)), `socialLinks` (platform preset + HTTPS `href` ակտիվ տողերի համար)։ Հանրային՝ `GET /api/v1/home/footer?locale=en|hy|ru` — մեկ լեզվով լուծված copy + ակտիվ հղումներ + քարտեզի `iframeSrc` կամ `null` եթե անջատված է/URL անվավեր է։ Admin՝ `GET`/`PUT /api/v1/supersudo/home-footer` (JWT admin)։ Storefront՝ `Footer` + `footer-marco-blocks` — SSR `siteFooterService.getPublicPayload` (`layout.tsx`) + client refetch լեզվի փոփոխման ժամանակ; սոց ցանցը՝ `FooterSocialLinks` (`apiLinks`), քարտեզ՝ `FooterMapEmbed`, legal՝ `FooterLegalLinks`։ OpenAPI՝ `SiteFooterPublicResponse` / `SiteFooterStorageDocument`։

---

## Փուլ 3 — Shop (Product listing)

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                                 | Կատարման % | Կարգավիճակ |
| --- | ------------------------------------------------------------------------------------ | ---------- | ---------- |
| 3.1 | Ապրանքների ցուցակ API — նկար, անվանում, հիմնական սպեկներ, գին, բրենդ, warranty badge | 100        | ✅          |
| 3.2 | Sorting — price ASC/DESC, newest, popular                                            | 100        | ✅          |
| 3.3 | Filters — brand, price range, category                                               | 100        | ✅          |
| 3.4 | Filters — technical specs (faceted կամ step filters, schema-ից դինամիկ)              | 100        | ✅          |
| 3.5 | Pagination կամ cursor API — infinite scroll / SEO-ի համար էջավորում                  | 100        | ✅          |


*Նշումներ.* 3.4 — իրականացված է schema-driven faceted API (`technicalSpecs`) և դինամիկ query filtering (`spec.<attributeKey>=value1,value2`, նաև `specs` JSON), որտեղ filterable տեխնիկական ատրիբուտները կարդացվում են schema/DB-ից (`attributes.filterable=true`, բացառում՝ `color`/`size`)։

**3.1 ✅ ավարտված (2026-04-17).** `GET /api/v1/products` պատասխանի յուրաքանչյուր ապրանքի մեջ ավելացվել է `keySpecs` (մինչև 4 հատ հիմնական բնութագիր՝ առաջին հերթին default variant-ի options-ից, fallback՝ product attributes-ից՝ առանց `color`/`size`) և `warrantyBadge` (`{ text, color, position }`), որը լուծվում է ապրանքի label-ներից (`warranty`/`guarantee`/`երաշխ`/`гарант`)։ Գոյություն ունեցող PLP դաշտերը (`image`, `title`, `price`, `brand`, `labels`, `colors` և այլն) պահպանվել են backward-compatible։

**3.2 ✅ ավարտված (2026-04-17).** `GET /api/v1/products`-ում ավելացվել/ստանդարտացվել է `sort`-ի աջակցությունը՝ `price-asc`, `price-desc`, `newest`, `popular` (ալիասներ՝ `price`, `createdAt`, `bestseller`)։ `popular`-ը հաշվարկվում է վաճառքի քանակից (`order_items` → variant → product ranking), `newest`-ը կայունացվել է `createdAt desc` սերվերային կարգով, իսկ գնի դասավորությունը աշխատում է variant-ների նվազագույն գնի հիմքով։ Storefront `/products` էջը հիմա փոխանցում է `sort` query պարամետրը backend։

**3.3 ✅ ավարտված (2026-04-17).** `GET /api/v1/products` filter-ները կայունացվել են `brand`/`price range`/`category` պահանջի համար՝ (1) `brand`-ը այժմ ընդունում է ինչպես `brandId`, այնպես էլ brand slug/անուն (comma-separated բազմակի արժեքներով), (2) `category`-ն աջակցում է բազմակի արժեքների (`category=phones,laptops`), slug **կամ** category id, և ավտոմատ ներառում է ենթակատեգորիաները, (3) `minPrice`/`maxPrice`/`page`/`limit` query-ները նորմալացվում են (invalid/negative արժեքները անտեսվում են, `minPrice > maxPrice` դեպքում սահմանները փոխվում են), (4) `GET /api/v1/products/filters` պատասխանը վերադարձնում է նաև `categories` ֆասետ (`id`, `slug`, `name`, `count`)։

**3.4 ✅ ավարտված (2026-04-17).** Տեխնիկական filter-ները դարձել են **դինամիկ schema-ից**․ `GET /api/v1/products/filters` պատասխանում ավելացվել է `technicalSpecs[]` ֆասետների բլոկ (`key`, `label`, `type`, `values[]`), որը հաշվարկվում է `product_variants.options -> attribute_values -> attributes` շղթայից և ներառում է միայն `attributes.filterable=true` տեխնիկական ատրիբուտները (բացի `color`/`size`)։ `GET /api/v1/products`-ը հիմա ընդունում է դինամիկ query-ներ `spec.<attributeKey>=...` (օր. `spec.ram=8gb,16gb`) և `specs` JSON fallback, ու կիրառում է AND-by-attribute filtering (յուրաքանչյուր attribute-ի համար՝ OR-by-values)։

**3.5 ✅ ավարտված (2026-04-17).** `GET /api/v1/products`-ում ավելացվել է `cursor` query-ի աջակցություն՝ **SEO pagination** (`page`/`limit`) թողնելով backward-compatible։ Response `meta`-ն հիմա վերադարձնում է նաև `hasNextPage` և `nextCursor` (opaque base64url cursor՝ offset-ի հիմքով), ինչը կարելի է անմիջապես օգտագործել infinite scroll-ի համար (`?limit=12&cursor=<nextCursor>`)։ Անվավեր cursor-ի դեպքում fallback-ը անվտանգ է՝ առաջին էջ (offset=0)։

---

## Փուլ 4 — Product (PDP)

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                                | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------------------------------- | ---------- | ---------- |
| 4.1 | Product gallery — մի քանի պատկերներ, metadata                                       | 100        | ✅          |
| 4.2 | Կարճ և լիարժեք նկարագրություն (i18n դաշտեր)                                         | 100        | ✅          |
| 4.3 | Technical specifications table — structured attributes                              | 100        | ✅          |
| 4.4 | Գնային դաշտեր — current price, old price, discount badge inputs                     | 100        | ✅          |
| 4.5 | Quantity + Add to cart — զամբյուղի API (կլիենտ state-ի հետ համաձայնեցված)           | 100        | ✅          |
| 4.6 | Պահեստի կարգավիճակ — in stock / out of stock                                        | 100        | ✅          |
| 4.7 | Related products — recommendation rule (կատեգորիա/բրենդ/այլ)                        | 100        | ✅          |
| 4.8 | Reviews — rating aggregate, ցուցակ, review submit (policy + auth, եթե պահանջվում է) | 100        | ✅          |


*Նշումներ.* 4.7 — իրականացված է backend recommendation chain-ով (`category` → `brand` → `other`)՝ առանձին endpoint-ով `GET /api/v1/products/[slug]/related?lang=<locale>&limit=10`։

**4.1 ✅ ավարտված (2026-04-17).** `GET /api/v1/products/[slug]` պատասխանում gallery-ն դարձել է կառուցվածքային՝ ավելացվել է `gallery[]` դաշտ, որտեղ յուրաքանչյուր նկար ունի metadata (`url`, `alt`, `title`, `mimeType`, `width`, `height`, `isPrimary`, `position`, `source`, `metadata`)։ Միաժամանակ պահպանվել է backward-compatible `media` դաշտը որպես URL-ների զանգված (`media = gallery.map(url)`), որպեսզի եղած client-երը չկոտրվեն։ Gallery-ն մաքրում/վալիդացնում է URL-ները, հեռացնում variant պատկերների duplicate-ները և ապահովում է առնվազն մեկ `isPrimary=true` պատկեր։

**4.2 ✅ ավարտված (2026-04-17).** `GET /api/v1/products/[slug]?lang=<locale>` PDP պատասխանում ավելացվել են հստակ i18n նկարագրության դաշտեր՝ `shortDescription` (product translation `subtitle`) և `fullDescription` (product translation `descriptionHtml`)՝ պահելով backward-compatible `subtitle` և `description` դաշտերը։ Ավելացվել է նաև `i18n` բլոկ՝ `{ requestedLocale, availableLocales, descriptions }`, որտեղ `descriptions[locale] = { shortDescription, fullDescription }` բոլոր հասանելի թարգմանությունների համար։ Locale fallback-ը կայունացվել է՝ `requested locale` → `en` → առաջին հասանելի translation։

**4.3 ✅ ավարտված (2026-04-17).** `GET /api/v1/products/[slug]?lang=<locale>` PDP պատասխանում ավելացվել է `technicalSpecifications[]` դաշտ՝ table-ready structured attributes ձևաչափով՝ `{ key, name, values[], value }`։ Տվյալը հավաքվում է `productAttributes`-ից (թարգմանված attribute name/label-ներով), իսկ դրանց բացակայության դեպքում fallback է variant option-ներից։ Կրկնվող արժեքները դեդուպ են արվում case-insensitive, իսկ ոչ-տեխնիկական `color`/`size` հատկանիշները դուրս են թողնվում, որպեսզի PDP-ի technical specs table-ը ստանա մաքուր structured տվյալ։

**4.4 ✅ ավարտված (2026-04-17).** `GET /api/v1/products/[slug]?lang=<locale>` PDP պատասխանում գնի դաշտերը ստանդարտացվել են՝ ինչպես top-level, այնպես էլ variant մակարդակով․ ավելացվել են `currentPrice`, `oldPrice`, `discountBadge` (`{ type: "percentage", value, label }`) և `pricing` summary բլոկը։ `oldPrice`-ը վերադարձվում է միայն այն դեպքում, երբ այն իրականում մեծ է `currentPrice`-ից, իսկ `discountBadge`-ը հաշվարկվում է product/category/brand/global discount-ից կամ fallback՝ `compareAtPrice` տարբերությունից։ Գոյություն ունեցող `price` / `originalPrice` / `compareAtPrice` դաշտերը պահպանվել են backward-compatible։

**4.5 ✅ ավարտված (2026-04-17).** `POST /api/v1/cart/items`-ում ավելացվել է `quantity`-ի խիստ validation (`positive integer`) և պահեստի սահմանափակման վերահսկում՝ ընդհանուր cart քանակի հաշվարկով (`existing + requested <= stock`)։ PDP (`src/app/products/[slug]/page.tsx`) add-to-cart հոսքը հիմա ուղարկում է ընտրված `quantity`-ը և `cart-updated` custom event-ով վերադարձնում է state-sync տվյալներ (`optimisticAdd` / `cartSummary`)՝ Header badge/total-ը անմիջապես համաժամեցնելու համար թե՛ login, թե՛ guest դեպքերում։ Guest cart-ում նույնպես ավելացվել է նույն variant-ի `stock`-ի գերազանցման պաշտպանություն և local summary հաշվարկ (`itemsCount`, `total`)։

**4.6 ✅ ավարտված (2026-04-17).** `GET /api/v1/products/[slug]?lang=<locale>` PDP պատասխանում ավելացվել է հստակ պահեստային կարգավիճակի մոդել՝ product մակարդակով `inStock`, `stockStatus` (`in_stock`/`out_of_stock`) և `stockQuantity` (բոլոր variant-ների դրական stock-ի գումար), իսկ variant մակարդակով՝ `inStock` + `stockStatus` դաշտեր։ Storefront PDP-ում (`ProductInfoAndActions`) հիմա ցուցադրվում է տեսանելի badge՝ `In stock` կամ `Out of stock` (լեզվային թարգմանություններով `common.stock.*`)՝ ընտրված variant-ի հասանելիության հիման վրա։

**4.7 ✅ ավարտված (2026-04-17).** Ավելացվել է backend recommendation service՝ `productsRelatedService` և route `GET /api/v1/products/[slug]/related`։ Կանոնը աշխատում է փուլային՝ **(1) նույն կատեգորիա** (`sort=popular`), **(2) նույն բրենդ** (`sort=popular`), **(3) այլ ապրանքներ** (`sort=popular`)՝ մինչև պահանջվող `limit` (default 10, max 24)։ Ընթացիկ PDP ապրանքը սերվերում բացառվում է, duplicate-ները դեդուպ են `id`-ով, և response-ում տրվում է item-level `recommendationRule` + `meta.rules` հաշվարկ (`category`/`brand`/`other`)։ Storefront related hook-ը տեղափոխվել է նոր endpoint-ի վրա (`useRelatedProducts`), և PDP-ից փոխանցվում է `productSlug`։

**4.8 ✅ ավարտված (2026-04-16).** `GET /api/v1/products/[slug]/reviews` — վերադարձնում է `{ reviews, aggregate }` (միջին գնահատական, քանակ, աստղերի բաշխում) + հրապարակված կարծիքների ցուցակ։ `POST` — JWT, `policyAccepted: true` (UI-ում checkbox + `/terms` հղում), մարմնում `rating` + `comment`։ Պրոդում կամընտիր `REVIEW_REQUIRE_PURCHASE=true` — կարծիք միայն այն օգտատիրոջ համար, ում մոտ կա չչեղարկված պատվեր ապրանքով (variant → product)։ `reviews.service.ts`, PDP `ProductReviews` / `ReviewSummary` / `useReviews`։

---

## Փուլ 5 — Checkout

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                             | Կատարման % | Կարգավիճակ |
| --- | -------------------------------------------------------------------------------- | ---------- | ---------- |
| 5.1 | Պատվերի սևագիր / validate — անուն, ազգանուն, հեռախոս, email, հասցե, նշումներ     | 100        | ✅          |
| 5.2 | Delivery method — ինտեգրացիայի hint (օր. Yandex delivery) + admin business rules | 100        | ✅          |
| 5.3 | Delivery cost և order total — դինամիկ վերահաշվարկ API                            | 100        | ✅          |
| 5.4 | Payment method ընտրություն — card vs cash, order payload                         | 100        | ✅          |
| 5.5 | Order confirmation — order ID, summary (email/SMS — եթե scope-ում է)             | 100        | ✅          |
| 5.6 | Validation և error handling — client + server միասնական մոդել                    | 100        | ✅          |
| 5.7 | Սերվերային գնային վերահսկում — զամբյուղի հետ համաձայնեցում                       | 100        | ✅          |


*Նշումներ.* `orders.service` checkout-ում գները վերցվում են DB-ից (ոչ թե client snapshot)։ Զեղչը checkout-ում `TODO` է։ Order confirmation email/SMS result-ը վերադարձվում է `confirmation.notifications` դաշտով։

**5.1 ✅ ավարտված (2026-04-16).** Storefront `CheckoutForm` — անուն/ազգանուն, հեռախոս, email, առաքման հասցե (փողոց + քաղաք, երբ `courier`), նշումներ (`notes`, մինչև 2000 նիշ)։ `POST /api/v1/orders/checkout` մարմնում `firstName`/`lastName`/`notes` + `shippingAddress`։ Սերվեր՝ `Order.notes`, հասցեի JSON (`buildOrderAddressJson` — `firstName`/`lastName`/`addressLine1`/`city`)։

**5.2 ✅ ավարտված (2026-04-16).** Առաքման եղանակի ընտրություն checkout-ում՝ `**pickup`** (խանութից վերցնել) կամ `**courier`** (կուրիերով առաքում) — `CheckoutForm` radio, `shippingMethod` դաշտը API payload-ում։ Հին արժեք `**delivery**` սերվերում նորմալացվում է `courier`-ի (`normalizeShippingMethod` — `src/lib/constants/shipping-method.ts`)։ `courier`-ի դեպքում պահանջվում են հասցե + քաղաք, առաքման արժեքը հաշվարկվում է սերվերում `adminDeliveryService.getDeliveryPrice`-ով (քաղաք, երկիր) — նախադիտում storefront-ում `GET /api/v1/delivery/price`։ Թարգմանություններ՝ `checkout.shipping.courier` / `courierDescription` (hint՝ admin կանոններ / գործընկեր կուրիեր, ոչ թե լիարժեք Yandex API ինտեգրացիա)։

**5.3 ✅ ավարտված (2026-04-16).** `**POST /api/v1/checkout/totals`** — դինամիկ ենթագումար + առաքում + հարկ (0) + ընդհանուր **AMD**-ով (նույն բանաձևը, ինչ `POST /api/v1/orders/checkout` գնահատում է)։ Մարմին՝ `shippingMethod`, `country`/`city` (courier-ի համար), `cartId` (JWT-ով միացնելիս) կամ `items[]` (հյուր)։ Իրականացում՝ `checkoutTotalsService` (`cartService.getCart` զեղչերով միացնելիս, հյուր՝ variant-ի DB գին) + `adminDeliveryService.getDeliveryPrice`։ Storefront՝ `useCheckoutTotals` (debounce) + ամփոփման UI-ը ցուցադրում է արդյունքը; fallback՝ `useOrderSummary`-ում զամբյուղի AMD-ում ենթագումար, եթե POST-ը դեռ չի կանչվել։

**5.4 ✅ ավարտված (2026-04-17).** Վճարման եղանակի ընտրություն checkout-ում՝ `**card`** (բանկային քարտ, առցանց) կամ `**cash`** (կանխիկ) — `CheckoutForm` radio, `paymentMethod` դաշտը `POST /api/v1/orders/checkout` մարմնում։ Սերվեր՝ `resolveCheckoutPaymentMethod` / `normalizeCheckoutPaymentMethod` (`src/lib/constants/checkout-payment-method.ts`) — հին արժեքներ `**idram**` / `**arca**` → `card`, `**cash_on_delivery**` → `cash`; դատարկ/բացակայող → `cash`։ `Payment` գրառումը պահում է `provider`/`method` = canonical արժեքը; `nextAction`՝ `card` → `redirect_to_payment`, `cash` → `view_order`։ Vitest՝ `checkout-payment-method.test.ts`։

**5.5 ✅ ավարտված (2026-04-17).** `POST /api/v1/orders/checkout` պատասխանում ավելացվել է `confirmation` բլոկ՝ `orderId`, `orderNumber`, `summary` (`itemsCount`, `subtotal`, `shippingAmount`, `total`, `currency`) և `notifications` (`email`, `sms`) առաքման արդյունքներով (`sent`/`skipped`/`failed` + `detail`)։ Checkout-ից հետո backend-ը փորձում է ուղարկել order confirmation email՝ Resend-ով (երբ `RESEND_API_KEY` + `RESEND_FROM_EMAIL` կան), իսկ SMS channel-ը scope-ից դուրս լինելու պատճառով վերադարձվում է `skipped` (`sms_provider_not_configured`)՝ առանց պատվերի ստեղծումը տապալելու։ Կոդ՝ `src/lib/services/order-confirmation-delivery.service.ts`, ինտեգրում՝ `src/lib/services/orders.service.ts`։

**5.6 ✅ ավարտված (2026-04-17).** Checkout validation/error handling-ը միավորվել է client+server մոդելով․ սերվերը (`src/lib/services/orders-checkout-validation.ts`) վերադարձնում է RFC7807 validation սխալ + `errors[]` (`field`, `code`, `message`) structured դաշտերով (`email`, `phone`, `firstName`, `lastName`, `shippingAddress`, `shippingCity`, `notes`)՝ ներառյալ `notes` երկարության վերահսկում (`<=2000`)։ Storefront submit flow-ը (`src/app/checkout/hooks/useOrderSubmission.ts`) parse է անում այս կառուցվածքը `parseCheckoutSubmissionError`-ով (`src/app/checkout/utils/checkout-api-errors.ts`) և յուրաքանչյուր issue-ը կապում է համապատասխան form field error-ին (`react-hook-form setError`), առանց fragile `message.includes(...)` պայմանների։ Courier հասցեի UI-ն (`CheckoutForm`) հիմա արտացոլում է նույն field-error աղբյուրը։

**5.7 ✅ ավարտված (2026-04-17).** Guest checkout-ի server-side cart reconciliation-ը ուժեղացվել է՝ միասնական resolver-ով (`src/lib/services/checkout-guest-items.service.ts`) թե՛ `POST /api/v1/orders/checkout`, թե՛ `POST /api/v1/checkout/totals` հոսքերի համար։ Payload `items[]`-ում `quantity`-ն հիմա խիստ `positive integer` է, duplicate տողերը նույն `variantId`-ի համար սերվերում գումարվում են մեկ checkout line-ի, հակասող `variantId -> productId` զույգերը մերժվում են (`400`), իսկ չհրապարակված/ջնջված կամ stock-ից դուրս variant-ները վերադարձնում են `404`/`422`։ Այսպիսով subtotal/order total-ը հաշվարկվում է միայն DB գներով և նույնացված cart line-երով (ոչ client snapshot-ով)։

---

## Փուլ 6 — Վճարման եղանակներ

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                    | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------------------- | ---------- | ---------- |
| 6.1 | Քարտային վճարում — PSP ինտեգրացիա, session/webhook, կարգավիճակների flow | 100        | ✅          |
| 6.2 | Կանխիկ վճարում — պատվերի մեթոդ, կարգավիճակների flow                     | 100        | ✅          |


*Նշումներ.* `Payment` գրառում է ստեղծվում, իսկ `card`-ի դեպքում checkout-ը հիմա ստեղծում է PSP session (`providerTransactionId`, `idempotencyKey`, `providerResponse`) և վերադարձնում է `payment.paymentUrl` + `expiresAt`։ Ավելացված է webhook endpoint՝ `POST /api/v1/payments/webhook` (`x-psp-signature` HMAC SHA-256 validation)՝ event-ներով `payment.processing|succeeded|failed|cancelled|expired`, որոնք թարմացնում են `payments.status`, `orders.paymentStatus`, `orders.status`, `paidAt/failedAt` և գրում `order_events` (`payment_webhook_processed`)։ Local/dev fallback-ի համար ավելացվել է `GET /api/v1/payments/mock-hosted?session=...&status=succeeded|failed|cancelled|expired`՝ mock hosted redirect flow։

**6.2 ✅ ավարտված (2026-04-17).** Cash (`payment.method/provider = cash|cash_on_delivery|cod`) պատվերների status flow-ը ամրացվել է admin update հոսքում (`PUT /api/v1/supersudo/orders/[id]`)։ Երբ admin-ը cash պատվերը դարձնում է `completed`, backend-ը ավտոմատ սինք է անում `orders.paymentStatus -> paid` (եթե explicit value չի փոխանցվել) և նույն transaction-ում թարմացնում է `payments.status` + timestamp-ները (`completedAt/failedAt`)։ `cancelled` դեպքում payment status-ը սինք է գնում `failed`։ Քարտային պատվերների վրա այս ավտոմատ rule-երը չեն տարածվում։ Թեստեր՝ `cash-payment-flow.test.ts`։

---

## Փուլ 7 — Account (հաճախորդի պրոֆիլ)

**Փուլի առաջընթաց.** `100%`


| ID  | Առաջադրանք (backend)                                                             | Կատարման % | Կարգավիճակ |
| --- | -------------------------------------------------------------------------------- | ---------- | ---------- |
| 7.1 | Registration / Login — email **կամ** phone, verification flow (եթե պահանջվում է) | 100        | ✅          |
| 7.2 | Order history — կարգավիճակ, reorder entry point-ի տվյալներ                       | 100        | ✅          |
| 7.3 | Reorder — նախորդ պատվերից զամբյուղի prefill / նոր պատվեր                         | 100        | ✅          |
| 7.4 | Address management — shipping հասցեների CRUD                                     | 100        | ✅          |
| 7.5 | Personal data — edit profile, password/security                                  | 100        | ✅          |


*Նշումներ.* 7.3 — `POST /api/v1/orders/{number}/reorder` (JWT) — պատվերի տողերը ավելացվում են զամբյուղում (`cartService.addItem`), հասանելիության սահմաններով (published, stock); պատասխանում `added` / `skipped` + թարմ `cart` (ինչպես `GET /api/v1/cart`)։

**7.2 ✅ ավարտված (2026-04-16, backend ստուգում 2026-04-17).** `GET /api/v1/orders` (JWT) — պատմության ցուցակ՝ `status`, `paymentStatus`, `fulfillmentStatus`, գումարներ, `itemsCount`, `createdAt` (ISO8601), և `**links`**՝ `{ self: { method: GET, href }, reorder: { method: POST, href } }` (href-երը `/api/v1/orders/<number>` և `/api/v1/orders/<number>/reorder`)։ Նույն `**links`** դաշտը ավելացված է `GET /api/v1/orders/[number]` պատասխանին և `GET /api/v1/users/dashboard`-ի `recentOrders` տողերին։ OpenAPI՝ `OrderListResponse` / `CustomerOrderLinks` (`docs/openapi/shop-api.yaml`)։ Սերվերում `page`/`limit` query-ի անվավեր արժեքները (`NaN`, բացասական) անտեսվում են — fallback `1` / `20` (`orders.service.ts` `list`)։ Vitest՝ `src/lib/constants/customer-order-api-paths.test.ts` (3 թեստ) անցել է։

**7.3 ✅ ավարտված (2026-04-16).** `POST /api/v1/orders/[number]/reorder` — նախորդ պատվերի `OrderItem` տողերից զամբյուղի լցում (`src/lib/services/cart-reorder.service.ts` → `cartService.addItem`). Չլրացված տողերը `skipped`-ում են `no_variant` | `variant_not_found` | `unpublished` | `out_of_stock` պատճառներով։ Դատարկ պատվերի դեպքում `400`։

**7.4 ✅ ավարտված (2026-04-16).** Shipping հասցեների CRUD՝ JWT-ով `GET`/`POST /api/v1/users/addresses`, `PUT`/`DELETE /api/v1/users/addresses/[addressId]`, default՝ `PATCH /api/v1/users/addresses/[addressId]/default`։ Zod վալիդացիա (`shipping-address.schema.ts`), սերվերային լոգիկա՝ `shipping-addresses.service.ts` — առաջին հասցեն default, `isDefault: true`-ի դեպքում մյուսները անջատված, default հասցեի նշումը ստուգվում է `userId`-ով (ID-ով կեղծ default անել հնարավոր չէ), ջնջումից հետո մնացածների համար default-ի ապահովում։ `GET /api/v1/users/profile`-ի `addresses` դաշտը նույն մոդելն է։

**7.1 ✅ ավարտված (2026-04-16).** `AUTH_REQUIRE_VERIFICATION` env (`true`/`false`, default `false`) — երբ `true`, գրանցում/մուտքից հետո JWT չի տրվում մինչև OTP հաստատում։ `POST /api/v1/auth/register` կամ `POST /api/v1/auth/login` կարող են վերադարձնել `{ needsVerification, channel, verificationToken }` — 15 րոպե TTL սեսիոն JWT։ `POST /api/v1/auth/verify` (`verificationToken`, `code`) — `{ user, token }` + `emailVerified`/`phoneVerified` թարմացում։ `POST /api/v1/auth/resend-verification` — նոր OTP, 60 վրկ cooldown։ Էլ. փոստ՝ Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), հեռախոս՝ մինչև SMS ինտեգրացիա՝ սերվերային log (dev)։ DB՝ `auth_verification_codes`։ Storefront՝ `/verify` էջ, `AuthContext` OTP քայլ։

**7.5 ✅ ավարտված (2026-04-16).** Անձնական տվյալներ՝ `GET`/`PUT /api/v1/users/profile` — Zod վալիդացիա, `firstName`/`lastName`/`email`/`phone`/`locale` թարմացում (email lowercase), առնվազն մեկ `email` կամ `phone`, միակության ստուգում + `P2002` → 409, email/phone փոփոխության դեպքում `emailVerified`/`phoneVerified` → `false`։ Պատասխանը նույն ձևաչափն է, ինչ `GET`-ը (ներառյալ `addresses`, `roles`)։ Գաղտնաբառ՝ `PUT /api/v1/users/password` (`currentPassword`, `newPassword`) — `usersService.changePassword`։ Կոդ՝ `src/lib/schemas/user-profile.schema.ts`, `src/lib/services/user-profile-update.ts`, `src/app/api/v1/users/profile/route.ts`, `src/app/api/v1/users/password/route.ts`, storefront `/profile` (`usePersonalInfo`, `usePassword`)։

---

## Փուլ 8 — Admin: catalog & promos

**Փուլի առաջընթաց.** `84%`


| ID  | Առաջադրանք (backend)                                                                                                  | Կատարման % | Կարգավիճակ |
| --- | --------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 8.1 | Product CRUD — images, specs, pricing, stock, brand, categories                                                       | 100        | ✅          |
| 8.2 | Product class — Retail / Wholesale դաշտ SKU/ապրանքի վրա                                                               | 100        | ✅          |
| 8.3 | Delivery rules — Retail-only → Yandex delivery; Wholesale կամ mixed cart → free delivery (**սերվերային enforcement**) | 100        | ✅          |
| 8.4 | Promo codes և discounts — rules, limits, date ranges                                                                  | 100        | ✅          |
| 8.5 | Banner management — slots, scheduling, links                                                                          | 15         | ⬜          |
| 8.6 | Categories management — tree, SEO fields                                                                              | 90         | 🔄         |


*Նշումներ.* 8.4 — այժմ կան նաև admin-managed promo code-ներ (`settings.key = promoCodes`)՝ կանոններով (`percentage`/`fixed`, scope `all|retail|wholesale`, `minSubtotal`), սահմանափակումներով (`usageLimitTotal`, `usageLimitPerUser`) և ժամանակային պատուհաններով (`startsAt`, `endsAt`)։ Coupon կիրառումը կապված է checkout totals/order checkout հոսքերին, և կիրառված `couponCode`-ը պահպանվում է պատվերում usage-limit enforcement-ի համար։

**8.1 ✅ ավարտված (2026-04-17).** Admin product CRUD-ի catalog endpoint-ը (`GET /api/v1/supersudo/products`) ամբողջացվել է պահանջվող դաշտերի filtering-ի համար՝ ավելացվել է `brand` (multi-value) ֆիլտրը, ակտիվացվել է `minPrice`/`maxPrice` price range filtering-ը variant գնի հիմքով, իսկ կոմբինացված search+category հարցումներում fixed է boolean լոգիկան (`AND` semantics՝ նախկին սխալ լայն `OR`-ի փոխարեն)։ Արդյունքում admin catalog-ը կայուն է `images/specs/pricing/stock/brand/categories` կառավարման հոսքի համար՝ create/update/delete-ի կողքին։

**8.2 ✅ ավարտված (2026-04-17).** Ավելացվել է `ProductClass` enum (`retail`/`wholesale`) և պարտադիր դաշտեր թե՛ ապրանքի (`Product.productClass`), թե՛ SKU/variant-ի (`ProductVariant.productClass`) վրա (`shared/db/prisma/schema.prisma`, migration՝ `20260417153000_add_product_class_to_product_and_variant`)։ Admin create/update API-ները (`POST/PUT /api/v1/supersudo/products`) ընդունում և վալիդացնում են `productClass` և `variants[].productClass` արժեքները, իսկ create/update service-ները պահպանում են դաշտը DB-ում՝ variant մակարդակում fallback անելով product class-ին։ Admin read/list պատասխանում վերադարձվում է `productClass` թե՛ product, թե՛ variant object-ներում, և admin add/edit form-ում ավելացվել է `Product class` selector (Retail/Wholesale), որն ուղարկվում է payload-ով։

**8.3 ✅ ավարտված (2026-04-18).** Delivery rule enforcement-ը միավորված է սերվերային checkout հոսքերում՝ մեկ resolver-ով (`src/lib/services/checkout-delivery-rules.service.ts`)։ Կանոնը կիրառվում է թե՛ preview totals endpoint-ում (`POST /api/v1/checkout/totals`), թե՛ order creation-ում (`POST /api/v1/orders/checkout`)՝ cart line-երի `productClass`-ի հիմքով․ `retail-only` cart → courier delivery արժեքը հաշվարկվում է `adminDeliveryService.getDeliveryPrice`-ով (Yandex-priced flow), իսկ `wholesale-only` կամ `mixed` cart → courier delivery-ը հարկադրաբար `0` է (free delivery)։ Enforcement-ը client payload-ից անկախ է, և order event-ում պահպանվում է `shippingPricingRuleApplied` audit marker (`retail_yandex` / `wholesale_or_mixed_free`)։

**8.4 ✅ ավարտված (2026-04-18).** Ավելացվել է promo engine (`src/lib/services/promo-codes.service.ts`) և Admin API promo code-ների կառավարման համար (`GET`/`PUT /api/v1/supersudo/promo-codes`, `DELETE /api/v1/supersudo/promo-codes/[id]`)՝ settings JSON պահեստով (`promoCodes`)։ Checkout preview/order creation հոսքերում (`POST /api/v1/checkout/totals`, `POST /api/v1/orders/checkout`) coupon code-ը հիմա իրականում կիրառվում է սերվերում՝ rule/limit/date-range validation-ով, discount հաշվարկով (`percentage`/`fixed`, optional cap), scope ստուգմամբ (`all|retail|wholesale`) և usage-limit enforcement-ով (`orders` աղյուսակի `couponCode`)։ Ավելացվել է cart coupon API՝ `PUT`/`DELETE /api/v1/cart/coupon`, ինչպես նաև order schema/migration՝ `Order.couponCode` + `shared/db/prisma/migrations/20260418121000_add_order_coupon_code`։

---

## Փուլ 9 — Admin: orders

**Փուլի առաջընթաց.** `98%`


| ID  | Առաջադրանք (backend)                                        | Կատարման % | Կարգավիճակ |
| --- | ----------------------------------------------------------- | ---------- | ---------- |
| 9.1 | Orders list — filters: New, In process, Delivered, Canceled | 100        | ✅          |
| 9.2 | Order details — line items, customer, payment, delivery     | 100        | ✅          |
| 9.3 | Order status updates — audit trail կամ timestamp            | 100        | ✅          |
| 9.4 | Admin comment field — internal notes                        | 90         | 🔄         |


*Նշումներ.* `OrderEvent` և `adminNotes` դաշտեր կան։

**9.1 ✅ ավարտված (2026-04-17).** Admin պատվերների ցուցակ՝ `GET /api/v1/admin/orders` — query `status`՝ միայն `pending` | `processing` | `completed` | `cancelled` (այլ արժեքները անտեսվում են, վերադարձվում են բոլոր պատվերները)։ UI-ում ֆիլտրերի պիտակներ՝ **New** / **In process** / **Delivered** / **Canceled** (համապատասխանում են նույն DB արժեքներին) + «Բոլոր կարգավիճակները»։ `page`/`limit` անվավեր արժեքների դեպքում fallback `1` / `20`, `limit` առավելագույնը `100`։ Կոդ՝ `src/lib/constants/admin-order-list-status.ts`, `query-builder.ts`, `src/app/api/v1/admin/orders/route.ts`, `OrdersFilters.tsx` / `OrderRow.tsx`։

**9.2 ✅ ավարտված (2026-04-17).** Admin պատվերի մանրամասների մոդալ՝ `GET /api/v1/admin/orders/[id]` (նույն պատասխանը, ինչ արդեն էր) + UI բաժիններ՝ **ամփոփում** (կարգավիճակներ, tracking, ամսաթվեր), **տողեր** (SKU, քանակ, գին, variant options, նկարի thumbnail), **հաճախորդ** (հաշվի + հյուր checkout՝ անուն/email/հեռախոս billing/shipping JSON-ից), **վճարում** (provider, method, գումար, կարգավիճակ, քարտ), **առաքում** (pickup/courier, հասցե, երկիր), **գումարներ**, **նշումներ**, **audit trail**։ Բեռնման ժամանակ մոդալը ցուցադրվում է spinner-ով (`setOrderDetails(null)` նոր բացման ժամանակ)։ API-ում `formatOrderForDetail` — `trackingNumber`, `fulfilledAt`, line `price`/`imageUrl`։ Կոդ՝ `OrderDetailsModal.tsx`, `OrderDetailsMeta`, `OrderDetailsItems`, `OrderDetailsCustomer`, `OrderDetailsPayment`, `OrderDetailsDelivery`, `OrderDetailsTotals`, `OrderDetailsNotes`, `order-details-display.ts`, `order-formatter.ts`։

**9.3 ✅ ավարտված (2026-04-17).** Admin `PUT /api/v1/admin/orders/[id]`-ի ժամանակ կարգավիճակների փոփոխությունները գրանցվում են `order_events`-ում՝ `**changes`** (from/to `status`, `paymentStatus`, `fulfillmentStatus`), `updatedFields`, `**userId`** (ընթացիկ ադմին JWT), ISO `**createdAt**`։ Նույն արժեքի վրա no-op թարմացում event չի ստեղծվում։ `GET /api/v1/admin/orders/[id]` պատասխանում `**auditTrail**`՝ `{ id, type, createdAt, data, actor }` (actor՝ `users`-ից email/անուն)։ Checkout-ի `order_created` event-ը ներառվում է timeline-ում։ Admin UI՝ `OrderDetailsAuditTrail`։ Vitest՝ `audit-trail-lines.test.ts`։

---

## Փուլ 10 — Admin: analytics

**Փուլի առաջընթաց.** `95%`


| ID   | Առաջադրանք (backend)                                          | Կատարման % | Կարգավիճակ |
| ---- | ------------------------------------------------------------- | ---------- | ---------- |
| 10.1 | Sales KPIs — total orders, revenue, AOV                       | 85         | 🔄         |
| 10.2 | Order status breakdown — by status, today / week / month      | 100        | ✅          |
| 10.3 | Product analytics — top 5 best sellers, least selling         | 100        | ✅          |
| 10.4 | Stock analytics — low stock, out of stock lists               | 100        | ✅          |
| 10.5 | Customer analytics — new vs repeat, top customers by spend    | 100        | ✅          |
| 10.6 | Dashboard widgets — today’s sales, monthly sales, top product | 85         | 🔄         |


*Նշումներ.* `admin/stats`, `admin/analytics`, `GET .../admin/analytics/order-status-breakdown`, dashboard երթուղիներ։

**10.2 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics/order-status-breakdown` (JWT + admin) — վերադարձնում է `windows`՝ երեք ժամանակահատված՝ **today** (այս օրը 00:00–23:59:59), **week** (վերջին 7 օրը, ինչպես հիմնական analytics-ի `period=week`), **month** (վերջին 30 օրը) — յուրաքանչյուրում `byStatus`՝ `pending` / `processing` / `completed` / `cancelled` / `other` (ոչ ստանդարտ `status` արժեքներ DB-ում), `totalOrders`, `dateRange` (ISO)։ Հաշվարկը՝ `Order.createdAt`։ Իրականացում՝ `order-status-breakdown.ts`, ամսաթվերի պատուհոն՝ `analytics-date-range.ts`։ Admin Analytics՝ `useAnalytics`-ը զուգահեռ է կանչում analytics-ը և այս endpoint-ը; UI աղյուսակ՝ `OrderStatusBreakdown`։

**10.4 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics/stock` (JWT + admin) — վերադարձնում է `outOfStock` և `lowStock` ցուցակներ (տողեր՝ variant/product/sku/stock, բրենդի անուն ընտրված `locale`-ով, նկարի URL) և `total` հաշվիչներ pagination-ի (`limit`/`offset`) համար։ «Ցածր պաշար»՝ `1 … threshold−1` հատ պաշար (default `threshold=10`, `src/lib/constants/low-stock-threshold.ts`), «Ավարտված»՝ `stock === 0`։ Միայն **published** variant-ներ, **չջնջված** ապրանքներ։

**10.3 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics` (նույն JWT + admin, `period` / `startDate` / `endDate`) — պատասխանում `**topProducts`**՝ թոփ 5 ապրանք վաճառված քանակով (բոլոր variant-ների գումար, ապրանքային ագրեգացիա), `**leastSellingProducts`**՝ **թոփ 5 ամենցածր** արտահայտված քանակով՝ **առանց կրկնվելու** `topProducts`-ի հետ (մնացած ապրանքներից)։ Տողերում՝ `productId`, `title`, `sku` (բազմակի variant-ի դեպքում sentinel `Multiple SKUs`), `totalQuantity`, `totalRevenue`, `orderCount`, `image`։ Կոդ՝ `product-sales-analytics.ts`, `PRODUCT_ANALYTICS_RANK_LIMIT` (`product-analytics.ts`), Admin UI՝ `TopProducts` + `LeastSellingProducts`։ Vitest՝ `product-sales-analytics.test.ts`։

**10.5 ✅ ավարտված (2026-04-17).** `GET /api/v1/admin/analytics` պատասխանի մեջ `**customerAnalytics`** — `**newVsRepeat`**՝ նոր հաճախորդներ (առաջին պատվերը երբևէ ընկնում է ընտրած `dateRange`-ում), կրկնվող (պատվեր էր մինչև պատուհանի սկիզբը և նորից պատվերել է պատուհանում), պատվերների քանակներ նոր/կրկնվող բաժանումով, `ordersUnattributed` (առանց `userId` և email), և `**topCustomersBySpend**`՝ մինչև **10** հաճախորդ **վճարված** (`paymentStatus=paid`) պատվերների գումարով ընտրած ժամանակահատվածում (նույն պատուհանը, ինչ KPI եկամուտը)։ Հաճախորդի ինքնություն՝ `userId`, այլապես նորմալացված `customerEmail`։ Կոդ՝ `customer-identity.ts`, `customer-analytics.ts`, `TOP_CUSTOMERS_BY_SPEND_LIMIT`, Admin Analytics UI՝ `CustomerAnalytics`։

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
| 12.6 | Contact form — validation, spam protection                                                            | 100        | ✅          |
| 12.7 | i18n — AM primary, RU, EN — թարգմանվող էնտիտիների սխեմա, API-ում locale / `Accept-Language`, fallback | 75         | 🔄         |
| 12.8 | Admin — թարգմանությունների խմբագրում կամ import workflow (եթե պահանջվում է)                           | 70         | 🔄         |
| 12.9 | SEO structured data — backend-ից անհրաժեշտ մետատվյալներ (ըստ frontend պայմանագրի)                     | 70         | 🔄         |


**12.2 ✅ ավարտված (2026-04-17).** Wishlist-ը պահվում է PostgreSQL-ում (`wishlists`, `wishlist_items`)։ Մուտք գործած օգտատիրոջ համար՝ `userId` (մեկ ցուցակ)։ Հյուրի համար՝ `sessionToken` + `Set-Cookie: shop_wishlist_session` (կամ `x-wishlist-session`)։ Միայն **published** և չջնջված ապրանքներ։ `POST /api/v1/wishlist/merge` — հյուրի ցուցակը միացնել JWT օգտատիրոջը (կրկնվող productId-ները բաց են թողնվում)։ OpenAPI՝ `docs/openapi/shop-api.yaml`։

*Նշումներ.* 12.1 — `/api/search/instant`։ 12.2 — **սերվերային persist**՝ `GET`/`POST /api/v1/wishlist`, `DELETE /api/v1/wishlist/{productId}`, `POST /api/v1/wishlist/merge` (JWT) — DB `wishlists` / `wishlist_items`, հյուրի համար `shop_wishlist_session` cookie կամ `x-wishlist-session` header։ 12.3 — հիմնականում localStorage, ոչ թե սերվերային persist։

**12.6 ✅ ավարտված (2026-04-17).** `POST /api/v1/contact` — **Zod** վալիդացիա (`name`, `email`, `subject`, `message` — երկարության վերին սահմաններ), **honeypot** `hp` դաշտ (ոչ `website` — autofill-ից խուսափելու համար) (ոչ դատարկ՝ `400` ընդհանուր հաղորդագրությամբ, DB գրառում չի կատարվում), **rate limit**՝ մինչև 5 ուղարկում/ժամ IP-ի հիման վրա (`x-forwarded-for` / `x-real-ip`) — **Upstash Ratelimit** (`UPSTASH_REDIS_REST_`*), այլապես **in-memory** fallback (dev/մեկ instance)։ **Cloudflare Turnstile** — կամընտիր՝ երբ `TURNSTILE_SECRET_KEY` է սահմանված, մարմնում պահանջվում է `turnstileToken` (սերվերը verify-ում է `siteverify` API-ով)։ Կոդ՝ `src/lib/schemas/contact-form.schema.ts`, `contact-rate-limit.service.ts`, `contact-turnstile.service.ts`, `src/app/api/v1/contact/route.ts`։

---

## Նշումներ

- Աղբյուրը `**shop-marco-code-plan.md`**-ն է. frontend-only կետերը (zoom UI, skeleton, և այլն) ներառված չեն, եթե առանձին backend չի պահանջում։
- **QA & launch** փուլի E2E, cross-browser, CWV-ը հիմնականում QA/frontend/ops են. **Monitoring / error tracking** (Sentry, logs) — ըստ թիմի պատասխանատվության, կարող են ավելացվել infra առաջադրանքների մեջ։

