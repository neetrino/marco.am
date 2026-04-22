import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

/** Ensures `.env` is applied before Prisma reads `DATABASE_URL` (Next.js Turbopack / early imports). */
loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaResolvedDatabaseUrl?: string;
};

const NEON_CONNECT_TIMEOUT_SEC = "10";
/** Prisma pool wait (seconds). Default 10 is too low when many routes run in parallel with a tiny pool. */
const NEON_POOL_TIMEOUT_SEC = "30";

/**
 * Neon pooler: `connection_limit=1` avoids cross-process exhaustion on serverless but one Next.js
 * process serves many concurrent requests and `Promise.all` queries — use a small multi-slot pool
 * locally; tighter default in production. Override with `PRISMA_CONNECTION_LIMIT`.
 */
const DEFAULT_NEON_POOL_DEV = "10";
const DEFAULT_NEON_POOL_PROD = "3";

function resolvePooledConnectionLimit(): string {
  const override = process.env["PRISMA_CONNECTION_LIMIT"];
  if (override !== undefined && /^\d+$/.test(override.trim())) {
    return override.trim();
  }
  return process.env.NODE_ENV === "development"
    ? DEFAULT_NEON_POOL_DEV
    : DEFAULT_NEON_POOL_PROD;
}

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
 * For Neon pooled URLs (hostname contains `pooler`), enforce Prisma + PgBouncer settings
 * so serverless does not open too many connections (avoids pool exhaustion / `kind: Closed`).
 * Non-pooler Neon URLs (e.g. DIRECT-style) only get SSL/timeouts — never `pgbouncer=true`.
 */
function ensureNeonPoolSettings(databaseUrl: string): string {
  if (!databaseUrl.includes("neon.tech")) {
    return databaseUrl;
  }
  try {
    const u = new URL(databaseUrl);
    const isPoolerHost = u.hostname.includes("pooler");
    if (!u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
    if (!u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", NEON_CONNECT_TIMEOUT_SEC);
    }
    if (!u.searchParams.has("pool_timeout")) {
      u.searchParams.set("pool_timeout", NEON_POOL_TIMEOUT_SEC);
    }
    if (isPoolerHost) {
      u.searchParams.set("pgbouncer", "true");
      u.searchParams.set("connection_limit", resolvePooledConnectionLimit());
    }
    return u.toString();
  } catch {
    return databaseUrl;
  }
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
  const withNeon = ensureNeonPoolSettings(databaseUrl);
  if (withNeon.includes("client_encoding")) {
    return withNeon;
  }
  const withEncoding = withNeon.includes("?")
    ? `${withNeon}&client_encoding=UTF8`
    : `${withNeon}?client_encoding=UTF8`;
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

/**
 * Single Prisma instance per process via `globalThis` (Next.js dev HMR + production).
 * Uses one global client in all NODE_ENV — avoids duplicate pools and connection storms.
 */
function getPrismaClient(): PrismaClient {
  const resolvedDatabaseUrl = resolveDatabaseUrlWithClientEncoding();
  process.env.DATABASE_URL = resolvedDatabaseUrl;

  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaResolvedDatabaseUrl === resolvedDatabaseUrl
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    const stale = globalForPrisma.prisma;
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaResolvedDatabaseUrl = undefined;
    void stale.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient(resolvedDatabaseUrl);
  globalForPrisma.prisma = client;
  globalForPrisma.prismaResolvedDatabaseUrl = resolvedDatabaseUrl;
  return client;
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
