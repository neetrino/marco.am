/**
 * Internal headers used to pass an already DB-validated session from the
 * proxy (`src/proxy.ts`) to route handlers, avoiding a second `user` table
 * lookup in `authenticateToken`.
 *
 * SECURITY: these headers must never be trusted unless they originate from
 * the proxy. `src/proxy.ts` strips both headers from every incoming
 * `/api/` request before any validation runs, so if they are present on a
 * request reaching a route handler, they were set by the proxy itself after
 * a successful `db.user.findUnique` lookup — never by a client.
 */

/** Forwards the DB-validated user id. Value is a plain user id string. */
export const AUTH_USER_ID_HEADER = "x-auth-user-id";

/** Forwards the DB-validated roles as a comma-separated list (e.g. "customer,admin"). */
export const AUTH_ROLES_HEADER = "x-auth-roles";
