# Shop Marco — e-commerce (Next.js)

Production-oriented **Next.js App Router** storefront and **`/supersudo`** admin, backed by **REST APIs** under `src/app/api/v1/**`, **Prisma** + PostgreSQL in `shared/db`, and workspace packages `@shop/ui`, `@shop/design-tokens`, `@white-shop/db`.

**Repository note:** The npm package name at the repo root is `whiteshop.am` (`package.json`). Product and API docs use the name **Shop Marco**. Public marketing domain / deployment target — **TBD** (confirm with product owner).

---

## What’s in the repo

| Area | Location |
|------|----------|
| Storefront & static pages | `src/app/` (routes: products, cart, checkout, profile, orders, wishlist, support, policy pages, reels, …) |
| Admin UI | `src/app/supersudo/` |
| HTTP API | `src/app/api/v1/**` (versioned contract: `docs/API_CONTRACT.md`) |
| Business & infra code | `src/lib/` (services, middleware, auth helpers, …) |
| UI kit & tokens | `shared/ui`, `shared/design-tokens` |
| Database (Prisma) | `shared/db` |

Authoritative human-readable API contract: [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md). Backend-oriented overview: [`docs/BACKEND_ARCHITECTURE.md`](./docs/BACKEND_ARCHITECTURE.md).

---

## Prerequisites

- **Node.js** ≥ 20 (`package.json` `engines`)
- **pnpm** 9.x (`packageManager` field)

---

## Quick start

```bash
pnpm install
cp .env.example .env   # then fill secrets (see .env.example comments)
pnpm dev                 # http://localhost:3000
```

Other useful scripts: `pnpm build`, `pnpm lint`, `pnpm test`, Prisma helpers under `pnpm db:*` (see root `package.json`).

---

## Documentation map

| Document | Purpose |
|----------|---------|
| [`docs/BRIEF.md`](./docs/BRIEF.md) | Project brief (audience, scope, stack facts) |
| [`docs/TECH_CARD.md`](./docs/TECH_CARD.md) | Technology and integration decisions (with TBD where unconfirmed) |
| [`docs/01-ARCHITECTURE.md`](./docs/01-ARCHITECTURE.md) | High-level architecture and folder layout |
| [`docs/PROGRESS.md`](./docs/PROGRESS.md) | Delivery / docs progress (update when milestones change) |
| [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) | HTTP API contract |
| [`.cursor/rules/`](./.cursor/rules/) | Cursor AI rules for this codebase |

---

## Quality gates

- **TypeScript:** `strict` (see `tsconfig.json`).
- **Lint:** `pnpm lint` — ESLint with a **ratchet** on warning count (see root `package.json` and `eslint.config.mjs`). Do not raise the cap when introducing new issues; fix or tighten incrementally.

---

## Governance

- **Secrets:** never commit real keys; use `.env` locally and host env in deployment — see `00-core.mdc` and `.env.example`.
- **Large refactors / stack changes:** align with maintainers per `.cursor/rules/00-core.mdc`.

---

## License

See [`LICENSE`](./LICENSE) if present; otherwise internal / TBD.
