import { db } from "@white-shop/db";
import type { DiscountKind } from "@/lib/discount/discount-expiry";
import { revalidateProductCache } from "./admin-products-update/cache-revalidator";
import {
  deleteProductListingReadModel,
  syncProductListingReadModel,
} from "@/lib/read-model/product-read-model-sync";

type ProductDiscountInput = {
  discountType: DiscountKind;
  discountValue: number | null;
  discountExpiresAt: string | null;
};

const PERCENT_MAX = 100;

/** Clamps the incoming discount; non-positive values collapse to NONE. */
function normalizeProductDiscount(input: ProductDiscountInput): ProductDiscountInput {
  if (input.discountType === "PERCENT") {
    const value = Math.max(0, Math.min(PERCENT_MAX, input.discountValue ?? 0));
    return value > 0
      ? { discountType: "PERCENT", discountValue: value, discountExpiresAt: input.discountExpiresAt }
      : { discountType: "NONE", discountValue: null, discountExpiresAt: null };
  }
  if (input.discountType === "AMOUNT") {
    const value = input.discountValue ?? 0;
    return value > 0
      ? { discountType: "AMOUNT", discountValue: value, discountExpiresAt: input.discountExpiresAt }
      : { discountType: "NONE", discountValue: null, discountExpiresAt: null };
  }
  return { discountType: "NONE", discountValue: null, discountExpiresAt: null };
}

class AdminProductsDeleteService {
  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: string) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        translations: {
          select: {
            slug: true,
          },
          take: 1,
        },
      },
    });

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    await db.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        published: false,
      },
    });
    await deleteProductListingReadModel(productId);
    await revalidateProductCache(productId, product.translations[0]?.slug);

    return { success: true };
  }

  /**
   * Update product-level discount (PERCENT or AMOUNT) and resync the read-model.
   */
  async updateProductDiscount(productId: string, input: ProductDiscountInput) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        translations: {
          select: { slug: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    const normalized = normalizeProductDiscount(input);
    const updated = await db.product.update({
      where: { id: productId },
      data: {
        discountType: normalized.discountType,
        discountValue: normalized.discountValue,
        discountExpiresAt: normalized.discountExpiresAt
          ? new Date(normalized.discountExpiresAt)
          : null,
      },
      select: {
        discountType: true,
        discountValue: true,
        discountExpiresAt: true,
      },
    });
    await syncProductListingReadModel(productId);
    await revalidateProductCache(productId, product.translations[0]?.slug);

    return {
      success: true,
      discountType: updated.discountType as DiscountKind,
      discountValue: updated.discountValue ?? null,
      discountExpiresAt: updated.discountExpiresAt?.toISOString() ?? null,
    };
  }
}

export const adminProductsDeleteService = new AdminProductsDeleteService();





