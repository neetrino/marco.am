# Marco.am տեխնոլոգիական քարտ

**Նախագծի չափ.** B — medium, feature-based  
**Ամսաթիվ.** 2026-08-05  
**Ստատուս.** հաստատված՝ գործող codebase-ի հիման վրա

## Հիմք

- Node.js ≥20, pnpm workspace, TypeScript strict
- Next.js 16 App Router, React 19, Tailwind CSS
- Next.js Route Handlers, REST API, Zod validation
- PostgreSQL + Prisma
- Custom JWT authentication with admin RBAC
- Cloudflare R2 for images and videos
- React Query for client server-state where required
- Vitest for automated tests

## Ճարտարապետություն

- Modular Next.js application with route-local UI and shared domain services.
- UI routes live in `src/app`; reusable logic lives in `src/lib`.
- Database package and Prisma schema live in `shared/db`.
- API routes are versioned under `src/app/api/v1`.

## Անվտանգություն

- Protected admin routes validate authentication and authorization server-side.
- External input is validated at API boundaries.
- Uploads enforce MIME type, file-size, and video-codec restrictions.
- Secrets are environment variables and are not exposed to client bundles.

## Reels media policy

- Admin videos are uploaded to Cloudflare R2 through the protected upload route.
- Accepted formats: MP4, WebM, MOV, and OGV; maximum size: 200 MB.
- MP4/MOV files must use the browser-compatible H.264/AVC codec.
- Stored admin-upload URLs must belong to the configured R2 public base URL.
