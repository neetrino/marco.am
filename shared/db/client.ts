import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

/** Ensures `.env` is applied before Prisma reads `DATABASE_URL` (Next.js Turbopack / early imports). */
loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

declare global {
  var prisma: PrismaClient | undefined;
  /** Set when `DATABASE_URL` changes so dev HMR does not keep a stale client (e.g. 127.0.0.1). */
  var prismaResolvedDatabaseUrl: string | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaResolvedDatabaseUrl?: string;
};

function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

/**
 * Reads DATABASE_URL at runtime. Uses bracket access so Next.js Turbopack does not inline
 * a stale compile-time value (which led to connections against 127.0.0.1:5432).
 */
function readDatabaseUrlFromEnv(): string {
  return process.env["DATABASE_URL"] ?? "";
}

/**
 * Ensures UTF-8 for PostgreSQL (Armenian and other non-ASCII).
 * Must not run when DATABASE_URL is missing — appending "?client_encoding=..."
 * to an empty string yields an invalid URL and Prisma may fall back to 127.0.0.1:5432.
 */
function resolveDatabaseUrlWithClientEncoding(): string {
  const databaseUrl = readDatabaseUrlFromEnv();
  if (!isPostgresUrl(databaseUrl)) {
    throw new Error(
      "DATABASE_URL is missing or not a PostgreSQL URL. Set it in .env (e.g. Neon connection string).",
    );
  }
  if (databaseUrl.includes("client_encoding")) {
    return databaseUrl;
  }
  const withEncoding = databaseUrl.includes("?")
    ? `${databaseUrl}&client_encoding=UTF8`
    : `${databaseUrl}?client_encoding=UTF8`;
  return withEncoding;
}

function createPrismaClient(resolvedDatabaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: resolvedDatabaseUrl },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });
}

let productionPrisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  const resolvedDatabaseUrl = resolveDatabaseUrlWithClientEncoding();
  process.env.DATABASE_URL = resolvedDatabaseUrl;

  if (process.env.NODE_ENV !== "production") {
    if (
      globalForPrisma.prisma &&
      globalForPrisma.prismaResolvedDatabaseUrl !== resolvedDatabaseUrl
    ) {
      void globalForPrisma.prisma.$disconnect().catch(() => undefined);
      globalForPrisma.prisma = undefined;
    }
    if (globalForPrisma.prisma) {
      return globalForPrisma.prisma;
    }
    const client = createPrismaClient(resolvedDatabaseUrl);
    globalForPrisma.prisma = client;
    globalForPrisma.prismaResolvedDatabaseUrl = resolvedDatabaseUrl;
    return client;
  }

  if (productionPrisma) {
    return productionPrisma;
  }
  productionPrisma = createPrismaClient(resolvedDatabaseUrl);
  return productionPrisma;
}

/**
 * Lazy proxy so importing `@white-shop/db` does not validate `DATABASE_URL` or construct
 * `PrismaClient` at module load. `next build` loads API routes without secrets; real use
 * initializes the client on first access.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrismaClient();
    const value = Reflect.get(instance, prop, instance);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
