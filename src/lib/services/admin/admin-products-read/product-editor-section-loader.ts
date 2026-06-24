import { db } from "@white-shop/db";
import type { ProductEditorSection } from "@/app/supersudo/products/add/product-editor-tabs";
import { parseProductDescriptionJson } from "@/lib/products/product-description";
import { loadPricingSection } from "./product-editor-pricing-loader";
import { createProductNotFoundError } from "./product-not-found-error";

const ADMIN_PRODUCT_LOCALE = "en";

type TranslationRow = { locale: string };

function pickTranslation<T extends TranslationRow>(translations: T[]): T | null {
  return translations.find((row) => row.locale === ADMIN_PRODUCT_LOCALE) ?? translations[0] ?? null;
}

function normalizeWarrantyYears(value: number | null | undefined): 1 | 2 | 3 | null {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }
  return null;
}

async function loadGeneralSection(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      featured: true,
      productClass: true,
      warrantyYears: true,
      translations: {
        select: { locale: true, title: true, slug: true },
      },
      labels: {
        select: { id: true, type: true, value: true, position: true, color: true },
      },
    },
  });

  if (!product) {
    createProductNotFoundError(productId);
  }

  const translation = pickTranslation(product.translations);

  return {
    id: product.id,
    title: translation?.title || "",
    slug: translation?.slug || "",
    featured: Boolean(product.featured),
    productClass: product.productClass || "retail",
    warrantyYears: normalizeWarrantyYears(product.warrantyYears),
    labels: product.labels.map((label) => ({
      id: label.id,
      type: label.type,
      value: label.value,
      position: label.position,
      color: label.color,
    })),
  };
}

async function loadDescriptionSection(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      translations: {
        select: { locale: true, description: true },
      },
    },
  });

  if (!product) {
    createProductNotFoundError(productId);
  }

  const translation = pickTranslation(product.translations);

  return {
    id: product.id,
    description: parseProductDescriptionJson(translation?.description),
  };
}

async function loadMediaSection(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      media: true,
      variants: {
        select: { id: true, imageUrl: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!product) {
    createProductNotFoundError(productId);
  }

  const media = Array.isArray(product.media) ? product.media : [];

  return {
    id: product.id,
    media,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      imageUrl: variant.imageUrl || "",
    })),
  };
}

async function loadCatalogSection(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      brandId: true,
      categoryIds: true,
      primaryCategoryId: true,
    },
  });

  if (!product) {
    createProductNotFoundError(productId);
  }

  return {
    id: product.id,
    brandId: product.brandId || null,
    primaryCategoryId: product.primaryCategoryId || null,
    categoryIds: product.categoryIds || [],
  };
}

/** Loads only the DB fields required for a product editor tab. */
export async function loadProductEditorSection(productId: string, section: ProductEditorSection) {
  switch (section) {
    case "general":
      return loadGeneralSection(productId);
    case "description":
      return loadDescriptionSection(productId);
    case "media":
      return loadMediaSection(productId);
    case "catalog":
      return loadCatalogSection(productId);
    case "pricing":
      return loadPricingSection(productId);
    default:
      createProductNotFoundError(productId);
  }
}
