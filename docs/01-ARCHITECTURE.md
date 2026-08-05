# Marco.am ճարտարապետություն

**Նախագծի չափ.** B — medium, feature-based  
**Վերջին թարմացում.** 2026-08-05

## Ընդհանուր նկարագիր

Marco.am-ը Next.js modular application է՝ storefront և Supersudo կառավարման վահանակներով։ Նույն հավելվածը տրամադրում է React UI, versioned REST API և PostgreSQL տվյալների հասանելիություն։

## Հիմնական բաղադրիչներ

- `src/app` — App Router էջեր, layouts և API route handlers
- `src/app/supersudo` — պաշտպանված կառավարման UI
- `src/lib` — domain services, schemas, authentication և integrations
- `shared/db` — Prisma schema և database package
- `packages` — ընդհանուր workspace UI և design tokens

## Տվյալների հոսք

1. Client UI-ն ուղարկում է հարցում `/api/v1` route handler-ին։
2. Route handler-ը ստուգում է authentication/authorization-ը և input-ը։
3. Domain service-ը կիրառում է բիզնես կանոնները և աշխատում Prisma/R2-ի հետ։
4. API-ն վերադարձնում է JSON կամ Problem Details սխալ։

## Reels upload

Supersudo օգտատերը ընտրում է video ֆայլ, որը protected API route-ով ստուգվում և բեռնվում է Cloudflare R2։ Reels document-ում պահպանվում է public R2 URL-ը և `admin_upload` source type-ը։ Storefront-ը ստանում է միայն ակտիվ ու հաստատված reels-ը։

## Անվտանգություն

- Admin authorization յուրաքանչյուր Supersudo API route-ում
- Zod validation և upload MIME/size/codec սահմանափակումներ
- Environment-based secrets
- R2 public URL allowlist՝ admin-upload media-ի համար
