import { describe, expect, it } from "vitest";
import {
  assertValidAdminNotesUpdate,
  buildOrderUpdatePatch,
} from "./order-update-patch";

describe("buildOrderUpdatePatch admin notes", () => {
  it("creates update diff for adminNotes changes", () => {
    const patch = buildOrderUpdatePatch(
      {
        status: "pending",
        paymentStatus: "pending",
        fulfillmentStatus: "unfulfilled",
        adminNotes: null,
      },
      {
        adminNotes: "Call before delivery",
      }
    );

    expect(patch).not.toBeNull();
    expect(patch?.updateData.adminNotes).toBe("Call before delivery");
    expect(patch?.changes.adminNotes).toEqual({
      from: null,
      to: "Call before delivery",
    });
  });

  it("treats whitespace-only adminNotes as null", () => {
    const patch = buildOrderUpdatePatch(
      {
        status: "pending",
        paymentStatus: "pending",
        fulfillmentStatus: "unfulfilled",
        adminNotes: "Stored note",
      },
      {
        adminNotes: "   ",
      }
    );

    expect(patch).not.toBeNull();
    expect(patch?.updateData.adminNotes).toBeNull();
    expect(patch?.changes.adminNotes).toEqual({
      from: "Stored note",
      to: null,
    });
  });
});

describe("assertValidAdminNotesUpdate", () => {
  it("throws when adminNotes is too long", () => {
    try {
      assertValidAdminNotesUpdate({
        adminNotes: "a".repeat(4001),
      });
      expect.fail("Expected validation error");
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        title: "Validation Error",
      });
    }
  });
});
