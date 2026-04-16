# Shop Marco — HTTP API contract (backend ↔ frontend)

**Version:** 1.0.0  
**Last updated:** 2026-04-16

This document is the **authoritative human-readable contract** for the Shop Marco HTTP API. Machine-readable schemas live in [`openapi/shop-api.yaml`](./openapi/shop-api.yaml).

---

## 1. Transport and format

| Decision | Choice |
|----------|--------|
| Style | **REST** over HTTPS |
| Payload | **JSON** (`Content-Type: application/json` for request bodies where applicable) |
| GraphQL | **Not supported** — there is no GraphQL endpoint |

**Base URL:** deployment-specific (e.g. `https://<host>`). All application routes are rooted under `/api`.

**Versioning:** Public product and business APIs are under **`/api/v1/...`**. Additional unversioned routes exist for operational or legacy paths (e.g. `/api/health`, `/api/search/instant`).

---

## 2. Authentication

### 2.1 JWT bearer (user and admin sessions)

After successful **login** or **register**, the client receives a JWT. For protected routes, send:

```http
Authorization: Bearer <jwt>
```

Rules:

- Scheme is **`Bearer`** (case-insensitive per RFC 7235; use `Bearer` in clients).
- Token is verified server-side with `JWT_SECRET`; expiry is controlled by `JWT_EXPIRES_IN` (default **7d** if unset).
- Missing, invalid, or expired tokens typically yield **401** when the route requires authentication.
- Admin routes additionally require the user’s `roles` to include **`admin`**.

### 2.2 Public routes

Catalog, health, and some storefront endpoints do not require a token unless documented otherwise.

---

## 3. Error model (RFC 7807–aligned)

Error responses use **JSON** (not necessarily `Content-Type: application/problem+json`), with fields aligned to **RFC 7807 Problem Details**:

| Field | Meaning |
|-------|---------|
| `type` | URI identifying the problem type (stable identifier for clients) |
| `title` | Short, human-readable summary |
| `status` | HTTP status code (duplicates the response status) |
| `detail` | Explanation for this occurrence (safe for the client; no stack traces in production) |
| `instance` | URI reference for this specific occurrence (often the request path) |

Example:

```json
{
  "type": "https://api.shop.am/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Field 'email' is required",
  "instance": "/api/v1/auth/register"
}
```

Implementation references: `src/lib/types/errors.ts` (`AppError`, `toApiError`), `src/lib/api/json-error-response.ts`, `src/lib/api/next-route-error.ts`.

---

## 4. Success responses

There is no single envelope for all success bodies. Typical patterns:

- **200** — OK with a JSON body.
- **201** — Created (e.g. resource creation).
- **204** — No content (rare; prefer 200 with a small JSON payload where the client needs confirmation).

Pagination and list shapes are defined per endpoint in the OpenAPI file where described.

---

## 5. Localization (optional)

User profile and some services use a **locale** stored on the user (e.g. `hy`, `ru`, `en`). For unauthenticated flows, locale may come from query parameters or cookies depending on the route. Prefer aligning with the storefront’s language cookie / preference where applicable.

---

## 6. References

| Resource | Location |
|----------|----------|
| OpenAPI (ProblemDetails, security, sample paths) | [`docs/openapi/shop-api.yaml`](./openapi/shop-api.yaml) |
| Backend architecture | [`BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md) |
| Delivery tracking | [`SHOP_SPEC_BACKEND_DELIVERY.md`](./SHOP_SPEC_BACKEND_DELIVERY.md) |
