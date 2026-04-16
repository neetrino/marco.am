import type { LooseThrown } from "./loose-thrown";

/**
 * Narrow unknown catch values for property access (Prisma, AppError, plain objects).
 */
export function thrown(error: unknown): LooseThrown {
  if (typeof error === "object" && error !== null) {
    return error as LooseThrown;
  }
  return {};
}
