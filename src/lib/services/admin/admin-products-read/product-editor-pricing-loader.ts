import { db } from "@white-shop/db";
import { formatVariantForAdmin } from "./variant-formatter";
import { isProductAttributesError } from "./query-executor";
import { createProductNotFoundError } from "./product-not-found-error";

const pricingVariantInclude = {
  options: {
    include: {
      attributeValue: {
        include: {
          attribute: true,
        },
      },
    },
  },
} as const;

const pricingVariantsSelect = {
  include: pricingVariantInclude,
  orderBy: { position: "asc" as const },
};

type PricingVariantRow = Parameters<typeof formatVariantForAdmin>[0];

type PricingProductRow = {
  id: string;
  attributeIds: string[];
  productAttributes?: Array<{ attributeId: string }>;
  attributeValues?: Array<{ attributeId: string; attributeValueId: string }>;
  variants: PricingVariantRow[];
};

function mergeAttributeIds(
  productAttributeIds: Array<{ attributeId: string }> | undefined,
  legacyAttributeIds: string[],
): string[] {
  const fromRelations = (productAttributeIds ?? []).map((row) => row.attributeId).filter(Boolean);
  return Array.from(new Set([...fromRelations, ...legacyAttributeIds]));
}

function mapPricingSection(product: PricingProductRow) {
  const attributeValues = product.attributeValues ?? [];

  return {
    id: product.id,
    attributeIds: mergeAttributeIds(product.productAttributes, product.attributeIds),
    attributeValues: attributeValues.map((row) => ({
      attributeId: row.attributeId,
      attributeValueId: row.attributeValueId,
    })),
    attributeValueIds: attributeValues.map((row) => row.attributeValueId),
    variants: product.variants.map((variant) => formatVariantForAdmin(variant)),
  };
}

async function fetchPricingProductFull(productId: string): Promise<PricingProductRow | null> {
  return db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      attributeIds: true,
      variants: pricingVariantsSelect,
      productAttributes: {
        select: { attributeId: true },
      },
      attributeValues: {
        select: { attributeId: true, attributeValueId: true },
      },
    },
  }) as Promise<PricingProductRow | null>;
}

async function fetchPricingProductWithoutProductAttributes(
  productId: string,
): Promise<PricingProductRow | null> {
  return db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      attributeIds: true,
      variants: pricingVariantsSelect,
      attributeValues: {
        select: { attributeId: true, attributeValueId: true },
      },
    },
  }) as Promise<PricingProductRow | null>;
}

async function fetchPricingProductLegacy(productId: string): Promise<PricingProductRow | null> {
  return db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      attributeIds: true,
      variants: pricingVariantsSelect,
    },
  }) as Promise<PricingProductRow | null>;
}

const PRICING_FETCHERS = [
  fetchPricingProductFull,
  fetchPricingProductWithoutProductAttributes,
  fetchPricingProductLegacy,
] as const;

/** Loads pricing tab data with fallbacks for older Prisma clients / missing join tables. */
export async function loadPricingSection(productId: string) {
  for (const fetchPricingProduct of PRICING_FETCHERS) {
    try {
      const product = await fetchPricingProduct(productId);
      if (!product) {
        createProductNotFoundError(productId);
      }
      return mapPricingSection(product);
    } catch (error: unknown) {
      if (!isProductAttributesError(error)) {
        throw error;
      }
    }
  }

  createProductNotFoundError(productId);
}
