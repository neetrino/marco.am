import { describe, expect, it } from "vitest";
import {
  parseTechnicalSpecFiltersFromSearchParams,
  productMatchesTechnicalSpecs,
} from "./products-technical-filters";
import type { ProductWithRelations } from "./products-find-query/types";

function createProductWithSpecs(): ProductWithRelations {
  return {
    variants: [
      {
        options: [
          {
            attributeValue: {
              value: "8GB",
              translations: [{ locale: "en", label: "8 GB" }],
              attribute: {
                key: "ram",
              },
            },
          },
          {
            attributeValue: {
              value: "256GB",
              translations: [{ locale: "en", label: "256 GB" }],
              attribute: {
                key: "storage",
              },
            },
          },
        ],
      },
    ],
  } as unknown as ProductWithRelations;
}

describe("parseTechnicalSpecFiltersFromSearchParams", () => {
  it("parses prefixed technical filters and ignores reserved keys", () => {
    const searchParams = new URLSearchParams();
    searchParams.set("spec.ram", "8GB,16GB");
    searchParams.set("spec.storage", "256GB");
    searchParams.set("spec.color", "black");

    expect(parseTechnicalSpecFiltersFromSearchParams(searchParams)).toEqual({
      ram: ["8gb", "16gb"],
      storage: ["256gb"],
    });
  });

  it("merges specs JSON with prefixed params", () => {
    const searchParams = new URLSearchParams();
    searchParams.set("specs", JSON.stringify({ ram: ["8GB"], storage: "256GB" }));
    searchParams.set("spec.ram", "16GB");

    expect(parseTechnicalSpecFiltersFromSearchParams(searchParams)).toEqual({
      ram: ["8gb", "16gb"],
      storage: ["256gb"],
    });
  });
});

describe("productMatchesTechnicalSpecs", () => {
  it("requires every attribute key and allows any selected value", () => {
    const product = createProductWithSpecs();

    expect(
      productMatchesTechnicalSpecs(product, {
        ram: ["8 gb", "12 gb"],
        storage: ["256 gb"],
      })
    ).toBe(true);
  });

  it("returns false when one of requested keys is missing", () => {
    const product = createProductWithSpecs();

    expect(
      productMatchesTechnicalSpecs(product, {
        ram: ["8 gb"],
        cpu: ["snapdragon"],
      })
    ).toBe(false);
  });
});
