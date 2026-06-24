import { createHash } from "crypto";
import { db } from "@white-shop/db";
import { Prisma } from "@white-shop/db/prisma";
import { getPrismaErrorCode } from "../types/errors";
import { logger } from "../utils/logger";

const IDEMPOTENCY_KEY_MIN_LENGTH = 8;
const IDEMPOTENCY_KEY_MAX_LENGTH = 200;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]+$/;
const PRISMA_UNIQUE_VIOLATION = "P2002";
const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in_progress";

type ApiErrorShape = {
  status: number;
  type: string;
  title: string;
  detail: string;
};

/** Outcome of an idempotent operation: the HTTP status and JSON body to return. */
export type IdempotentResult<T> = {
  status: number;
  body: T;
};

export type IdempotencyContext = {
  key: string;
  scope: string;
  userId?: string;
  payload: unknown;
};

/**
 * Validates the shape of an `Idempotency-Key` header value.
 * @throws RFC7807-style 400 error when malformed.
 */
export function validateIdempotencyKey(key: string): void {
  const isValid =
    key.length >= IDEMPOTENCY_KEY_MIN_LENGTH &&
    key.length <= IDEMPOTENCY_KEY_MAX_LENGTH &&
    IDEMPOTENCY_KEY_PATTERN.test(key);
  if (!isValid) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Malformed Idempotency-Key header",
    } satisfies ApiErrorShape;
  }
}

/** Deterministic JSON stringify with sorted keys; `undefined` fields are dropped. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}

/** Hash of the normalized request payload bound to the acting user. */
export function computeRequestHash(payload: unknown, userId?: string): string {
  const normalized = stableStringify({ payload, userId: userId ?? null });
  return createHash("sha256").update(normalized).digest("hex");
}

function conflict(detail: string): ApiErrorShape {
  return {
    status: 409,
    type: "https://api.shop.am/problems/conflict",
    title: "Conflict",
    detail,
  };
}

function whereKey(context: IdempotencyContext) {
  return { key_scope: { key: context.key, scope: context.scope } };
}

/** Inserts an `in_progress` row; relies on the unique constraint to detect races. */
async function reserveKey(
  context: IdempotencyContext,
  requestHash: string
): Promise<{ created: boolean }> {
  try {
    await db.idempotencyKey.create({
      data: {
        key: context.key,
        scope: context.scope,
        userId: context.userId ?? null,
        requestHash,
        status: STATUS_IN_PROGRESS,
      },
    });
    return { created: true };
  } catch (error: unknown) {
    if (getPrismaErrorCode(error) === PRISMA_UNIQUE_VIOLATION) {
      return { created: false };
    }
    throw error;
  }
}

/** Resolves a replay: returns the stored response or throws a 409 conflict. */
async function resolveExisting<T>(
  context: IdempotencyContext,
  requestHash: string
): Promise<IdempotentResult<T>> {
  const existing = await db.idempotencyKey.findUnique({ where: whereKey(context) });
  if (!existing) {
    throw conflict("A request with this Idempotency-Key is already in progress");
  }
  if (existing.requestHash !== requestHash) {
    throw conflict("Idempotency-Key was reused with a different request body");
  }
  if (existing.status !== STATUS_COMPLETED || existing.responseStatus === null) {
    throw conflict("A request with this Idempotency-Key is already in progress");
  }
  return { status: existing.responseStatus, body: existing.responseBody as T };
}

/** Runs the operation, persists its response, and releases the key on failure. */
async function executeAndStore<T>(
  context: IdempotencyContext,
  run: () => Promise<IdempotentResult<T>>
): Promise<IdempotentResult<T>> {
  try {
    const result = await run();
    await db.idempotencyKey.update({
      where: whereKey(context),
      data: {
        status: STATUS_COMPLETED,
        responseStatus: result.status,
        responseBody: result.body as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
    return result;
  } catch (error: unknown) {
    await db.idempotencyKey.delete({ where: whereKey(context) }).catch((cleanupError: unknown) => {
      logger.error("Failed to release idempotency key after failure", {
        key: context.key,
        scope: context.scope,
        cleanupError,
      });
    });
    throw error;
  }
}

/**
 * Executes `run` at most once per (key, scope). On a repeat with the same key:
 * returns the stored response when completed, or throws 409 on body mismatch / in-progress.
 */
export async function runWithIdempotency<T>(
  context: IdempotencyContext,
  run: () => Promise<IdempotentResult<T>>
): Promise<IdempotentResult<T>> {
  const requestHash = computeRequestHash(context.payload, context.userId);
  const reserved = await reserveKey(context, requestHash);
  if (!reserved.created) {
    return resolveExisting<T>(context, requestHash);
  }
  return executeAndStore<T>(context, run);
}
