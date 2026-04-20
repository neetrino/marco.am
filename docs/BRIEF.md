# Նախագծի տեխզադրանք — Shop Marco

> Փաստերն ըստ repo-ի ընթացիկ կոդի և `docs/API_CONTRACT.md` / `docs/BACKEND_ARCHITECTURE.md`։ Ինչ որ բան բիզնեսով հաստատված չէ — նշված է **TBD**։

---

## Նկարագրություն

**Shop Marco** — բազմալեզու e-commerce հարթակ (Next.js 16 App Router)՝ ապրանքների կատալոգով, զամբյուղով և պատվերի հոսքով, օգտատիրոջ հաշվարկով (login/register), ակնարկներով (reviews), ինչպես նաև **`/supersudo` վարչական միջավայրով** (ապրանքներ, պատվերներ, կատեգորիաներ, բրենդներ, հաղորդագրություններ, վերլուծություն և այլն)։ HTTP API-ն REST JSON է՝ **`/api/v1/...`** տակ (մանրամասները՝ `docs/API_CONTRACT.md`)։

**Արտադրանքի հանրային անվանումը և դոմենը** (ընդդեմ `whiteshop.am` package անվան repo-ում) — **TBD** (հաստատել սեփականատիրոջ կողմից)։

## Թիրախային լսարան

- **Վերջնական օգտվողներ** — ապրանքներ գնող օգտատերեր (կատալոգ, զամբյուղ, checkout, պատվերների պատմություն, wishlist, աջակցություն)։
- **Բովանդակության / օպերացիայի խումբ** — ադմինիստրատորներ `supersudo` միջավայրում։

Լocale-ների ճշգրիտ ցանկը և i18n քաղաքականությունը — **TBD** (կոդում կա լեզվի տրամաբանություն; մանրամասները հաստատել թիմով)։

## Հիմնական ֆունկցիաներ (առաջնայնացված)

1. **Կատալոգ և ֆիլտրեր** (կատեգորիաներ, բրենդներ, ատրիբուտներ) — առաջնայնություն՝ բարձր  
2. **Զամբյուղ, checkout, պատվերներ** — բարձր  
3. **Օգտվողի հաշիվ, պրոֆիլ, wishlist** — միջին  
4. **Ակնարկներ (reviews), reels, աջակցության/քաղաքականության էջեր** — միջին  
5. **Admin (`/supersudo`)** — բարձր (օպերացիոն կառավարում)

## Stack (ըստ repo-ի)

- **Monorepo** — `pnpm` workspace (`pnpm-workspace.yaml`, root `package.json`)  
- **App** — Next.js **16.x** (App Router), React 18, TypeScript strict  
- **Ոճեր** — Tailwind CSS 3.x (root devDependencies)  
- **UI** — `@shop/ui`, `@shop/design-tokens` workspace packages  
- **Տվյալների շերտ** — PostgreSQL + Prisma (`@white-shop/db`, `shared/db/prisma`)  
- **API** — Next.js Route Handlers `src/app/api/v1/**`  
- **Auth** — JWT Bearer (տես `docs/API_CONTRACT.md` բաժին 2)  
- **Արտաքին SDK-ներ** — `@aws-sdk/client-s3` (object storage), `@upstash/redis` / `@upstash/ratelimit`, `jose`, `bcryptjs` և այլն (`package.json`)

Նշում. Արտաքին ինտեգրացիաների (վճարային, email PS) **կոնկրետ մատակարարները** — **TBD**, եթե չեն արձանագրված deploy/env փաստաթղթերում։

## Դիզայն

- Figma. **TBD**
- UI Kit — `@shop/ui` + design tokens (`shared/design-tokens`)

## Ինտեգրացիաներ (վիճակը ըստ կոդի/փաստաթղթերի)

- [x] Աուտենտիֆիկացիա — JWT (REST), մանրամասները `API_CONTRACT.md`  
- [x] Ֆայլերի/օբյեկտների պահոց — S3-համատեղելի (`@aws-sdk/client-s3`) — bucket/credentials՝ env  
- [x] Cache / rate limit — Upstash (ըստ կարգավորման)  
- [ ] Վճարային համակարգ (PSP) — **TBD** (checkout կոդ կա; պայմանագիր հաստատել)  
- [ ] Email / տրանզակցիոն նամակներ — **TBD**

## Կոնտենտի լեզու

- **Ինտերֆեյսի բազային լեզուներ** — repo-ում կան բազմալեզու/string resources; մեկ primary marketing լեզու — **TBD**  
- **i18n** — կիրառվում է (լեզվի preference / բազմալեզու դաշտեր) — մանրամասները **TBD**

## Սահմանափակումներ

- **Deploy** — տվյալ host-ը և production URL-ը **TBD**։ Repo-ում կա Vercel-ին համապատասխան env/կառուցվածք (`deployment-env`, `vercel.json` — տես կոդը)։  
- **Ժամկետներ / բյուջե** — **TBD**

## Լրացուցիչ

- Նորմատիվ բազա (`eslint.config.mjs`, `.cursor/rules/`) — տես repo root և `docs/TECH_CARD.md`։

## Կապված փաստաթղթեր

- [`TECH_CARD.md`](./TECH_CARD.md)  
- [`01-ARCHITECTURE.md`](./01-ARCHITECTURE.md)  
- [`API_CONTRACT.md`](./API_CONTRACT.md)  
- [`BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md)
