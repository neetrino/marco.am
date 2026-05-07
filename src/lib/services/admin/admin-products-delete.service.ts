import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import { revalidateProductCache } from "./admin-products-update/cache-revalidator";

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
    await revalidateProductCache(productId, product.translations[0]?.slug);

    return { success: true };
  }

  /**
   * Update product discount
   */
  async updateProductDiscount(productId: string, discountPercent: number) {
    logger.devLog('💰 [ADMIN PRODUCTS DELETE SERVICE] updateProductDiscount called:', { productId, discountPercent });
    
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        discountPercent: true,
        translations: {
          select: {
            slug: true,
          },
          take: 1,
        },
      },
    });

    if (!product) {
      console.error('❌ [ADMIN PRODUCTS DELETE SERVICE] Product not found:', productId);
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    const clampedDiscount = Math.max(0, Math.min(100, discountPercent));
    logger.devLog('💰 [ADMIN PRODUCTS DELETE SERVICE] Updating product discount:', {
      productId,
      oldDiscount: product.discountPercent,
      newDiscount: clampedDiscount,
    });

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        discountPercent: clampedDiscount,
      },
      select: {
        discountPercent: true,
      },
    });
    await revalidateProductCache(productId, product.translations[0]?.slug);

    logger.devLog('✅ [ADMIN PRODUCTS DELETE SERVICE] Product discount updated successfully:', {
      productId,
      discountPercent: updated.discountPercent,
    });

    return { success: true, discountPercent: updated.discountPercent };
  }
}

export const adminProductsDeleteService = new AdminProductsDeleteService();






