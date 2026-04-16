# Shop Marco — e-commerce (functional spec)

Հիմք՝ `Shop - Marco - code.md`։ Նպատակը՝ եռալեզու (AM primary, RU, EN) էլեկտրոնիկայի **public shop**, **customer account**, **admin panel**, **checkout**, **analytics**։

**Bitrix (կարևոր).** Sync-սկրիպտը ներկայումս **միշտ ստեղծում է նոր Scrum epic-ներ** — կրկնումից խուսափելու համար մինչև `npm run sync` ստուգեք պորտալում արդեն գոյություն ունեցող epic-ների անունները, կամ համաձայնեցրեք սկրիպտի դեդուպ լոգիկա։ YAML-ը և sync-ը — **միայն ձեր հաստատումից հետո** (workspace կանոններ)։

**Epic mode (YAML).** Թողնել `scrum` կամ `parent_tasks` — ըստ `plans/example.plan.yaml`։

---

## Infra & i18n

Պրոյեկտի հիմք, միջավայր, բազմալեզու shell։

- **Նախագծել stack-ը և repo կառուցվածքը** — frontend (օր. Next.js), styling, component library; folder structure։
- **Կարգավորել development / staging / production environments** — env variables, build, deploy pipeline։
- **Ներդնել i18n (AM / RU / EN)** — routing կամ locale prefix, translation files, fallback, SEO meta per locale։
- **Սահմանել design tokens և global layout** — typography, spacing, responsive breakpoints, header/footer shell։
- **Հաստատել API կոնտրակտը backend-ի հետ** — REST/GraphQL, auth headers, error handling։

---

## Home

Գլխավոր էջ՝ hero, reels block, featured, promos, trust, reviews, brands, footer։

- **Ռեալիզացնել Hero / banner section** — CMS կամ admin-ից կառավարելի content, CTA։
- **Ռեալիզացնել Featured products section** — bestsellers կամ curated list, link դեպի PDP։
- **Ռեալիզացնել Promotions / special offers block** — ակցիաներ, զեղչեր։
- **Ռեալիզացնել «Why choose us» section** — 3–4 առավելություն (warranty, fast delivery, installment, original products)։
- **Ռեալիզացնել customer reviews carousel** — rating, text, optional photos։
- **Ռեալիզացնել brand partners section** — brand logos grid։
- **Ռեալիզացնել footer** — contacts, social links, map embed, legal/quick links։
- **Ռեալիզացնել Reels section (home)** — կամ deep link դեպի Reels page (տես Reels epic)։

---

## Shop (PLP)

Ապրանքների ցուցակ, sort, filters։

- **Ռեալիզացնել product grid** — image, title, key specs, price, brand, warranty badge։
- **Ռեալիզացնել sorting** — price ASC/DESC, newest, popular։
- **Ռեալիզացնել filters** — brand, price range, category, technical specs (faceted կամ step filters)։
- **Ռեալիզացնել pagination կամ infinite scroll** — performance և SEO։
- **Ռեալիզացնել empty state և loading states** — skeleton UI։

---

## Product (PDP)

Մեկ ապրանքի էջ։

- **Ռեալիզացնել product gallery** — multiple images, zoom (lightbox կամ inline zoom)։
- **Ցուցադրել product info** — short և full description։
- **Ռեալիզացնել technical specifications table** — structured attributes։
- **Ռեալիզացնել pricing UI** — current price, old price, discount badge։
- **Ռեալիզացնել quantity selector և Add to cart** — client-side cart state կամ API։
- **Ցուցադրել stock status** — in stock / out of stock։
- **Ռեալիզացնել related products** — recommendation rule։
- **Ռեալիզացնել reviews section** — rating aggregate, comments list, submit review (policy-ով)։

---

## Checkout & payments

Պատվերի ձևակերպում և վճարման եղանակներ։

- **Ռեալիզացնել checkout form** — name, surname, phone, email, address, notes։
- **Ռեալիզացնել delivery method selection** — integration hint (օր. Yandex delivery) admin business rules-ի հետ։
- **Ցուցադրել delivery cost և order total** — dynamic recalculation։
- **Ռեալիզացնել payment method selection** — card vs cash (UI + order payload)։
- **Ռեալիզացնել order confirmation** — order ID, summary email/SMS (եթե scope-ում է)։
- **Ռեալիզացնել validation և error handling** — client + server։

---

## Account

Հաճախորդի պրոֆիլ։

- **Ռեալիզացնել registration / login** — email կամ phone, verification flow (եթե պահանջվում է)։
- **Ռեալիզացնել order history** — status, reorder entry point։
- **Ռեալիզացնել reorder** — cart prefill from past order։
- **Ռեալիզացնել address management** — CRUD shipping addresses։
- **Ռեալիզացնել personal data management** — edit profile, password/security։

---

## Admin: catalog & promos

Ապրանքներ, կատեգորիաներ, բաններ, ակցիաներ, **Product class** logic։

- **Ռեալիզացնել product CRUD** — images, specs, pricing, stock, brand, categories։
- **Ռեալիզացնել Product class: Retail / Wholesale** — field per SKU/product։
- **Ռեալիզացնել delivery rules** — Retail-only → Yandex delivery; Wholesale կամ mixed cart → free delivery (server-side enforcement)։
- **Ռեալիզացնել promo codes և discounts** — rules, limits, date ranges։
- **Ռեալիզացնել banner management** — slots, scheduling, links։
- **Ռեալիզացնել categories management** — tree, SEO fields։

---

## Admin: orders

Պատվերների կառավարում։

- **Ռեալիզացնել orders list** — filters: New, In process, Delivered, Canceled։
- **Ռեալիզացնել order details view** — line items, customer, payment, delivery։
- **Ռեալիզացնել order status updates** — audit trail կամ timestamp։
- **Ավելացնել admin comment field** — internal notes։

---

## Admin: analytics

Dashboard վիճակագրություն։

- **Ռեալիզացնել sales KPIs** — total orders, revenue, AOV։
- **Ռեալիզացնել order status breakdown** — by status, today / week / month։
- **Ռեալիզացնել product analytics** — top 5 best sellers, least selling։
- **Ռեալիզացնել stock analytics** — low stock, out of stock lists։
- **Ռեալիզացնել customer analytics** — new vs repeat, top customers by spend։
- **Ռեալիզացնել dashboard widgets** — today’s sales, monthly sales, top product։

---

## Reels

Տեսադարան vertical feed։

- **Ռեալիզացնել dedicated Reels page** — vertical video feed UI։
- **Ռեալիզացնել like functionality** — vertical video feed-ում։
- **Ռեալիզացնել mute/unmute և play/pause** — mobile-friendly gestures։
- **Հաստատել content source** — admin upload vs external URLs, moderation։

---

## Site-wide

Global search, wishlist, compare, static pages։

- **Ռեալիզացնել global search** — products, categories; debounce; empty results։
- **Ռեալիզացնել wishlist** — persist per user/session։
- **Ռեալիզացնել compare products** — spec diff table, max N items։
- **Ռեալիզացնել About Us, Contact Us, brand pages** — CMS կամ static content։
- **Ռեալիզացնել legal pages** — Privacy Policy, Terms & Conditions, Refund Policy, Delivery Policy (per locale)։
- **Ռեալիզացնել contact form** — validation, spam protection։
- **SEO և accessibility pass** — meta, structured data, keyboard, contrast։

---

## QA & launch

Վերջնական որակ և գործարկում։

- **Ստեղծել E2E smoke suite** — home → PLP → PDP → cart → checkout (happy path)։
- **Կատարել cross-browser և mobile testing**։
- **Պլանավորել performance** — Core Web Vitals, image optimization։
- **Պլանավորել monitoring և error tracking** — օր. Sentry, logs։
- **Պատրաստել launch checklist** — DNS, SSL, backups, rollback։
