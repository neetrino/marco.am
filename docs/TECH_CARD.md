# Նախագծի տեխնոլոգիական քարտ — Shop Marco

> Լրացված է **repo-ի ընթացիկ կոդի** և `package.json` / `pnpm-workspace.yaml` հիման վրա։ Չհաստատված բիզнес/ինֆրա որոշումները նշված են **TBD**։ Լրիվ կաղապարի աղյուսակը՝ `docs/reference/templates/TECH_CARD_TEMPLATE.md`։

**Նախագիծ.** Shop Marco (npm package root — `whiteshop.am`)  
**Չափ.** **B — միջին** (ինտերնետ-խանութ + admin + monorepo packages) — հաստատել թիմով  
**Ամսաթիվ.** 2026-04-20  
**Ստատուս.** սևագիր → **ընթացքում** (փաստաթղթավորումը համաձայնեցվում է)

---

## 1. Հիմք

| # | Պարամետր | Որոշում | Ստատուս | Նշում |
|---|----------|---------|---------|-------|
| 1.1 | Նախագծի չափ | B (առաջարկ) | 🔄 | Հաստատել `00-core.mdc`-ում |
| 1.2 | Ճարտարապետություն | Next.js monolith + shared packages | ✅ | `shared/*`, `src/app/api` |
| 1.3 | Package manager | pnpm 9.x | ✅ | `packageManager` |
| 1.4 | Node.js | ≥ 20 | ✅ | `engines` |
| 1.5 | TypeScript | 5.x, `strict: true` | ✅ | root `tsconfig` |
| 1.6 | Monorepo | pnpm workspaces (`shared/*`) | ✅ | ոչ Turborepo |
| 1.7 | Git | trunk/main + PR | 🔄 | TBD թիմային |
| 1.8 | Commits | Conventional Commits | 🔄 | `.commitlintrc.json` կա |

---

## 2. Frontend (Next.js app)

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 2.1 | Framework | Next.js **16.1.x** App Router | ✅ |
| 2.2 | React | 18.3 | ✅ |
| 2.3 | Ոճեր | Tailwind CSS **3.4** | ✅ |
| 2.4 | UI | `@shop/ui`, `@shop/design-tokens` | ✅ |
| 2.5 | Ձևեր | react-hook-form + zod | ✅ |
| 2.6 | Դետա | RSC + fetch/route handlers | ✅ |
| 2.7 | i18n | Բազմալեզու UI / preference | 🔄 | Մանրամասները BRIEF |

---

## 3. Backend (API շերտ)

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 3.1 | Տիպ | Next.js Route Handlers `src/app/api/**` | ✅ |
| 3.2 | Վալիդացիա | zod (+ service շերտ) | ✅ |
| 3.3 | API | REST JSON, `/api/v1/...` | ✅ | `API_CONTRACT.md` |
| 3.4 | Rate limiting | Upstash (ըստ env) | 🔄 | `@upstash/ratelimit` |
| 3.5 | Docs | OpenAPI + `API_CONTRACT.md` | 🔄 | `docs/openapi/` |

---

## 4. Բազա և cache

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 4.1 | ՍՈԲ | PostgreSQL | ✅ | Neon/host — **TBD** |
| 4.2 | ORM | Prisma 5.x (`@white-shop/db`) | ✅ | `shared/db` |
| 4.3 | Cache | Upstash Redis | 🔄 | env |

---

## 5. Ինքնություն

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 5.1 | Մոդել | JWT Bearer | ✅ | `API_CONTRACT.md` §2 |
| 5.2 | Admin | `admin` role | ✅ | supersudo routes |
| 5.3 | Գաղտնաբառ | bcrypt | ✅ | `bcryptjs` |

---

## 6. Պահոց (ֆայլեր)

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 6.1 | Object storage | S3-compatible (`@aws-sdk/client-s3`) | ✅ | bucket — env |

---

## 7. Արտաքին սերվիսներ (ընդհանուր)

| Ծառայություն | Կարգավիճակ | Նշում |
|--------------|--------------|-------|
| Վճարային PSP | **TBD** | Checkout/վճարում — հաստատել |
| Email | **TBD** | |
| Անալիտիկա | **TBD** | |
| Error tracking (Sentry) | **TBD** | |

---

## 8. DevOps

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 8.1 | Hosting | Next deploy (Vercel-ին պատրաստվածություն repo-ում) | 🔄 | հասցե **TBD** |
| 8.2 | Env | `.env.example` | ✅ | |
| 8.3 | CI | **TBD** | `.github/` ստուգել |

---

## 9. Թեստավորում

| # | Պարամետր | Որոշում | Ստատուս |
|---|----------|---------|---------|
| 9.1 | Unit / integration | Vitest | ✅ | `pnpm test` |
| 9.2 | Coverage թիրախ | **TBD** | |

---

## 10. Նախագծի փաստաթղթավորում (կարգավիճակ)

| Փաստաթուղթ | Ստատուս |
|-------------|---------|
| `docs/BRIEF.md` | ✅ (ըստ կոդի) |
| `docs/TECH_CARD.md` | ✅ (սա) |
| `docs/01-ARCHITECTURE.md` | ✅ |
| `docs/PROGRESS.md` | ✅ |
| Root `README.md` | ✅ |

---

## 11. ESLint / որակ (ըստ repo-ի)

- **Ratchet:** `pnpm lint` → `--max-warnings` կորստը կոդում (տես root `package.json`, `eslint.config.mjs`)։ Նոր զգուշացումներ ավելացնել չի թույլատրվում առանց վերանայման։

---

**Հաջորդ քայլեր (մարդկային).** Հաստատել B չափը `00-core.mdc`-ում, լցնել hosting/PSP/TBD տողերը, ապա այս քարտի ստատուսները փոխել **հաստատված**։
