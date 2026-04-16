# Shop Marco — backend առաջադրանքներ (փուլերով)

> Աղբյուր. `Shop - Marco - code (2).pdf` (Functional Specification) — **backend** շերտին վերաբերող և API/CMS պահանջվող կետերը։  
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
| 1 | Գլխավոր էջ (Home) — տվյալներ | `0%` |
| 2 | Shop — կատալոգ API | `0%` |
| 3 | Ապրանքի էջ — մանրամասն API | `0%` |
| 4 | Checkout — պատվեր | `0%` |
| 5 | Վճարման եղանակներ | `0%` |
| 6 | Օգտատիրոջ հաշիվ | `0%` |
| 7 | Admin panel | `0%` |
| 8 | Reels / video feed | `0%` |
| 9 | Այլ էջեր և գլոբալ ֆիչեր | `0%` |
| 10 | Բազմալեզու (hy / ru / en) | `0%` |

**Ընդհանուր նախագծի առաջընթաց (backend).** `0%` — *(10 փուլերի միջին, կամ կշռված ըստ թիմի)*։

---

## Փուլ 1 — Գլխավոր էջ (Home)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 1.1 | Hero / banner կոնտենտի API (ցուցակ, ակտիվություն, կարգ) | 0 | ⬜ |
| 1.2 | Reels-ի համար կարճ ցուցակ / նախադիտում (եթե առանձին էջից reuse) | 0 | ⬜ |
| 1.3 | Featured products endpoint (ամենավաճառվող / ձեռքով ընտրված SKU) | 0 | ⬜ |
| 1.4 | Promotions / special offers բլոկի տվյալներ | 0 | ⬜ |
| 1.5 | «Why choose us» բլոկ — CMS կամ key-value API (3–4 կետ) | 0 | ⬜ |
| 1.6 | Հաճախորդների կարծիքների carousel — reviews API (ընդհանուր կամ home-ի համար ֆիլտր) | 0 | ⬜ |
| 1.7 | Brand section — գործընկեր բրենդների մետատվյալներ + լոգո asset URL | 0 | ⬜ |
| 1.8 | Footer — կոնտակտ, սոց հղումներ, քարտեզ (կոնֆիգ/ CMS endpoint) | 0 | ⬜ |

---

## Փուլ 2 — Shop (Product listing)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 2.1 | Ապրանքների ցուցակ API — նկար, անվանում, հիմնական սպեկներ, գին, բրենդ, warranty badge | 0 | ⬜ |
| 2.2 | Sorting. price ASC/DESC, newest, popular (ագրեգատ կամ ինդեքս) | 0 | ⬜ |
| 2.3 | Filters. brand, price range, category | 0 | ⬜ |
| 2.4 | Filters. technical specs (դինամիկ ֆիլտր՝ schema-ից) | 0 | ⬜ |

---

## Փուլ 3 — Single product page

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 3.1 | Product gallery — մի քանի պատկերներ, metadata | 0 | ⬜ |
| 3.2 | Կարճ և լիարժեք նկարագրություն (i18n դաշտեր) | 0 | ⬜ |
| 3.3 | Technical specifications table — կառուցվածքային տվյալներ | 0 | ⬜ |
| 3.4 | Գնային դաշտեր. current / old price, discount display inputs | 0 | ⬜ |
| 3.5 | Պահեստի կարգավիճակ («Առկա է» / «Առկա չէ») | 0 | ⬜ |
| 3.6 | Related products — ալգորիթմ (կատեգորիա/բրենդ) | 0 | ⬜ |
| 3.7 | Reviews section — ցուցակ, rating aggregate, ստեղծում (auth) | 0 | ⬜ |

---

## Փուլ 4 — Checkout

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 4.1 | Պատվերի սևագիր / validate. անուն, ազգանուն, հեռախոս, email, հասցե, նշումներ | 0 | ⬜ |
| 4.2 | Delivery method պահելու և գնային ազդեցությունը հաշվարկելու API | 0 | ⬜ |
| 4.3 | Payment method ընտրություն և order total / delivery cost breakdown | 0 | ⬜ |
| 4.4 | Սերվերային գնային վերահսկում (զամբյուղի հետ համաձայնեցում) | 0 | ⬜ |

---

## Փուլ 5 — Payment methods

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 5.1 | Քարտային վճարում — PSP ինտեգրացիա, client secret / session, webhook | 0 | ⬜ |
| 5.2 | Կանխիկ վճարում — պատվերի մեթոդ, կարգավիճակների flow | 0 | ⬜ |

---

## Փուլ 6 — User account (Customer profile)

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 6.1 | Registration / Login — email **կամ** phone (identifier strategy) | 0 | ⬜ |
| 6.2 | Order history API | 0 | ⬜ |
| 6.3 | Reorder — նախորդ պատվերը զամբյուղ/նոր պատվեր | 0 | ⬜ |
| 6.4 | Address management CRUD | 0 | ⬜ |
| 6.5 | Personal data management (GDPR-կարգ, delete/export եթե պահանջվի) | 0 | ⬜ |

---

## Փուլ 7 — Admin panel

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 7.1 | **Product class** — Retail / Wholesale դաշտ ապրանքում, mixed cart validation | 0 | ⬜ |
| 7.2 | **Delivery logic** — միայն Retail → Yandex; Wholesale կամ mixed → free delivery (կանոնների engine) | 0 | ⬜ |
| 7.3 | Orders list + filters (New / In process / Delivered / Canceled) | 0 | ⬜ |
| 7.4 | Order details, status update, admin comment field | 0 | ⬜ |
| 7.5 | Promo code management | 0 | ⬜ |
| 7.6 | Discounts configuration (կանոններ, շրջանակներ) | 0 | ⬜ |
| 7.7 | Banner management | 0 | ⬜ |
| 7.8 | Categories add / edit (ներառյալ i18n դաշտեր) | 0 | ⬜ |
| 7.9 | Analytics. total orders, revenue, AOV | 0 | ⬜ |
| 7.10 | Analytics. orders by status, today / week / month | 0 | ⬜ |
| 7.11 | Analytics. top 5 best-selling, least-selling | 0 | ⬜ |
| 7.12 | Analytics. low stock, out of stock | 0 | ⬜ |
| 7.13 | Analytics. new customers, repeat orders, top customers by spend | 0 | ⬜ |
| 7.14 | Dashboard widgets տվյալներ (today’s sales, monthly sales, top product) | 0 | ⬜ |

---

## Փուլ 8 — Reels / video feed

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 8.1 | Vertical video feed — աղբյուրների մետատվյալներ (URL, poster, order) | 0 | ⬜ |
| 8.2 | Like functionality — like/unlike, հաշվարկ օգտատիրոջ համար | 0 | ⬜ |

*(Mute/Play/Pause — հիմնականում client; եթե view-ներն են պահանջվում analytics-ի համար, ավելացնել առանձին event API։)*

---

## Փուլ 9 — Other pages & global features

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 9.1 | About Us, Contact Us, Brand pages — CMS կամ static JSON API | 0 | ⬜ |
| 9.2 | Legal pages (Privacy, Terms, Refund, Delivery) — տարբերակված բովանդակություն | 0 | ⬜ |
| 9.3 | Global search API (ինդեքս, suggest, pagination) | 0 | ⬜ |
| 9.4 | Wishlist — ավելացում/հեռացում/ցուցակ | 0 | ⬜ |
| 9.5 | Compare products — session կամ user-կապակցված ցուցակ | 0 | ⬜ |

---

## Փուլ 10 — Multi-language support

**Փուլի առաջընթաց.** `0%`

| ID | Առաջադրանք (backend) | Կատարման % | Կարգավիճակ |
|----|------------------------|------------|------------|
| 10.1 | Armenian (primary), Russian, English — թարգմանվող էնտիտիների սխեմա | 0 | ⬜ |
| 10.2 | API-ում `locale` / `Accept-Language` համաձայնեցում, fallback hy | 0 | ⬜ |
| 10.3 | Admin-ում թարգմանությունների խմբագրում կամ import workflow | 0 | ⬜ |

---

## Նշումներ

- PDF-ում **7.1 v** տողը անլրացուցիչ է թողնվել — architecture-ում ընկալվել է որպես **Product Type Logic** բաժնի շարունակություն։
- Frontend- only պահանջները (zoom, carousel UI, և այլն) չեն կրկնվել task-ներում, եթե backend չի պահանջում։
