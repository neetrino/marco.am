import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@white-shop/db", () => ({
  db: {
    idempotencyKey: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@white-shop/db/prisma", () => ({
  Prisma: {},
}));

import { db } from "@white-shop/db";

import {
  computeRequestHash,
  runWithIdempotency,
  validateIdempotencyKey,
} from "./idempotency.service";

const create = db.idempotencyKey.create as unknown as ReturnType<typeof vi.fn>;
const findUnique = db.idempotencyKey.findUnique as unknown as ReturnType<typeof vi.fn>;
const update = db.idempotencyKey.update as unknown as ReturnType<typeof vi.fn>;
const del = db.idempotencyKey.delete as unknown as ReturnType<typeof vi.fn>;

const context = {
  key: "checkout-key-123",
  scope: "checkout",
  userId: "u-1",
  payload: { items: [{ productId: "p-1", variantId: "v-1", quantity: 2 }] },
};

const uniqueViolation = { code: "P2002" };

describe("validateIdempotencyKey", () => {
  it("accepts a well-formed key", () => {
    expect(() => validateIdempotencyKey("a1b2c3d4")).not.toThrow();
  });

  it("rejects a too-short or unsafe key", () => {
    expect(() => validateIdempotencyKey("short")).toThrow();
    expect(() => validateIdempotencyKey("has spaces here")).toThrow();
  });
});

describe("runWithIdempotency", () => {
  beforeEach(() => {
    create.mockReset();
    findUnique.mockReset();
    update.mockReset();
    del.mockReset();
  });

  it("runs the operation on first call and stores the response", async () => {
    create.mockResolvedValue({});
    update.mockResolvedValue({});
    const run = vi.fn().mockResolvedValue({ status: 201, body: { order: { id: "o-1" } } });

    const result = await runWithIdempotency(context, run);

    expect(run).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: 201, body: { order: { id: "o-1" } } });
    expect(update.mock.calls[0]?.[0]?.data).toMatchObject({
      status: "completed",
      responseStatus: 201,
    });
  });

  it("returns the stored response on a completed replay without re-running", async () => {
    create.mockRejectedValue(uniqueViolation);
    findUnique.mockResolvedValue({
      requestHash: computeRequestHash(context.payload, context.userId),
      status: "completed",
      responseStatus: 201,
      responseBody: { order: { id: "o-1" } },
    });
    const run = vi.fn();

    const result = await runWithIdempotency(context, run);

    expect(run).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 201, body: { order: { id: "o-1" } } });
  });

  it("rejects with 409 when the same key is reused with a different body", async () => {
    create.mockRejectedValue(uniqueViolation);
    findUnique.mockResolvedValue({
      requestHash: "different-hash",
      status: "completed",
      responseStatus: 201,
      responseBody: { order: { id: "o-1" } },
    });
    const run = vi.fn();

    await expect(runWithIdempotency(context, run)).rejects.toMatchObject({ status: 409 });
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects with 409 when a request is already in progress", async () => {
    create.mockRejectedValue(uniqueViolation);
    findUnique.mockResolvedValue({
      requestHash: computeRequestHash(context.payload, context.userId),
      status: "in_progress",
      responseStatus: null,
      responseBody: null,
    });
    const run = vi.fn();

    await expect(runWithIdempotency(context, run)).rejects.toMatchObject({ status: 409 });
    expect(run).not.toHaveBeenCalled();
  });

  it("releases the key when the operation fails", async () => {
    create.mockResolvedValue({});
    del.mockResolvedValue({});
    const run = vi.fn().mockRejectedValue(new Error("checkout failed"));

    await expect(runWithIdempotency(context, run)).rejects.toThrow("checkout failed");
    expect(del).toHaveBeenCalledOnce();
  });
});
