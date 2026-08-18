import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

type Selection = {
  attributeId: string;
  attributeKey: string;
  valueId: string;
  value: string;
};

type FilterDefinition = {
  header: string;
  filterIndex: number;
  attributeKey: string;
  attributeLabel: string;
};

const require = createRequire(import.meta.url);
const core = require("../../scripts/marco-csv-import-core.cjs") as {
  buildNewProductAttributeRelations(selections: Selection[]): {
    attributeIds: string[];
    productAttributes?: { create: Array<{ attributeId: string }> };
    attributeValues?: {
      create: Array<{ attributeId: string; attributeValueId: string }>;
    };
  };
  buildFilterColumnDefinitions(row: Record<string, string>): FilterDefinition[];
  chooseExistingFilterAttribute(
    definition: FilterDefinition,
    attributes: Array<{
      id: string;
      key: string;
      translations: Array<{ name: string }>;
    }>,
  ): { id: string; key: string } | null;
  mergeManagedAttributeIds(
    existingIds: string[],
    managedAttributeIds: string[],
    selectedAttributeIds: string[],
  ): string[];
  mergeManagedVariantAttributes(
    existingAttributes: unknown,
    managedAttributeKeys: string[],
    selections: Selection[],
  ): Record<string, unknown> | null;
  parseCsv(content: string): Array<Record<string, string>>;
  splitColorValues(value: string): string[];
  syncManagedProductAttributes(
    tx: Record<string, unknown>,
    input: {
      productId: string;
      managedAttributeIds: string[];
      selections: Selection[];
    },
  ): Promise<void>;
};

describe("Marco CSV attribute import core", () => {
  it("parses a 09468-like row without losing its leading zero and discovers every FilterN", () => {
    const csv = [
      "ID,Name,SKU,Color,Filter1 - Գին,Filter2 - Օգտակար ծավալ",
      '11618,Սառնարան,09468,"Սև, Սպիտակ",120000,60',
    ].join("\n");

    const [row] = core.parseCsv(csv);
    const definitions = core.buildFilterColumnDefinitions(row);

    expect(row.SKU).toBe("09468");
    expect(core.splitColorValues(row.Color)).toEqual(["Սև", "Սպիտակ"]);
    expect(definitions).toEqual([
      {
        header: "Filter1 - Գին",
        filterIndex: 1,
        attributeKey: "marco_filter_1",
        attributeLabel: "Գին",
      },
      {
        header: "Filter2 - Օգտակար ծավալ",
        filterIndex: 2,
        attributeKey: "marco_filter_2",
        attributeLabel: "Օգտակար ծավալ",
      },
    ]);
  });

  it("reuses an existing translated legacy attribute instead of creating a hashed duplicate", () => {
    const [definition] = core.buildFilterColumnDefinitions({
      "Filter1 - Օգտակար ծավալ": "60",
    });
    const existing = {
      id: "attribute-volume",
      key: "marco_filter_12",
      translations: [{ name: "Օգտակար ծավալ" }],
    };

    expect(core.chooseExistingFilterAttribute(definition, [existing])).toEqual(existing);
  });

  it("replaces only import-managed legacy ids and variant JSON", () => {
    expect(
      core.mergeManagedAttributeIds(
        ["manual", "color", "marco-filter"],
        ["color", "marco-filter"],
        ["color"],
      ),
    ).toEqual(["manual", "color"]);

    const merged = core.mergeManagedVariantAttributes(
      {
        manual: [{ valueId: "manual-value" }],
        color: [{ valueId: "old-color" }],
        marco_filter_2: [{ valueId: "old-volume" }],
      },
      ["color", "marco_filter_2"],
      [
        {
          attributeId: "color",
          attributeKey: "color",
          valueId: "black",
          value: "Սև",
        },
      ],
    );

    expect(merged).toEqual({
      manual: [{ valueId: "manual-value" }],
      color: [
        {
          attributeKey: "color",
          value: "Սև",
          valueId: "black",
        },
      ],
    });
  });

  it("builds canonical ProductAttribute and ProductAttributeValue rows for a new product", () => {
    const relations = core.buildNewProductAttributeRelations([
      { attributeId: "color", attributeKey: "color", valueId: "black", value: "Սև" },
      {
        attributeId: "volume",
        attributeKey: "marco_filter_2",
        valueId: "sixty",
        value: "60",
      },
      { attributeId: "color", attributeKey: "color", valueId: "black", value: "Սև" },
    ]);

    expect(relations).toEqual({
      attributeIds: ["color", "volume"],
      productAttributes: {
        create: [{ attributeId: "color" }, { attributeId: "volume" }],
      },
      attributeValues: {
        create: [
          { attributeId: "color", attributeValueId: "black" },
          { attributeId: "volume", attributeValueId: "sixty" },
        ],
      },
    });
  });

  it("clears stale imported selections on existing products while preserving unrelated relations", async () => {
    const productAttributeValue = {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      createMany: vi.fn(),
    };
    const productAttribute = {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      createMany: vi.fn(),
    };

    await core.syncManagedProductAttributes(
      { productAttributeValue, productAttribute },
      {
        productId: "product-09468",
        managedAttributeIds: ["color", "volume"],
        selections: [],
      },
    );

    expect(productAttributeValue.deleteMany).toHaveBeenCalledWith({
      where: {
        productId: "product-09468",
        attributeId: { in: ["color", "volume"] },
      },
    });
    expect(productAttribute.deleteMany).toHaveBeenCalledWith({
      where: {
        productId: "product-09468",
        attributeId: { in: ["color", "volume"] },
      },
    });
    expect(productAttributeValue.createMany).not.toHaveBeenCalled();
    expect(productAttribute.createMany).not.toHaveBeenCalled();
  });

  it("is idempotent when an existing product is imported repeatedly", async () => {
    const state = {
      attributes: new Set(["product-09468:manual", "product-09468:color"]),
      values: new Set(["product-09468:manual-value", "product-09468:old-black"]),
    };
    const managedIds = ["color", "volume"];
    const valueAttribute = new Map([
      ["manual-value", "manual"],
      ["old-black", "color"],
      ["black", "color"],
      ["sixty", "volume"],
    ]);
    const tx = {
      productAttributeValue: {
        deleteMany: vi.fn(async ({ where }) => {
          for (const key of [...state.values]) {
            const valueId = key.split(":")[1];
            if (where.attributeId.in.includes(valueAttribute.get(valueId))) state.values.delete(key);
          }
        }),
        createMany: vi.fn(async ({ data }) => {
          for (const row of data) state.values.add(`${row.productId}:${row.attributeValueId}`);
        }),
      },
      productAttribute: {
        deleteMany: vi.fn(async ({ where }) => {
          for (const key of [...state.attributes]) {
            const attributeId = key.split(":")[1];
            if (where.attributeId.in.includes(attributeId)) state.attributes.delete(key);
          }
        }),
        createMany: vi.fn(async ({ data }) => {
          for (const row of data) state.attributes.add(`${row.productId}:${row.attributeId}`);
        }),
      },
    };
    const selections: Selection[] = [
      { attributeId: "color", attributeKey: "color", valueId: "black", value: "Սև" },
      {
        attributeId: "volume",
        attributeKey: "marco_filter_2",
        valueId: "sixty",
        value: "60",
      },
    ];

    const importOnce = () =>
      core.syncManagedProductAttributes(tx, {
        productId: "product-09468",
        managedAttributeIds: managedIds,
        selections,
      });

    await importOnce();
    const firstState = {
      attributes: [...state.attributes].sort(),
      values: [...state.values].sort(),
    };
    await importOnce();

    expect({
      attributes: [...state.attributes].sort(),
      values: [...state.values].sort(),
    }).toEqual(firstState);
    expect(firstState).toEqual({
      attributes: ["product-09468:color", "product-09468:manual", "product-09468:volume"],
      values: ["product-09468:black", "product-09468:manual-value", "product-09468:sixty"],
    });
  });
});
