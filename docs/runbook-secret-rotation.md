# Runbook: Secret Rotation

Operational steps to rotate each critical secret used by the app. Secrets live in
the host environment (Vercel → Project → Settings → Environment Variables) per
scope: **Production**, **Preview**, **Development**. Never commit secrets; see
`.env.example` for the full variable list.

## General procedure

1. Generate the new value in the source dashboard.
2. Set it in Vercel for the relevant scope(s) (Production / Preview / Development).
3. Redeploy so the new value is picked up (env changes require a new deployment).
4. Verify the app works against the new value.
5. Revoke / delete the old value in the source dashboard.
6. If anything breaks, roll back per the notes for that secret.

> Tip: keep both old and new credentials valid during the overlap window where the
> provider supports it (DB, R2, Upstash), then revoke the old one only after the
> new deployment is confirmed healthy.

---

## `JWT_SECRET`

- **What it does:** signs/verifies all session JWTs
  (`src/lib/services/auth-session.service.ts`, `src/lib/middleware/auth-edge.ts`,
  `src/lib/middleware/auth.ts`).
- **Generate:** `openssl rand -base64 48` (or any long random string).
- **Set:** Vercel env `JWT_SECRET` for Production (and Preview/Development as
  needed).
- **Deploy:** redeploy the affected environment.
- **Revoke old:** rotating the value is the revocation — no provider step.
- **IMPORTANT — forced logout:** changing `JWT_SECRET` invalidates **every**
  existing session because old tokens no longer verify. All users are logged out
  and must sign in again. This is acceptable/expected; schedule it for a low-traffic
  window and communicate if needed. There is no overlap mode — do not run old and
  new secrets simultaneously.
- **Rollback:** restore the previous `JWT_SECRET` value and redeploy. Sessions
  issued under the rolled-back secret remain valid; sessions issued under the
  short-lived new secret become invalid (another forced logout for those users).

## `DATABASE_URL` / `DIRECT_URL` (Neon)

- **What it does:** `DATABASE_URL` = pooled app connection; `DIRECT_URL` =
  non-pooler host used by Prisma migrations (see `.env.example`, `schema.prisma`).
- **Generate:** Neon Console → Project → Roles → reset the role password (or
  create a new role), then copy the new pooled and direct connection strings.
- **Set:** update both `DATABASE_URL` (pooled, hostname contains `-pooler`) and
  `DIRECT_URL` (direct host) in Vercel for the matching environment. Keep
  `?sslmode=require` (and `&pgbouncer=true` on the pooled URL).
- **Deploy:** redeploy. Run `pnpm check:perf-env` to validate the env wiring.
- **Revoke old:** in Neon, finish the password reset / delete the old role so the
  previous credentials stop working.
- **Rollback:** restore the previous connection strings and redeploy. If you reset
  the role password, the old string only works again if you reset it back — prefer
  creating a new role so you can switch back cleanly.

## `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

- **What it does:** shared cache + rate limiting (`src/proxy.ts`,
  `src/lib/middleware/upstash-rate-limit.ts`). Without it, the app falls back to
  per-instance in-memory limits.
- **Generate:** Upstash Console → your Redis database → REST API → copy URL and
  token (rotate token there if supported, or create a new database).
- **Set:** update both vars in Vercel for the matching environment.
- **Deploy:** redeploy. Run `pnpm check:perf-env` to confirm connectivity.
- **Revoke old:** roll/disable the old token in Upstash, or delete the old
  database.
- **Rollback:** restore previous URL/token and redeploy. Cache/rate-limit state is
  ephemeral, so rollback has no data-loss impact (counters reset).

## R2 keys (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`, + `R2_ACCOUNT_ID` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL`)

- **What it does:** Cloudflare R2 object storage for uploads/media.
- **Generate:** Cloudflare Dashboard → R2 → Manage R2 API Tokens → create a new
  API token scoped to the bucket; copy the new Access Key ID and Secret Access
  Key. `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` normally do not change.
- **Set:** update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Vercel for the
  matching environment.
- **Deploy:** redeploy. Verify an admin upload succeeds.
- **Revoke old:** delete the old R2 API token in Cloudflare.
- **Rollback:** the old token works only until you delete it — keep it active until
  the new keys are confirmed, then revoke. To roll back, re-set the prior keys (if
  still active) and redeploy.

## `WARMUP_INTERNAL_SECRET`

- **What it does:** authorizes the internal storefront cache warm-up endpoint
  (`src/app/api/v1/internal/warm-storefront-listing/route.ts`,
  `src/lib/cache/trigger-storefront-listing-warmup.ts`).
- **Generate:** `openssl rand -base64 32`.
- **Set:** update `WARMUP_INTERNAL_SECRET` in Vercel; it must match on both the
  caller (warmup trigger) and the route, so update it everywhere it is consumed.
- **Deploy:** redeploy. Confirm warm-up requests return success (not `401`).
- **Revoke old:** rotating the value is the revocation.
- **Rollback:** restore the previous value and redeploy. Low risk — only affects
  cache warming, not user-facing auth.

## `PAYMENT_PSP_WEBHOOK_SECRET`

- **What it does:** verifies inbound payment webhook signatures
  (`/api/v1/payments/webhook`, which is CSRF-exempt by design).
- **Generate:** in the PSP dashboard, create/rotate the webhook signing secret for
  the endpoint.
- **Set:** update `PAYMENT_PSP_WEBHOOK_SECRET` in Vercel (Production at minimum;
  Preview if you test webhooks there).
- **Deploy:** redeploy. Use the PSP dashboard's "send test webhook" to confirm a
  valid signature is accepted.
- **Revoke old:** retire the old signing secret in the PSP once the new one is
  confirmed. Note: if the PSP supports only one active secret, briefly in-flight
  webhooks signed with the old secret may fail — rotate during low payment volume.
- **Rollback:** restore the previous secret and redeploy; re-point the PSP to the
  matching secret.

---

## Rotation cadence

| Secret | Routine cadence | Rotate immediately if | Forced logout? |
|---|---|---|---|
| `JWT_SECRET` | 6–12 months | Suspected leak | Yes |
| `DATABASE_URL` / `DIRECT_URL` | 6–12 months | Suspected leak / role compromise | No |
| `UPSTASH_REDIS_REST_*` | 6–12 months | Suspected leak | No |
| R2 keys | 6–12 months | Suspected leak / contributor offboarding | No |
| `WARMUP_INTERNAL_SECRET` | 12 months | Suspected leak | No |
| `PAYMENT_PSP_WEBHOOK_SECRET` | Per PSP policy / 12 months | Suspected leak | No |

Always rotate immediately after any credential exposure, contributor offboarding
with prior secret access, or a security incident.
