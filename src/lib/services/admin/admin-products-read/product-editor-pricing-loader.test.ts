import { describe, expect, it, vi, beforeEach } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@white-shop/db", () => ({
  db: {
    product: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("./variant-formatter", () => ({
  formatVariantForAdmin: (variant: { id: string }) => ({ id: variant.id, price: "0" }),
}));

import { loadPricingSection } from "./product-editor-pricing-loader";

describe("loadPricingSection", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("falls back to legacy query when attributeValues is unknown in Prisma client", async () => {
    const validationError = new Error(
      "Invalid `prisma.product.findUnique()` invocation:\n\nUnknown field `attributeValues`",
    );

    findUniqueMock
      .mockRejectedValueOnce(validationError)
      .mockRejectedValueOnce(validationError)
      .mockResolvedValueOnce({
        id: "prod-1",
        attributeIds: ["attr-legacy"],
        variants: [{ id: "var-1" }],
      });

    const result = await loadPricingSection("prod-1");

    expect(findUniqueMock).toHaveBeenCalledTimes(3);
    expect(result.attributeIds).toEqual(["attr-legacy"]);
    expect(result.attributeValues).toEqual([]);
    expect(result.variants).toEqual([{ id: "var-1", price: "0" }]);
  });

  it("uses full query when product attribute relations are available", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "prod-2",
      attributeIds: ["legacy"],
      productAttributes: [{ attributeId: "rel-attr" }],
      attributeValues: [{ attributeId: "rel-attr", attributeValueId: "val-1" }],
      variants: [{ id: "var-2" }],
    });

    const result = await loadPricingSection("prod-2");

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(result.attributeIds).toEqual(["rel-attr", "legacy"]);
    expect(result.attributeValueIds).toEqual(["val-1"]);
  });
});
