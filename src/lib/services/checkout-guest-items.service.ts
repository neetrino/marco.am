import { db } from "@white-shop/db";
import { extractMediaUrl } from "../utils/extractMediaUrl";
import {
  resolveProductClass,
  type ProductClass,
} from "../constants/product-class";

export type GuestCheckoutItemInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type NormalizedGuestCheckoutItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type ResolvedGuestCheckoutItem = {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
  productClass: ProductClass;
  productTitle: string;
  variantTitle?: string;
  sku: string;
  imageUrl?: string;
};

type NormalizeOptions = {
  detailPrefix?: string;
};

function validationError(detail: string) {
  return {
    status: 400,
    type: "https://api.shop.am/problems/validation-error",
    title: "Validation Error",
    detail,
  };
}

function notFoundError(variantId: string, productId: string) {
  return {
    status: 404,
    type: "https://api.shop.am/problems/not-found",
    title: "Product variant not found",
    detail: `Variant ${variantId} not found for product ${productId}`,
  };
}

function outOfStockError(variantId: string, available: number, requested: number) {
  return {
    status: 422,
    type: "https://api.shop.am/problems/validation-error",
    title: "Insufficient stock",
    detail: `Insufficient stock for variant ${variantId}. Available: ${available}, requested: ${requested}`,
  };
}

export function normalizeGuestCheckoutItemsInput(
  items: GuestCheckoutItemInput[],
  options?: NormalizeOptions
): NormalizedGuestCheckoutItem[] {
  const detailPrefix = options?.detailPrefix ?? "Each item";
  const byVariant = new Map<string, NormalizedGuestCheckoutItem>();

  for (const item of items) {
    if (!item.productId || !item.variantId) {
      throw validationError(
        `${detailPrefix} must include productId, variantId, and quantity`
      );
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw validationError("quantity must be a positive integer");
    }

    const existing = byVariant.get(item.variantId);
    if (existing && existing.productId !== item.productId) {
      throw validationError(
        `Variant ${item.variantId} belongs to multiple productIds in payload`
      );
    }

    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }

    byVariant.set(item.variantId, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    });
  }

  return [...byVariant.values()];
}

export async function resolveGuestCheckoutItems(
  items: GuestCheckoutItemInput[],
  locale: string
): Promise<ResolvedGuestCheckoutItem[]> {
  const normalized = normalizeGuestCheckoutItemsInput(items);
  const variantIds = normalized.map((item) => item.variantId);

  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: { include: { translations: true } },
      options: true,
    },
  });
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  return normalized.map((item) => {
    const variant = variantMap.get(item.variantId);
    if (!variant || variant.productId !== item.productId) {
      throw notFoundError(item.variantId, item.productId);
    }

    if (!variant.published || !variant.product.published || variant.product.deletedAt) {
      throw notFoundError(item.variantId, item.productId);
    }

    if (variant.stock < item.quantity) {
      throw outOfStockError(item.variantId, variant.stock, item.quantity);
    }

    const translation =
      variant.product.translations.find((entry) => entry.locale === locale) ??
      variant.product.translations[0];

    const variantTitle =
      variant.options
        ?.map((option) => `${option.attributeKey ?? ""}: ${option.value ?? ""}`)
        .join(", ") || undefined;

    return {
      variantId: variant.id,
      productId: variant.product.id,
      quantity: item.quantity,
      price: Number(variant.price),
      productClass: resolveProductClass(
        variant.productClass ?? variant.product.productClass
      ),
      productTitle: translation?.title ?? "Unknown Product",
      variantTitle,
      sku: variant.sku ?? "",
      imageUrl: extractMediaUrl(variant.product.media) ?? undefined,
    };
  });
}
