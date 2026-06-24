# ADR: Authentication & Sessions

- **Status:** Accepted (reflects current implementation)
- **Date:** 2026-06-24
- **Scope:** Storefront + admin (`supersudo`) authentication, session validation, and RBAC.

## Context

The app is a Next.js 16 e-commerce storefront (Prisma + Neon, Upstash, Cloudflare
R2, pnpm) with an admin surface under `/supersudo`. We need authentication that:

- Works across the Node proxy (`src/proxy.ts`), API route handlers, and React
  Server Components without bundling the Prisma query engine into Edge code.
- Lets us revoke sessions immediately (logout, password change, block, role
  change) without a server-side session store.
- Keeps secrets and validation at request boundaries and supports same-origin
  CSRF protection for cookie-based requests.

## Decision

### Chosen approach: custom JWT (not Clerk / Auth.js)

We sign and verify our own JWTs instead of adopting Clerk or Auth.js. Clerk env
vars exist in `.env.example` but are commented out and unused. Rationale:

- The user model, roles, and `authEpoch` revocation already live in our Neon
  database; a custom JWT keeps auth state in one place.
- Stateless JWTs avoid a session table while `authEpoch` (see below) still gives
  us instant revocation — the main reason teams reach for stateful sessions.
- No third-party dependency or per-MAU cost for a feature set we fully control.

### Token contents and signing

Tokens are signed in `src/lib/services/auth-session.service.ts`
(`buildAuthSuccessPayload`) using `jsonwebtoken`:

```ts
jwt.sign(
  { userId: user.id, authEpoch: user.authEpoch, roles },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);
```

Payload claims: `userId`, `authEpoch` (revocation counter), `roles` (normalized
via `src/lib/constants/user-roles.ts`).

### Token transport and cookie

Issued on login / register / verify and stored in an HttpOnly cookie
`shop_auth_session` (`src/lib/auth/auth-session-cookie.ts`):

- `httpOnly: true`
- `secure: true` in production (`NODE_ENV === "production"`)
- `sameSite: "lax"`
- `path: "/"`
- `maxAge` derived from `JWT_EXPIRES_IN` (default 7 days)

Requests may also carry the token as a `Bearer` header; both the cookie and the
header are accepted by the readers in `auth-edge.ts` and `auth.ts`.

### Where sessions are validated

Two layers, both backed by a live DB check:

1. **Edge proxy** (`src/proxy.ts` → `src/lib/middleware/auth-protected-routes.ts`).
   - JWT signature verified with `jose` (`src/lib/middleware/auth-edge.ts`).
   - Session validated against live user state with `validateSessionAtEdge`
     (`src/lib/middleware/auth-session-edge.ts`): rejects when the user is
     missing, `blocked`, soft-deleted (`deletedAt`), or when the token
     `authEpoch` no longer matches `user.authEpoch`.
   - Protected pages (`/profile`, `/wishlist`, `/orders/*`, `/supersudo*`) are
     gated before HTML is served; failures redirect to `/login` (or `/` for a
     non-admin hitting `/supersudo`).
   - Protected APIs (`/api/v1/users/*`, account-scoped `/api/v1/orders/*`,
     `/api/v1/supersudo/*`) are gated and return RFC-7807 `401`/`403` JSON.

2. **Per-route in Node** (`src/lib/middleware/auth.ts`).
   - `authenticateToken` verifies the JWT with `jsonwebtoken` and re-checks the
     same live user state (blocked / deletedAt / authEpoch) before returning the
     authenticated user. Route handlers use it as defense in depth.

The proxy also strips client-supplied `x-auth-user-id` / `x-auth-roles` headers
on `/api/*` so identity can only originate server-side.

### RBAC / roles

- Roles are stored in the DB and normalized to a known set (`customer`, `admin`)
  by `normalizeUserRoles`. Tokens carry roles, but authorization decisions use
  the **live** roles re-read from the DB during validation.
- Admin gate: `/api/v1/supersudo/*` requires `admin` via `requireAdminApi`
  (`403` otherwise); `/supersudo*` pages require a live admin session via
  `sessionHasAdminRole` (redirect to `/` otherwise).
- `requireAdmin` (`src/lib/middleware/auth.ts`) provides the same check for route
  handlers.

### Session revocation (`authEpoch`)

`authEpoch` is an integer on the user row. A token is valid only while its
`authEpoch` equals the user's current value (`src/lib/auth/auth-epoch.ts`).
`bumpAuthEpoch` (`src/lib/auth/auth-epoch-mutations.ts`) increments it, instantly
invalidating every outstanding token, and is called on:

- **Logout** — `src/app/api/v1/auth/logout/route.ts` (also clears the cookie).
- **Password change** — `src/lib/services/users.service.ts`.
- **Admin block / role change** — `src/lib/services/admin/admin-users.service.ts`.

### Password policy

Defined in `src/lib/constants/password-policy.ts`: `MIN_PASSWORD_LENGTH = 8`,
`BCRYPT_ROUNDS = 12` (bcrypt via `bcryptjs`). Enforced at the schema layer
(`src/lib/schemas/auth.schema.ts`), in services
(`auth.service.ts`, `users.service.ts`), and in the UI hook
(`src/app/profile/hooks/usePassword.ts`). See `docs/security-policy.md`.

### CSRF / CORS / CSP

- **CSRF:** same-origin enforcement for unsafe methods in
  `src/lib/middleware/same-origin-csrf.ts` (checks `Origin`/`Referer` against the
  allowlist). Bearer-authenticated requests and the payment webhook /
  internal warmup paths are exempt (no cookie CSRF surface).
- **CORS:** exact origin allowlist from `getCorsAllowedOrigins`, applied per
  `/api/*` request in `src/proxy.ts` (preflight handled with `204`).
- **CSP:** per-request nonce generated in `src/proxy.ts` and assembled in
  `src/lib/security/content-security-policy.ts`; production omits
  `unsafe-inline`/`unsafe-eval` on `script-src`, `frame-ancestors 'none'`.

### Rate limiting

Auth-sensitive endpoints are rate-limited at the proxy via Upstash
(`src/proxy.ts`): login/register (10 / 60s), verify, resend-verification,
checkout (10 / 60s), and admin uploads (20 / 10m).

## Consequences

**Positive**

- Stateless tokens with instant, DB-backed revocation via `authEpoch`.
- Single source of truth for identity, roles, and account state (Neon).
- Defense in depth: edge gate + per-route re-validation, both hitting live DB.
- No external auth vendor dependency or cost.

**Negative / trade-offs**

- Every gated request incurs a DB lookup during validation (mitigated by Neon
  pooling; not a token-only check).
- Rotating `JWT_SECRET` invalidates all sessions (forced logout) — acceptable,
  documented in `docs/runbook-secret-rotation.md`.
- We own the security surface (signing, cookies, CSRF) rather than delegating it.

## Known gaps / future work

- **Admin MFA is not implemented.** Admin access relies solely on password + JWT
  + live `admin` role; there is no second factor. This should be added before
  treating `/supersudo` as fully hardened.
- No password complexity rules beyond minimum length (8) and no breached-password
  checks.
- No explicit refresh-token rotation; sessions live until expiry or `authEpoch`
  bump.
