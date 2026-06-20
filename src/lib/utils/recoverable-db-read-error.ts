function prismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * True when a read-only settings/query failure should degrade to empty defaults
 * (CI build without DATABASE_URL, offline DB, pool exhaustion).
 */
export function isRecoverableDbReadError(error: unknown): boolean {
  const code = prismaErrorCode(error);
  if (code === "P1000" || code === "P1001" || code === "P1017") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    /DATABASE_URL is missing/i.test(error.message) ||
    /Can't reach database server/i.test(error.message) ||
    /User was denied access on the database/i.test(error.message) ||
    /Timed out fetching a new connection from the connection pool/i.test(error.message) ||
    /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET|Connection terminated unexpectedly/i.test(
      error.message,
    )
  );
}
