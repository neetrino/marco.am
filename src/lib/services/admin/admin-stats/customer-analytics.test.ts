import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@white-shop/db", () => ({
  db: {
    user: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { db } from "@white-shop/db";

import { getCustomerAnalytics } from "./customer-analytics";

const userFindMany = db.user.findMany as unknown as ReturnType<typeof vi.fn>;
const queryRaw = db.$queryRaw as unknown as ReturnType<typeof vi.fn>;

describe("getCustomerAnalytics", () => {
  beforeEach(() => {
    userFindMany.mockReset();
    queryRaw.mockReset();
  });

  it("counts new vs repeat by first order date and ranks top spenders on paid orders only", async () => {
    const start = new Date("2025-01-10T00:00:00.000Z");
    const end = new Date("2025-01-17T23:59:59.999Z");

    queryRaw
      .mockResolvedValueOnce([
        {
          new_customers: 2,
          repeat_customers: 1,
          orders_from_new: 3,
          orders_from_repeat: 1,
          orders_unattributed: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          identity_key: "email:guest@example.com",
          total_spend: 200,
          order_count: 1,
          currency: "AMD",
        },
        {
          identity_key: "user:u-repeat",
          total_spend: 100,
          order_count: 1,
          currency: "AMD",
        },
        {
          identity_key: "user:u-new",
          total_spend: 50,
          order_count: 1,
          currency: "AMD",
        },
      ]);

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
