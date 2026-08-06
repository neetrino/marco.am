import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyListingMock, countListingMock, findManyProductMock } = vi.hoisted(() => ({
  findManyListingMock: vi.fn(),
  countListingMock: vi.fn(),
  findManyProductMock: vi.fn(),
}));

vi.mock("@white-shop/db", () => ({
  db: {
    productListingRow: {
      findMany: findManyListingMock,
      count: countListingMock,
    },
    product: {
      findMany: findManyProductMock,
    },
  },
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  ADMIN_LIST_PRODUCT_TITLE_LOCALE,
  executeAdminProductListViaListingRows,
  isProductAttributesError,
} from "./query-executor";
import { formatProductForList } from "./product-formatter";

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

describe("executeAdminProductListViaListingRows — English title include", () => {
  beforeEach(() => {
    findManyListingMock.mockReset();
    countListingMock.mockReset();
    findManyProductMock.mockReset();
  });

  it.each([
    { uiLang: "en" as const },
    { uiLang: "hy" as const },
    { uiLang: "ru" as const },
  ])("loads English translation when listing filtered by lang=$uiLang", async ({ uiLang }) => {
    findManyListingMock.mockResolvedValue([{ productId: "prod-1", image: null }]);
    countListingMock.mockResolvedValue(1);
    findManyProductMock.mockResolvedValue([
      {
        id: "prod-1",
        published: true,
        featured: false,
        createdAt: new Date("2026-01-01"),
        media: [],
        translations: [{ locale: "en", title: "English Sofa", slug: "english-sofa" }],
        variants: [{ price: 100, stock: 1, sku: "SKU-1", imageUrl: null, published: true }],
      },
    ]);

    const { products } = await executeAdminProductListViaListingRows(
      { locale: uiLang, deletedAt: null },
      [{ productCreatedAt: "desc" }],
      0,
      20,
    );

    expect(findManyListingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { productId: true, image: true },
      }),
    );
    expect(products[0]).toEqual(
      expect.objectContaining({
        id: "prod-1",
        listingRowImage: null,
      }),
    );

    expect(findManyProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          translations: {
            where: { locale: ADMIN_LIST_PRODUCT_TITLE_LOCALE },
            take: 1,
            select: { slug: true, title: true },
          },
        }),
      }),
    );
    expect(ADMIN_LIST_PRODUCT_TITLE_LOCALE).toBe("en");

    const formatted = formatProductForList(products[0]!, uiLang);
    expect(formatted.title).toBe("English Sofa");
  });

  it("returns English title for hy/ru UI when only English translation is present", () => {
    const product = {
      id: "prod-2",
      published: true,
      featured: false,
      createdAt: new Date("2026-01-01"),
      media: [],
      translations: [{ locale: "en", title: "Only English Chair", slug: "only-english-chair" }],
      variants: [{ price: 50, stock: 0, sku: "SKU-2", imageUrl: null }],
    };

    expect(formatProductForList(product, "en").title).toBe("Only English Chair");
    expect(formatProductForList(product, "hy").title).toBe("Only English Chair");
    expect(formatProductForList(product, "ru").title).toBe("Only English Chair");
  });
});
