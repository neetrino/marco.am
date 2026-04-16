# Shop Marco — backend առաջադրանքներ (փուլերով)

> Աղբյուր. [`shop-marco-code-plan.md`](./shop-marco-code-plan.md) (functional spec) — **backend** շերտին և API/CMS պահանջվող կետերը։  
> Ճարտարապետության ամփոփում. [`BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md)

**Վերջին թարմացում.** 2026-04-16

---

## Ինչպես թարմացնել առաջընթացը

1. **Առանձին task** — `Կատարման %` սյունակում գրել `0`–`100`։  
2. **Կարգավիճակ** — `⬜ Չսկսված` \| `🔄 Ընթացիկ` \| `✅ Ավարտված` (կամ փոխարինել checkbox-ներով ներքևի աղյուսակներում)։  
3. **Փուլի %** — տողում **Փուլի առաջընթաց** — կարող եք դնել **task-ների միջին արժեք** (հաշվարկ՝ բոլոր task-ների % գումար / task-ների քանակ)։

Օրինակ. 4 task՝ 100%, 100%, 50%, 0% → փուլ ≈ **62.5%**։

---

## Ընդհանուր ամփոփ աղյուսակ

| Փուլ | Անվանում | Փուլի առաջընթաց |
|------|----------|------------------|
| 1 | Infra & API կոնտրակտ | `0%` |
| 2 | Գլխավոր էջ (Home) — տվյալներ | `0%` |
| 3 | Shop (PLP) — կատալոգ API | `0%` |
| 4 | Ապրանքի էջ (PDP) — մանրամասն API | `0%` |
| 5 | Checkout — պատվեր | `0%` |
| 6 | Վճարման եղանակներ | `0%` |
| 7 | Օգտատիրոջ հաշիվ (Account) | `0%` |
| 8 | Admin — catalog & promos | `0%` |
| 9 | Admin — orders | `0%` |
| 10 | Admin — analytics | `0%` |
| 11 | Reels | `0%` |
| 12 | Site-wide & i18n (API) | `0%` |

**Ընդհանուր նախագծի առաջընթաց (backend).** `0%` — *(12 փուլերի միջին, կամ կշռված ըստ թիմի)*։

---

## Փուլ 1 — Infra & API կոնտրակտ

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 1.1 | Հաստատել API կոնտրակտը frontend-ի հետ — REST կամ GraphQL, auth headers, սխալների մոդել | 0 | ⬜ |
| 1.2 | Միջավայրեր (dev / staging / prod) — env, build/deploy-ին համապատասխան կոնֆիգ (ըստ թիմի պատասխանատվության) | 0 | ⬜ |

---

## Փուլ 2 — Գլխավոր էջ (Home)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 2.1 | Hero / banner — CMS կամ admin-ից կառավարելի կոնտենտ, CTA (ցուցակ, ակտիվություն, կարգ) | 0 | ⬜ |
| 2.2 | Featured products — bestsellers կամ curated list, տվյալներ PDP հղման համար | 0 | ⬜ |
| 2.3 | Promotions / special offers բլոկի տվյալներ | 0 | ⬜ |
| 2.4 | «Why choose us» — 3–4 առավելություն (warranty, fast delivery, installment, original products) — CMS կամ structured API | 0 | ⬜ |
| 2.5 | Հաճախորդների կարծիքների carousel — rating, տեքստ, լուսանկարներ (եթե կան) | 0 | ⬜ |
| 2.6 | Brand partners — բրենդների մետատվյալներ + լոգո asset URL | 0 | ⬜ |
| 2.7 | Footer — կոնտակտ, սոց հղումներ, քարտեզ embed, legal/quick links (կոնֆիգ/CMS endpoint) | 0 | ⬜ |
| 2.8 | Reels section (home) — կարճ ցուցակ / նախադիտում կամ deep link դեպի Reels էջ (տես Փուլ 11) | 0 | ⬜ |

---

## Փուլ 3 — Shop (Product listing)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 3.1 | Ապրանքների ցուցակ API — նկար, անվանում, հիմնական սպեկներ, գին, բրենդ, warranty badge | 0 | ⬜ |
| 3.2 | Sorting — price ASC/DESC, newest, popular | 0 | ⬜ |
| 3.3 | Filters — brand, price range, category | 0 | ⬜ |
| 3.4 | Filters — technical specs (faceted կամ step filters, schema-ից դինամիկ) | 0 | ⬜ |
| 3.5 | Pagination կամ cursor API — infinite scroll / SEO-ի համար էջավորում | 0 | ⬜ |

---

## Փուլ 4 — Product (PDP)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 4.1 | Product gallery — մի քանի պատկերներ, metadata | 0 | ⬜ |
| 4.2 | Կարճ և լիարժեք նկարագրություն (i18n դաշտեր) | 0 | ⬜ |
| 4.3 | Technical specifications table — structured attributes | 0 | ⬜ |
| 4.4 | Գնային դաշտեր — current price, old price, discount badge inputs | 0 | ⬜ |
| 4.5 | Quantity + Add to cart — զամբյուղի API (կլիենտ state-ի հետ համաձայնեցված) | 0 | ⬜ |
| 4.6 | Պահեստի կարգավիճակ — in stock / out of stock | 0 | ⬜ |
| 4.7 | Related products — recommendation rule (կատեգորիա/բրենդ/այլ) | 0 | ⬜ |
| 4.8 | Reviews — rating aggregate, ցուցակ, review submit (policy + auth, եթե պահանջվում է) | 0 | ⬜ |

---

## Փուլ 5 — Checkout

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 5.1 | Պատվերի սևագիր / validate — անուն, ազգանուն, հեռախոս, email, հասցե, նշումներ | 0 | ⬜ |
| 5.2 | Delivery method — ինտեգրացիայի hint (օր. Yandex delivery) + admin business rules | 0 | ⬜ |
| 5.3 | Delivery cost և order total — դինամիկ վերահաշվարկ API | 0 | ⬜ |
| 5.4 | Payment method ընտրություն — card vs cash, order payload | 0 | ⬜ |
| 5.5 | Order confirmation — order ID, summary (email/SMS — եթե scope-ում է) | 0 | ⬜ |
| 5.6 | Validation և error handling — client + server միասնական մոդել | 0 | ⬜ |
| 5.7 | Սերվերային գնային վերահսկում — զամբյուղի հետ համաձայնեցում | 0 | ⬜ |

---

## Փուլ 6 — Վճարման եղանակներ

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 6.1 | Քարտային վճարում — PSP ինտեգրացիա, session/webhook, կարգավիճակների flow | 0 | ⬜ |
| 6.2 | Կանխիկ վճարում — պատվերի մեթոդ, կարգավիճակների flow | 0 | ⬜ |

---

## Փուլ 7 — Account (հաճախորդի պրոֆիլ)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 7.1 | Registration / Login — email **կամ** phone, verification flow (եթե պահանջվում է) | 0 | ⬜ |
| 7.2 | Order history — կարգավիճակ, reorder entry point-ի տվյալներ | 0 | ⬜ |
| 7.3 | Reorder — նախորդ պատվերից զամբյուղի prefill / նոր պատվեր | 0 | ⬜ |
| 7.4 | Address management — shipping հասցեների CRUD | 0 | ⬜ |
| 7.5 | Personal data — edit profile, password/security | 0 | ⬜ |

---

## Փուլ 8 — Admin: catalog & promos

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 8.1 | Product CRUD — images, specs, pricing, stock, brand, categories | 0 | ⬜ |
| 8.2 | Product class — Retail / Wholesale դաշտ SKU/ապրանքի վրա | 0 | ⬜ |
| 8.3 | Delivery rules — Retail-only → Yandex delivery; Wholesale կամ mixed cart → free delivery (**սերվերային enforcement**) | 0 | ⬜ |
| 8.4 | Promo codes և discounts — rules, limits, date ranges | 0 | ⬜ |
| 8.5 | Banner management — slots, scheduling, links | 0 | ⬜ |
| 8.6 | Categories management — tree, SEO fields | 0 | ⬜ |

---

## Փուլ 9 — Admin: orders

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 9.1 | Orders list — filters: New, In process, Delivered, Canceled | 0 | ⬜ |
| 9.2 | Order details — line items, customer, payment, delivery | 0 | ⬜ |
| 9.3 | Order status updates — audit trail կամ timestamp | 0 | ⬜ |
| 9.4 | Admin comment field — internal notes | 0 | ⬜ |

---

## Փուլ 10 — Admin: analytics

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 10.1 | Sales KPIs — total orders, revenue, AOV | 0 | ⬜ |
| 10.2 | Order status breakdown — by status, today / week / month | 0 | ⬜ |
| 10.3 | Product analytics — top 5 best sellers, least selling | 0 | ⬜ |
| 10.4 | Stock analytics — low stock, out of stock lists | 0 | ⬜ |
| 10.5 | Customer analytics — new vs repeat, top customers by spend | 0 | ⬜ |
| 10.6 | Dashboard widgets — today’s sales, monthly sales, top product | 0 | ⬜ |

---

## Փուլ 11 — Reels

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 11.1 | Content source — admin upload vs external URLs, moderation workflow | 0 | ⬜ |
| 11.2 | Vertical feed — մետատվյալներ (URL, poster, order) | 0 | ⬜ |
| 11.3 | Like functionality — like/unlike, հաշվարկ օգտատիրոջ համար | 0 | ⬜ |

*(Mute/Play/Pause — հիմնականում client; եթե view-ներն են պահանջվում analytics-ի համար, ավելացնել առանձին event API։)*

---

## Փուլ 12 — Site-wide & i18n (API)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 12.1 | Global search — ապրանքներ, կատեգորիաներ; suggest/debounce-ի համար API | 0 | ⬜ |
| 12.2 | Wishlist — persist per user/session | 0 | ⬜ |
| 12.3 | Compare products — spec diff-ի համար ցուցակ, max N ապրանք | 0 | ⬜ |
| 12.4 | About Us, Contact Us, brand pages — CMS կամ static content API | 0 | ⬜ |
| 12.5 | Legal pages — Privacy, Terms, Refund, Delivery Policy (**per locale**) | 0 | ⬜ |
| 12.6 | Contact form — validation, spam protection | 0 | ⬜ |
| 12.7 | i18n — AM primary, RU, EN — թարգմանվող էնտիտիների սխեմա, API-ում locale / `Accept-Language`, fallback | 0 | ⬜ |
| 12.8 | Admin — թարգմանությունների խմբագրում կամ import workflow (եթե պահանջվում է) | 0 | ⬜ |
| 12.9 | SEO structured data — backend-ից անհրաժեշտ մետատվյալներ (ըստ frontend պայմանագրի) | 0 | ⬜ |

---

## Նշումներ

- Աղբյուրը **`shop-marco-code-plan.md`**-ն է. frontend-only կետերը (zoom UI, skeleton, և այլն) ներառված չեն, եթե առանձին backend չի պահանջում։
- **QA & launch** փուլի E2E, cross-browser, CWV-ը հիմնականում QA/frontend/ops են. **Monitoring / error tracking** (Sentry, logs) — ըստ թիմի պատասխանատվության, կարող են ավելացվել infra առաջադրանքների մեջ։
