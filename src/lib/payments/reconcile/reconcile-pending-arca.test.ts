import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const finalizePaid = vi.fn();
const finalizeFailed = vi.fn();
const getStatus = vi.fn();

vi.mock("@white-shop/db", () => ({
  db: {
    payment: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

vi.mock("@/lib/payments/arca/client", () => ({
  getArcaOrderStatus: (...args: unknown[]) => getStatus(...args),
}));

vi.mock("@/lib/payments/finalize-payment", () => ({
  finalizePaymentPaid: (...args: unknown[]) => finalizePaid(...args),
  finalizePaymentFailed: (...args: unknown[]) => finalizeFailed(...args),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { reconcilePendingArcaPayments } from "./reconcile-pending-arca";

describe("reconcilePendingArcaPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PAYMENT_PENDING_TIMEOUT_MINUTES", "60");
    vi.stubEnv("PAYMENT_RECONCILE_BATCH_SIZE", "25");
  });

  it("marks paid when bank reports deposited", async () => {
    const createdAt = new Date("2026-07-22T10:00:00.000Z");
    findMany.mockResolvedValue([
      {
        id: "pay_1",
        orderId: "ord_1",
        providerTransactionId: "bank_1",
        createdAt,
        order: {
          id: "ord_1",
          number: "1001",
          userId: null,
          paymentStatus: "pending",
        },
      },
    ]);
    getStatus.mockResolvedValue({
      orderNumber: "1001",
      orderStatus: 2,
      paymentState: "DEPOSITED",
      raw: { orderStatus: 2 },
      isPaid: true,
    });
    finalizePaid.mockResolvedValue({ alreadyPaid: false });

    const summary = await reconcilePendingArcaPayments(
      new Date("2026-07-22T10:10:00.000Z"),
    );

    expect(finalizePaid).toHaveBeenCalledOnce();
    expect(finalizeFailed).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ scanned: 1, paid: 1, failed: 0, skipped: 0 });
  });

  it("leaves pending when bank still open and under timeout", async () => {
    findMany.mockResolvedValue([
      {
        id: "pay_2",
        orderId: "ord_2",
        providerTransactionId: "bank_2",
        createdAt: new Date("2026-07-22T10:00:00.000Z"),
        order: {
          id: "ord_2",
          number: "1002",
          userId: null,
          paymentStatus: "pending",
        },
      },
    ]);
    getStatus.mockResolvedValue({
      orderNumber: "1002",
      orderStatus: 0,
      paymentState: "CREATED",
      raw: { orderStatus: 0 },
      isPaid: false,
    });

    const summary = await reconcilePendingArcaPayments(
      new Date("2026-07-22T10:10:00.000Z"),
    );

    expect(finalizePaid).not.toHaveBeenCalled();
    expect(finalizeFailed).not.toHaveBeenCalled();
    expect(summary.skipped).toBe(1);
  });

  it("marks failed after timeout while still pending at bank", async () => {
    findMany.mockResolvedValue([
      {
        id: "pay_3",
        orderId: "ord_3",
        providerTransactionId: "bank_3",
        createdAt: new Date("2026-07-22T09:00:00.000Z"),
        order: {
          id: "ord_3",
          number: "1003",
          userId: null,
          paymentStatus: "pending",
        },
      },
    ]);
    getStatus.mockResolvedValue({
      orderNumber: "1003",
      orderStatus: 0,
      paymentState: "CREATED",
      raw: { orderStatus: 0 },
      isPaid: false,
    });
    finalizeFailed.mockResolvedValue({ ignoredBecausePaid: false });

    const summary = await reconcilePendingArcaPayments(
      new Date("2026-07-22T10:30:00.000Z"),
    );

    expect(finalizeFailed).toHaveBeenCalledOnce();
    expect(summary.failed).toBe(1);
  });
});
