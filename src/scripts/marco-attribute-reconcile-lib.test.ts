import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  planReconciliation,
  resolveDefinition,
  summarizePlans,
} = require("../../scripts/marco-attribute-reconcile-lib.cjs");

const definitions = [
  {
    id: "color",
    kind: "color",
    label: "Color",
    semanticKey: "color",
    compatibilityKeys: ["color"],
  },
  {
    id: "technical:1",
    kind: "technical",
    label: "Օգտակար ծավալ",
    semanticKey: "spec-1-deadbeef",
    compatibilityKeys: ["marco_filter_20"],
  },
];

const attributes = [
  {
    id: "attr-color",
    key: "color",
    translations: [{ locale: "hy", name: "Գույն" }],
    values: [
      { id: "black", value: "Սև", translations: [{ locale: "hy", label: "Սև" }] },
      { id: "white", value: "Սպիտակ", translations: [{ locale: "hy", label: "Սպիտակ" }] },
    ],
  },
  {
    id: "attr-volume",
    key: "marco_filter_20",
    translations: [{ locale: "hy", name: "Օգտակար ծավալ" }],
    values: [{ id: "volume-60", value: "60", translations: [] }],
  },
  {
    id: "attr-manual",
    key: "manual-note",
    translations: [{ locale: "hy", name: "Manual" }],
    values: [{ id: "manual-value", value: "Keep", translations: [] }],
  },
];

function manifest(entries: unknown[]) {
  return {
    schemaVersion: 1,
    source: { fileName: "Marco.xlsx", sha256: "test", sheet: "Worksheet" },
    attributeDefinitions: definitions,
    entries,
    stats: {},
  };
}

describe("Marco attribute reconciliation planning", () => {
  it("plans the 09468 missing links while preserving the leading-zero SKU", () => {
    const input = manifest([
      {
        sku: "09468",
        sourceRow: 1613,
        values: [
          { definitionId: "color", value: "Սև", sourceCell: "M1613" },
          { definitionId: "technical:1", value: "60", sourceCell: "N1613" },
        ],
      },
    ]);
    const products = [
      {
        id: "product-09468",
        sku: "09468",
        productAttributes: [{ attributeId: "attr-color" }],
        attributeValues: [],
      },
    ];

    const [plan] = planReconciliation(input, products, attributes);
    expect(plan.sku).toBe("09468");
    expect(plan.statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "link_create",
          linkType: "product_attribute_value",
          attributeId: "attr-color",
          attributeValueId: "black",
        }),
        expect.objectContaining({
          status: "link_create",
          linkType: "product_attribute",
          attributeId: "attr-volume",
        }),
        expect.objectContaining({
          status: "link_create",
          linkType: "product_attribute_value",
          attributeValueId: "volume-60",
        }),
      ]),
    );
  });

  it("plans value creation, stale removal, and retains unrelated manual values", () => {
    const input = manifest([
      {
        sku: "00007",
        sourceRow: 2,
        values: [{ definitionId: "color", value: "Սև", sourceCell: "M2" }],
      },
    ]);
    const products = [
      {
        id: "product-7",
        sku: "00007",
        productAttributes: [
          { attributeId: "attr-color" },
          { attributeId: "attr-volume" },
          { attributeId: "attr-manual" },
        ],
        attributeValues: [
          {
            id: "link-white",
            attributeId: "attr-color",
            attributeValueId: "white",
          },
          {
            id: "link-volume",
            attributeId: "attr-volume",
            attributeValueId: "volume-60",
          },
          {
            id: "link-manual",
            attributeId: "attr-manual",
            attributeValueId: "manual-value",
          },
        ],
      },
    ];

    const [plan] = planReconciliation(input, products, attributes);
    expect(plan.staleLinkIds).toEqual(["link-volume", "link-white"]);
    expect(plan.staleLinkIds).not.toContain("link-manual");
    expect(plan.statuses).toContainEqual(
      expect.objectContaining({ status: "link_create", attributeValueId: "black" }),
    );
  });

  it("plans a safe value_create when the attribute exists but its value does not", () => {
    const input = manifest([
      {
        sku: "09468",
        sourceRow: 1613,
        values: [{ definitionId: "color", value: "Անտրացիտ" }],
      },
    ]);
    const product = {
      id: "product-09468",
      sku: "09468",
      productAttributes: [{ attributeId: "attr-color" }],
      attributeValues: [],
    };
    const [plan] = planReconciliation(input, [product], attributes);

    expect(plan.statuses).toContainEqual(
      expect.objectContaining({ status: "value_create", value: "Անտրացիտ" }),
    );
    expect(plan.statuses).toContainEqual(
      expect.objectContaining({
        status: "link_create",
        linkType: "product_attribute_value",
        attributeValueId: null,
      }),
    );
  });

  it("prefers an exact translation label over a marco_filter compatibility key", () => {
    const resolution = resolveDefinition(definitions[1], [
      {
        id: "translated",
        key: "useful-volume",
        translations: [{ locale: "hy", name: "Օգտակար ծավալ" }],
        values: [],
      },
      {
        id: "legacy",
        key: "marco_filter_20",
        translations: [{ locale: "hy", name: "Different" }],
        values: [],
      },
    ]);

    expect(resolution.attribute.id).toBe("translated");
    expect(resolution.method).toBe("translation_label");
  });

  it("reports missing products, unresolved attributes, and noop products", () => {
    const unresolvedManifest = {
      schemaVersion: 1,
      source: {},
      attributeDefinitions: [
        {
          id: "technical:99",
          kind: "technical",
          label: "Unknown spec",
          semanticKey: "unknown-spec",
          compatibilityKeys: ["marco_filter_99"],
        },
      ],
      entries: [
        {
          sku: "missing",
          sourceRow: 2,
          values: [{ definitionId: "technical:99", value: "x" }],
        },
        {
          sku: "present",
          sourceRow: 3,
          values: [{ definitionId: "technical:99", value: "x" }],
        },
      ],
    };
    const plans = planReconciliation(
      unresolvedManifest,
      [{ id: "present-product", sku: "present", productAttributes: [], attributeValues: [] }],
      attributes,
    );
    expect(plans[0].statuses).toEqual([{ status: "product_not_found" }]);
    expect(plans[1].statuses).toContainEqual(
      expect.objectContaining({ status: "attribute_unresolved", reason: "not_found" }),
    );
    expect(summarizePlans(plans)).toMatchObject({
      product_not_found: 1,
      attribute_unresolved: 1,
    });

    const noop = planReconciliation(
      manifest([
        {
          sku: "09468",
          sourceRow: 1613,
          values: [{ definitionId: "color", value: "Սև" }],
        },
      ]),
      [
        {
          id: "product-09468",
          sku: "09468",
          productAttributes: [{ attributeId: "attr-color" }],
          attributeValues: [
            { id: "link-black", attributeId: "attr-color", attributeValueId: "black" },
          ],
        },
      ],
      attributes,
    );
    expect(noop[0].statuses).toEqual([{ status: "noop" }]);
  });
});
