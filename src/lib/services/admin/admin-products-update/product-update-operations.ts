import { db } from "@white-shop/db";
import { Prisma } from "@white-shop/db/prisma";
import { logger } from "../../../utils/logger";
import { resolveProductClass } from "@/lib/constants/product-class";
import { ensureProductAttributesTable } from "../../../utils/db-ensure";
import type { UpdateProductData } from "./types";
import { collectVariantImages, buildProductUpdateData, updateProductTranslation, updateProductLabels, updateProductAttributes } from "./product-updater";
import { prepareVariantForWrite, updateOrCreateVariant } from "./variant-updater";
import { updateAttributeValueImageUrls } from "./attribute-value-updater";

function sanitizeUpdatePayload(data: UpdateProductData) {
  return {
    keys: Object.keys(data),
    hasVariants: data.variants !== undefined,
    variantsCount: data.variants?.length ?? 0,
    hasMedia: data.media !== undefined,
    mediaCount: Array.isArray(data.media) ? data.media.length : 0,
    hasLabels: data.labels !== undefined,
    labelsCount: data.labels?.length ?? 0,
    hasAttributeIds: data.attributeIds !== undefined,
    attributeIdsCount: data.attributeIds?.length ?? 0,
    locale: data.locale ?? "en",
  };
}

function validateProductUpdatePayload(productId: string, data: UpdateProductData): void {
  if (!productId || typeof productId !== "string") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Invalid product id",
    };
  }

  if (data.variants !== undefined && !Array.isArray(data.variants)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Field 'variants' must be an array when provided",
    };
  }
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  data: UpdateProductData
) {
  const payloadSummary = sanitizeUpdatePayload(data);
  let operationStep = "validate-payload";

  try {
    logger.info("Updating product", { productId, payloadSummary });
    validateProductUpdatePayload(productId, data);
    operationStep = "load-existing-product";
    
    // Check if product exists
    const existing = await db.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
      }
    });

    if (!existing) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    if (data.attributeIds !== undefined) {
      operationStep = "ensure-product-attributes-table";
      const tableReady = await ensureProductAttributesTable();
      if (!tableReady) {
        throw new Error("Product attributes table is not available");
      }
    }

    operationStep = "prepare-update-data";

    const existingVariantImageUrls =
      data.variants === undefined
        ? (
            await db.productVariant.findMany({
              where: { productId },
              select: { imageUrl: true },
            })
          )
            .map((variant) => variant.imageUrl)
            .filter((url): url is string => typeof url === "string" && url.length > 0)
        : [];

    const fallbackProductClass = resolveProductClass(data.productClass ?? existing.productClass);
    const preparedVariants =
      data.variants === undefined
        ? undefined
        : await Promise.all(
            data.variants.map((variant) =>
              prepareVariantForWrite(variant, fallbackProductClass),
            ),
          );

    const allVariantImages = await collectVariantImages(preparedVariants, existingVariantImageUrls);
    const updateData = await buildProductUpdateData(data, allVariantImages, existing);

    operationStep = "transaction-write";

    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update translation
      await updateProductTranslation(productId, data, tx);

      // 2. Update labels
      await updateProductLabels(productId, data.labels, tx);

      // 3. Update ProductAttribute relations
      await updateProductAttributes(productId, data.attributeIds, tx);

      // 4. Update variants
      if (preparedVariants !== undefined) {
        // Get existing variants with their IDs and SKUs for matching
        const existingVariants = await tx.productVariant.findMany({
          where: { productId },
          select: { id: true, sku: true },
        });
        const existingVariantIds = new Set<string>(existingVariants.map((v: { id: string }) => v.id));
        // Create a map of SKU -> variant ID for quick lookup
        const existingSkuMap = new Map<string, string>();
        existingVariants.forEach((v: { id: string; sku: string | null }) => {
          if (v.sku) {
            existingSkuMap.set(v.sku.trim().toLowerCase(), v.id);
          }
        });
        const incomingVariantIds = new Set<string>();
        
        const locale = data.locale || "en";
        
        // Process each variant: update if exists, create if new
        if (preparedVariants.length > 0) {
          for (const variant of preparedVariants) {
            const variantId = await updateOrCreateVariant(
              variant,
              productId,
              locale,
              existingVariantIds,
              existingSkuMap,
              tx
            );
            incomingVariantIds.add(variantId);
          }
        }
        
        // Delete variants that are no longer in the list
        const variantsToDelete = Array.from(existingVariantIds).filter(id => !incomingVariantIds.has(id));
        if (variantsToDelete.length > 0) {
          const cartItemsDeleteResult = await tx.cartItem.deleteMany({
            where: {
              productId,
              variantId: { in: variantsToDelete },
            },
          });

          await tx.productVariant.deleteMany({
            where: {
              id: { in: variantsToDelete },
              productId,
            },
          });
          logger.info(`Deleted ${variantsToDelete.length} variant(s)`, {
            variantIds: variantsToDelete,
            deletedCartItemsCount: cartItemsDeleteResult.count,
          });
        }
      }

      // 5. Finally update the product record itself
      return tx.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          translations: true,
          variants: {
            include: {
              options: true,
            },
          },
          labels: true,
        },
      });
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    operationStep = "post-commit-attribute-value-sync";
    await updateAttributeValueImageUrls(productId, db);

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const prismaCode =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    logger.error("updateProduct error", {
      productId,
      operationStep,
      payloadSummary,
      prismaCode,
      error: errorMessage,
    });
    throw error;
  }
}




