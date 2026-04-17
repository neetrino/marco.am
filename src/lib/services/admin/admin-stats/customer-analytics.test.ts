import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@white-shop/db", () => ({
  db: {
    order: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { db } from "@white-shop/db";

import { getCustomerAnalytics } from "./customer-analytics";

const orderFindMany = db.order.findMany as unknown as ReturnType<typeof vi.fn>;
const userFindMany = db.user.findMany as unknown as ReturnType<typeof vi.fn>;

describe("getCustomerAnalytics", () => {
  beforeEach(() => {
    orderFindMany.mockReset();
    userFindMany.mockReset();
  });

  it("counts new vs repeat by first order date and ranks top spenders on paid orders only", async () => {
    const start = new Date("2025-01-10T00:00:00.000Z");
    const end = new Date("2025-01-17T23:59:59.999Z");

    orderFindMany.mockImplementation((args: unknown) => {
      const q = args as {
        where?: { createdAt?: { gte?: Date; lte?: Date } };
        select?: Record<string, boolean>;
        orderBy?: { createdAt: string };
      };

      if (q.orderBy?.createdAt === "asc") {
        return Promise.resolve([
          {
            userId: "u-repeat",
            customerEmail: "r@example.com",
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
          },
          {
            userId: null,
            customerEmail: "guest@example.com",
            createdAt: new Date("2025-01-11T10:00:00.000Z"),
          },
          {
            userId: "u-new",
            customerEmail: null,
            createdAt: new Date("2025-01-12T12:00:00.000Z"),
          },
        ]);
      }

      return Promise.resolve([
        {
          userId: "u-repeat",
          customerEmail: "r@example.com",
          total: 100,
          paymentStatus: "paid",
          currency: "AMD",
        },
        {
          userId: "u-new",
          customerEmail: null,
          total: 50,
          paymentStatus: "paid",
          currency: "AMD",
        },
        {
          userId: null,
          customerEmail: "guest@example.com",
          total: 200,
          paymentStatus: "paid",
          currency: "AMD",
        },
        {
          userId: null,
          customerEmail: null,
          total: 999,
          paymentStatus: "paid",
          currency: "AMD",
        },
        {
          userId: "u-new",
          customerEmail: null,
          total: 10,
          paymentStatus: "pending",
          currency: "AMD",
        },
      ]);
    });

    userFindMany.mockResolvedValue([
      {
        id: "u-repeat",
        firstName: "Rep",
        lastName: "Eat",
        email: "r@example.com",
      },
      {
        id: "u-new",
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
      },
    ]);

    const result = await getCustomerAnalytics(start, end);

    expect(result.newVsRepeat.newCustomers).toBe(2);
    expect(result.newVsRepeat.repeatCustomers).toBe(1);
    expect(result.newVsRepeat.ordersFromNewCustomers).toBe(3);
    expect(result.newVsRepeat.ordersFromRepeatCustomers).toBe(1);
    expect(result.newVsRepeat.ordersUnattributed).toBe(1);

    expect(result.topCustomersBySpend).toHaveLength(3);
    expect(result.topCustomersBySpend[0]?.displayName).toBe("guest@example.com");
    expect(result.topCustomersBySpend[0]?.totalSpend).toBe(200);
    expect(result.topCustomersBySpend[1]?.displayName).toBe("Rep Eat");
    expect(result.topCustomersBySpend[1]?.totalSpend).toBe(100);
    expect(result.topCustomersBySpend[2]?.displayName).toBe("New User");
    expect(result.topCustomersBySpend[2]?.totalSpend).toBe(50);
  });
});
