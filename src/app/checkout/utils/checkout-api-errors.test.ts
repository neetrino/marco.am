import { describe, expect, it } from "vitest";
import { ApiError } from "../../../lib/api-client/types";
import { parseCheckoutSubmissionError } from "./checkout-api-errors";

const t = (key: string): string => key;

describe("parseCheckoutSubmissionError", () => {
  it("maps structured issues to checkout form fields", () => {
    const error = new ApiError("Validation failed", 400, "Bad Request", {
      detail: "City is required for courier delivery",
      errors: [
        {
          field: "shippingCity",
          code: "required_shipping_city",
          message: "City is required for courier delivery",
        },
      ],
    });

    const parsed = parseCheckoutSubmissionError(error, t);
    expect(parsed.fieldErrors).toEqual([
      {
        field: "shippingCity",
        message: "checkout.errors.cityRequired",
      },
    ]);
    expect(parsed.globalError).toBe("City is required for courier delivery");
  });

  it("falls back to global error when no structured issues", () => {
    const error = new Error("Plain error");
    const parsed = parseCheckoutSubmissionError(error, t);
    expect(parsed.fieldErrors).toEqual([]);
    expect(parsed.globalError).toBe("Plain error");
  });
});
