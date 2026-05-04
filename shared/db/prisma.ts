/**
 * Re-exports the generated Prisma client so app code can import `@white-shop/db/prisma`
 * instead of `@prisma/client`. Custom generator `output` lives under `./generated/`
 * (avoids Windows EPERM in pnpm’s store); Turbopack does not resolve `@prisma/client` → absolute path.
 *
 * Use explicit exports (not `export *`) so Turbopack does not warn on CJS `export *` interop
 * for `./generated/prisma-client`. Add model types here when imported from `@white-shop/db/prisma`.
 */
export { Prisma, PrismaClient } from "./generated/prisma-client";
export type { Order } from "./generated/prisma-client";
