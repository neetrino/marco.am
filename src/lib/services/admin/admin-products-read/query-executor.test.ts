import { describe, expect, it } from "vitest";
import { isProductAttributesError } from "./query-executor";

describe("isProductAttributesError", () => {
  it("detects missing productAttributes table (P2021)", () => {
    expect(isProductAttributesError({ code: "P2021", message: "Table does not exist" })).toBe(true);
  });

  it("detects unknown attributeValues relation in Prisma client", () => {
    const error = new Error(
      "Invalid `prisma.product.findUnique()` invocation:\n\nUnknown field `attributeValues`",
    );
    expect(isProductAttributesError(error)).toBe(true);
  });

  it("detects product_attribute_values table errors", () => {
    expect(isProductAttributesError(new Error("product_attribute_values does not exist"))).toBe(true);
  });

  it("returns false for unrelated validation errors", () => {
    expect(isProductAttributesError(new Error("Unknown field `foobar` on model Product"))).toBe(false);
  });
});
