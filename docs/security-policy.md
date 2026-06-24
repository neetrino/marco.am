# Security Policy

Short, code-backed security policy for the app. Cross-references:
`docs/adr-auth.md` (auth design) and `docs/runbook-secret-rotation.md`
(secret rotation).

## Password policy

Defined centrally in `src/lib/constants/password-policy.ts`:

- **Minimum length:** 8 characters (`MIN_PASSWORD_LENGTH = 8`).
- **Hashing:** bcrypt with cost factor 12 (`BCRYPT_ROUNDS = 12`, via `bcryptjs`).
  Plaintext passwords are never stored; only the bcrypt hash is persisted.

**Where enforced:**

- Schema validation — `src/lib/schemas/auth.schema.ts` (`registerSchema` requires
  `min(MIN_PASSWORD_LENGTH)`).
- Registration — `src/lib/services/auth.service.ts` (`isPasswordLongEnough` check;
  `bcrypt.hash(password, BCRYPT_ROUNDS)`).
- Password change — `src/lib/services/users.service.ts` (length check; verifies the
  current password with `bcrypt.compare`; hashes the new one with `BCRYPT_ROUNDS`;
  bumps `authEpoch`).
- UI — `src/app/profile/hooks/usePassword.ts` (client-side `isPasswordLongEnough`
  guard plus confirm-match check before calling the API).

**Gaps / TODO:** no complexity requirements (uppercase/symbol/number), no
breached-password (HIBP) check, and no password history. Only minimum length is
enforced today.

## Session policy

- **Mechanism:** stateless JWT signed with `JWT_SECRET`
  (`src/lib/services/auth-session.service.ts`); claims `userId`, `authEpoch`,
  `roles`.
- **Storage:** HttpOnly cookie `shop_auth_session`
  (`src/lib/auth/auth-session-cookie.ts`): `httpOnly`, `secure` in production,
  `sameSite=lax`, `path=/`. Lifetime from `JWT_EXPIRES_IN` (default 7 days).
- **Validation:** at the edge proxy (`src/proxy.ts` →
  `validateSessionAtEdge`) and per-route (`authenticateToken`,
  `src/lib/middleware/auth.ts`). Both re-check live user state: rejects
  `blocked`, soft-deleted (`deletedAt`), and `authEpoch` mismatch.
- **Revocation:** `authEpoch` bump invalidates all outstanding tokens
  (`src/lib/auth/auth-epoch-mutations.ts`) on logout, password change, and admin
  block / role change.
- **CSRF/CORS:** same-origin enforcement for unsafe methods
  (`src/lib/middleware/same-origin-csrf.ts`); exact-origin CORS allowlist applied
  in `src/proxy.ts`.
- **Rate limiting:** login/register and other auth-sensitive endpoints are
  rate-limited at the proxy (Upstash).

## Admin access policy

- **Roles:** stored in the DB, normalized to `customer` / `admin`
  (`src/lib/constants/user-roles.ts`). Authorization uses the **live** role read
  during session validation, not just the token claim.
- **Admin pages (`/supersudo*`):** require an authenticated session with a live
  `admin` role; non-admins are redirected to `/`
  (`src/lib/middleware/auth-protected-routes.ts`).
- **Admin APIs (`/api/v1/supersudo/*`):** gated by `requireAdminApi` — `401` if
  unauthenticated, `403` if not admin. Admin uploads are additionally
  rate-limited.
- **Header hardening:** the proxy strips client-supplied `x-auth-user-id` /
  `x-auth-roles` on `/api/*` so identity cannot be spoofed by the client.

**Gaps / TODO:** **Admin MFA is not implemented.** Admin access currently relies
only on password + JWT + live `admin` role; a second factor should be added
before treating `/supersudo` as fully hardened.

## Secrets

All secrets are environment-only (never committed); see `.env.example` for the
full list and `docs/runbook-secret-rotation.md` for rotation steps and cadence.
