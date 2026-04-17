import { describe, expect, it } from "vitest";
import { buildTechnicalSpecifications } from "./technical-specifications";

describe("buildTechnicalSpecifications", () => {
  it("builds deduplicated localized specs from product attributes", () => {
    const specifications = buildTechnicalSpecifications(
      [
        {
          attribute: {
            key: "ram",
            translations: [
              { locale: "en", name: "RAM" },
              { locale: "hy", name: "Օպերատիվ հիշողություն" },
            ],
            values: [
              {
                value: "8GB",
                translations: [
                  { locale: "en", label: "8 GB" },
                  { locale: "hy", label: "8 ԳԲ" },
                ],
              },
              {
                value: "16GB",
                translations: [
                  { locale: "en", label: "16 GB" },
                  { locale: "hy", label: "16 ԳԲ" },
                ],
              },
            ],
          },
        },
      ],
      [],
      "hy"
    );

    expect(specifications).toEqual([
      {
        key: "ram",
        name: "Օպերատիվ հիշողություն",
        values: ["8 ԳԲ", "16 ԳԲ"],
        value: "8 ԳԲ, 16 ԳԲ",
      },
    ]);
  });

  it("falls back to variant options when product attributes are missing", () => {
    const specifications = buildTechnicalSpecifications(
      undefined,
      [
        {
          options: [
            {
              key: "storage",
              value: "256GB",
            },
            {
              key: "color",
              value: "Black",
            },
          ],
        },
        {
          options: [
            {
              key: "storage",
              value: "256GB",
            },
            {
              attributeValue: {
                attribute: { key: "cpu" },
                value: "Snapdragon 8 Gen 2",
                translations: [{ locale: "en", label: "Snapdragon 8 Gen 2" }],
              },
            },
          ],
        },
      ],
      "en"
    );

    expect(specifications).toEqual([
      {
        key: "cpu",
        name: "cpu",
        values: ["Snapdragon 8 Gen 2"],
        value: "Snapdragon 8 Gen 2",
      },
      {
        key: "storage",
        name: "storage",
        values: ["256GB"],
        value: "256GB",
      },
    ]);
  });
});
