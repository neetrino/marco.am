/**
 * Re-exports the generated Prisma client so app code can import `@white-shop/db/prisma`
 * instead of `@prisma/client`. Custom generator `output` lives under `./generated/`
 * (avoids Windows EPERM in pnpm’s store); Turbopack does not resolve `@prisma/client` → absolute path.
 */
export * from "./generated/prisma-client";
