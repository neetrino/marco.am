import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "./generated/prisma-client";

/** Ensures `.env` is applied before Prisma reads `DATABASE_URL` (Next.js Turbopack / early imports). */
loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaResolvedDatabaseUrl?: string;
};

/**
 * Neon after idle: TCP + TLS + compute wake can exceed 10s on serverless (Vercel → Neon pooler).
 * Default prod timeout matches dev so first requests after pause are less likely to hit P1001.
 * Override with NEON_CONNECT_TIMEOUT_SEC (e.g. "45") if needed.
 */
const NEON_CONNECT_TIMEOUT_DEV_SEC = "30";
const NEON_CONNECT_TIMEOUT_PROD_SEC = "30";

function resolveNeonConnectTimeoutSec(): string {
  const fromEnv =
    process.env["NEON_CONNECT_TIMEOUT_SEC"] ??
    process.env["PRISMA_NEON_CONNECT_TIMEOUT_SEC"];
  if (fromEnv !== undefined && /^\d+$/.test(fromEnv.trim())) {
    return fromEnv.trim();
  }
  return process.env.NODE_ENV === "development"
    ? NEON_CONNECT_TIMEOUT_DEV_SEC
    : NEON_CONNECT_TIMEOUT_PROD_SEC;
}
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
      u.searchParams.set("connect_timeout", resolveNeonConnectTimeoutSec());
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function prismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * True when the query never reliably reached Postgres (safe to retry read/write once).
 * Avoid retrying validation / unique constraint errors.
 */
function isTransientDbConnectionError(error: unknown): boolean {
  const code = prismaErrorCode(error);
  if (code === "P1001" || code === "P1017") {
    return true;
  }
  if (error instanceof Error) {
    return /Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Connection terminated unexpectedly/i.test(
      error.message,
    );
  }
  return false;
}

const TRANSIENT_DB_QUERY_MAX_ATTEMPTS = 3;

function createPrismaClient(resolvedDatabaseUrl: string): PrismaClient {
  const logQueries =
    process.env["PRISMA_LOG_QUERIES"] === "true" ||
    process.env["PRISMA_LOG_QUERIES"] === "1";
  const base = new PrismaClient({
    datasources: {
      db: { url: resolvedDatabaseUrl },
    },
    log: logQueries
      ? ["query", "error", "warn"]
      : process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

  const extended = base.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;
        for (let attempt = 1; attempt <= TRANSIENT_DB_QUERY_MAX_ATTEMPTS; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (!isTransientDbConnectionError(error) || attempt === TRANSIENT_DB_QUERY_MAX_ATTEMPTS) {
              throw error;
            }
            await sleep(200 * 2 ** (attempt - 1));
          }
        }
        throw lastError;
      },
    },
  });

  return extended as unknown as PrismaClient;
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
