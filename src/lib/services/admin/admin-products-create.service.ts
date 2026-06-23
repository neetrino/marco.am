import { db } from "@white-shop/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { findOrCreateAttributeValue } from "../../utils/variant-generator";
import { ensureProductAttributesTable } from "../../utils/db-ensure";
import {
  processImageUrl,
  smartSplitUrls,
  cleanImageUrls,
  separateMainAndVariantImages,
} from "../../utils/image-utils";
import {
  normalizeCommaSeparatedRasterDataUrls,
  normalizeInboundRasterStringToWebpDataUrl,
  normalizeProductMediaPayload,
} from "@/lib/utils/normalize-inbound-raster-to-webp-data-url";
import {
  resolveProductClass,
  type ProductClass,
} from "@/lib/constants/product-class";
import { normalizeProductWarrantyYears } from "@/lib/constants/product-warranty";
import {
  filterProductDescriptionForSave,
  toPrismaProductDescription,
  type ProductDescriptionEntry,
} from "@/lib/products/product-description";
import {
  isProductSubtitleHtmlEmpty,
  sanitizeProductSubtitleHtml,
} from "@/lib/security/sanitize-product-html";
import { logger } from "@/lib/utils/logger";
import type { PrismaTransactionClient } from "@/lib/types/prisma";
import { getErrorMessage, getPrismaErrorCode } from "@/lib/types/errors";
import { cacheService } from "../cache.service";
import { invalidateCategoryPublicCaches } from "../read-through-json-cache";
import {
  normalizeProductCategoryLinks,
  toProductCategoriesConnect,
} from "../product-category-links.service";
import { syncProductListingReadModel } from "@/lib/read-model/product-read-model-sync";
import { normalizeVariantDiscountForWrite } from "./variant-discount-write";
import type { DiscountKind } from "@/lib/discount/discount-expiry";

type ProductMediaItem = string | { url: string };

type VariantDiscountInput = {
  discountType?: DiscountKind | string | null;
  discountValue?: number | string | null;
  discountExpiresAt?: string | null;
};

type CreateProductVariantInput = {
  price: string | number;
  stock: string | number;
  sku?: string;
  productClass?: ProductClass;
  color?: string;
  size?: string;
  imageUrl?: string;
  published?: boolean;
  options?: Array<{
    attributeKey: string;
    value: string;
    valueId?: string;
  }>;
} & VariantDiscountInput;

type VariantOptionPayload =
  | { valueId: string }
  | { attributeKey: string; value: string };

class AdminProductsCreateService {
  /**
   * Validate and return SKU for a product variant.
   * SKU is optional: empty input resolves to `undefined` (stored as null).
   * When provided, it must be unique within the product and across the catalog.
   */
  private async resolveVariantSku(
    tx: PrismaTransactionClient,
    baseSku: string | undefined,
    variantIndex: number,
    usedSkus: Set<string>
  ): Promise<string | undefined> {
    const trimmedSku = baseSku?.trim() ?? '';
    if (!trimmedSku) {
      return undefined;
    }

    if (usedSkus.has(trimmedSku)) {
      throw new Error(`Duplicate SKU "${trimmedSku}" in this product. Each variant must have a unique SKU.`);
    }

    const existing = await tx.productVariant.findUnique({
      where: { sku: trimmedSku },
    });

    if (existing) {
      throw new Error(`SKU "${trimmedSku}" already exists. Please use a unique SKU.`);
    }

    usedSkus.add(trimmedSku);
    logger.devLog(`✅ [ADMIN PRODUCTS CREATE SERVICE] Using SKU: ${trimmedSku}`);
    return trimmedSku;
  }

  /**
   * Create product
   */
  async createProduct(data: {
    title: string;
    slug: string;
    subtitle?: string;
    description?: ProductDescriptionEntry[];
    brandId?: string;
    primaryCategoryId?: string;
    categoryIds?: string[];
    productClass?: ProductClass;
    published: boolean;
    featured?: boolean;
    locale: string;
    media?: ProductMediaItem[];
    mainProductImage?: string;
    labels?: Array<{
      type: string;
      value: string;
      position: string;
      color?: string | null;
    }>;
    warrantyYears?: number | null;
    attributeIds?: string[];
    variants: Array<{
      price: string | number;
      stock: string | number;
      sku?: string;
      productClass?: ProductClass;
      color?: string;
      size?: string;
      imageUrl?: string;
      published?: boolean;
      options?: Array<{
        attributeKey: string;
        value: string;
        valueId?: string;
      }>;
    } & VariantDiscountInput>;
  }) {
    try {
      logger.devLog('🆕 [ADMIN PRODUCTS CREATE SERVICE] Creating product:', data.title);

      const result = await db.$transaction(async (tx: PrismaTransactionClient) => {
        // Track used SKUs within this transaction to ensure uniqueness
        const usedSkus = new Set<string>();
        
        // Generate variants with options
        // Support both old format (color/size strings) and new format (AttributeValue IDs)
        // Also support generic options array for any attribute type
        const variantsData = await Promise.all(
          data.variants.map(async (variant: CreateProductVariantInput, variantIndex: number) => {
            const options: VariantOptionPayload[] = [];
            const attributesMap: Record<string, Array<{ valueId: string; value: string; attributeKey: string }>> = {};
            
            // If variant has explicit options array, use it (new format)
            if (variant.options && Array.isArray(variant.options) && variant.options.length > 0) {
              for (const opt of variant.options) {
                let valueId: string | null = null;
                let attributeKey: string | null = null;
                let value: string | null = null;

                if (opt.valueId) {
                  // New format: use valueId
                  valueId = opt.valueId;
                  // Fetch AttributeValue to get value and attributeKey
                  const attrValue = await tx.attributeValue.findUnique({
                    where: { id: opt.valueId },
                    include: { attribute: true },
                  });
                  if (attrValue) {
                    attributeKey = attrValue.attribute.key;
                    value = attrValue.value;
                  }
                  options.push({ valueId: opt.valueId });
                } else if (opt.attributeKey && opt.value) {
                  // Try to find or create AttributeValue
                  const foundValueId = await findOrCreateAttributeValue(opt.attributeKey, opt.value, data.locale);
                  if (foundValueId) {
                    valueId = foundValueId;
                    attributeKey = opt.attributeKey;
                    value = opt.value;
                    options.push({ valueId: foundValueId });
                  } else {
                    // Fallback to old format if AttributeValue not found
                    attributeKey = opt.attributeKey;
                    value = opt.value;
                    options.push({ attributeKey: opt.attributeKey, value: opt.value });
                  }
                }

                // Build attributes JSONB structure
                if (attributeKey && valueId && value) {
                  if (!attributesMap[attributeKey]) {
                    attributesMap[attributeKey] = [];
                  }
                  // Check if this valueId is already added for this attribute
                  if (!attributesMap[attributeKey].some(item => item.valueId === valueId)) {
                    attributesMap[attributeKey].push({
                      valueId,
                      value,
                      attributeKey,
                    });
                  }
                }
              }
            } else {
              // Old format: Try to find or create AttributeValues for color and size
              if (variant.color) {
                const colorValueId = await findOrCreateAttributeValue("color", variant.color, data.locale);
                if (colorValueId) {
                  options.push({ valueId: colorValueId });
                  if (!attributesMap["color"]) {
                    attributesMap["color"] = [];
                  }
                  attributesMap["color"].push({
                    valueId: colorValueId,
                    value: variant.color,
                    attributeKey: "color",
                  });
                } else {
                  // Fallback to old format if AttributeValue not found
                  options.push({ attributeKey: "color", value: variant.color });
                }
              }
              
              if (variant.size) {
                const sizeValueId = await findOrCreateAttributeValue("size", variant.size, data.locale);
                if (sizeValueId) {
                  options.push({ valueId: sizeValueId });
                  if (!attributesMap["size"]) {
                    attributesMap["size"] = [];
                  }
                  attributesMap["size"].push({
                    valueId: sizeValueId,
                    value: variant.size,
                    attributeKey: "size",
                  });
                } else {
                  // Fallback to old format if AttributeValue not found
                  options.push({ attributeKey: "size", value: variant.size });
                }
              }
            }

            const rawPrice = typeof variant.price === 'number' ? variant.price : parseFloat(String(variant.price));
            const price = Number.isNaN(rawPrice) ? 0 : rawPrice;
            const stock = typeof variant.stock === 'number' ? variant.stock : parseInt(String(variant.stock), 10);
            const discount = normalizeVariantDiscountForWrite(variant);

            // Generate unique SKU for this variant
            const uniqueSku = await this.resolveVariantSku(
              tx,
              variant.sku,
              variantIndex,
              usedSkus
            );

            // Convert attributesMap to JSONB format
            const attributesJson =
              Object.keys(attributesMap).length > 0 ? attributesMap : undefined;

            logger.devLog(`📦 [ADMIN PRODUCTS CREATE SERVICE] Variant ${variantIndex + 1} attributes:`, JSON.stringify(attributesJson ?? null, null, 2));

            // Process and validate variant imageUrl
            let processedVariantImageUrl: string | undefined = undefined;
            if (variant.imageUrl) {
              const urls = smartSplitUrls(variant.imageUrl);
              const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
              if (processedUrls.length > 0) {
                processedVariantImageUrl = await normalizeCommaSeparatedRasterDataUrls(
                  processedUrls.join(","),
                );
              }
            }

            return {
              sku: uniqueSku,
              productClass: resolveProductClass(variant.productClass ?? data.productClass),
              price,
              discountType: discount.discountType,
              discountValue: discount.discountValue,
              discountExpiresAt: discount.discountExpiresAt,
              stock: isNaN(stock) ? 0 : stock,
              imageUrl: processedVariantImageUrl,
              published: variant.published !== false,
              ...(attributesJson !== undefined ? { attributes: attributesJson } : {}),
              options: {
                create: options,
              },
            };
          })
        );

        // Final validation: log all SKUs to ensure uniqueness
        const allSkus = variantsData.map(v => v.sku).filter(Boolean);
        const uniqueSkus = new Set(allSkus);
        logger.devLog(`📋 [ADMIN PRODUCTS CREATE SERVICE] Generated ${variantsData.length} variants with SKUs:`, allSkus);
        
        if (allSkus.length !== uniqueSkus.size) {
          console.error('❌ [ADMIN PRODUCTS CREATE SERVICE] Duplicate SKUs detected!', {
            total: allSkus.length,
            unique: uniqueSkus.size,
            duplicates: allSkus.filter((sku, index) => allSkus.indexOf(sku) !== index)
          });
          throw new Error('Duplicate SKUs detected in variants. This should not happen.');
        }
        
        logger.devLog('✅ [ADMIN PRODUCTS CREATE SERVICE] All variant SKUs are unique');

        // Collect all variant images to exclude from main media
        const allVariantImages: string[] = [];
        variantsData.forEach((variant) => {
          if (variant.imageUrl) {
            const urls = smartSplitUrls(variant.imageUrl);
            allVariantImages.push(...urls);
          }
        });

        // Prepare media array — normalize inline rasters to WebP data URLs before persist / R2 paths
        let rawMedia = await normalizeProductMediaPayload(data.media || []);
        const mainProductImageNorm = data.mainProductImage
          ? await normalizeInboundRasterStringToWebpDataUrl(data.mainProductImage)
          : undefined;

        if (mainProductImageNorm && rawMedia.length === 0) {
          rawMedia = [mainProductImageNorm];
          logger.devLog(
            "📸 [ADMIN PRODUCTS CREATE SERVICE] Using mainProductImage as media:",
            `${mainProductImageNorm.substring(0, 50)}...`,
          );
        } else if (mainProductImageNorm && rawMedia.length > 0) {
          const mainImageIndex = rawMedia.findIndex((m) => {
            const url =
              typeof m === "string" ? m : (m.url ?? m.src ?? m.value);
            return url === mainProductImageNorm;
          });
          if (mainImageIndex === -1) {
            rawMedia = [mainProductImageNorm, ...rawMedia];
            logger.devLog("📸 [ADMIN PRODUCTS CREATE SERVICE] Added mainProductImage as first media item");
          } else if (mainImageIndex > 0) {
            const mainImage = rawMedia[mainImageIndex];
            rawMedia.splice(mainImageIndex, 1);
            rawMedia.unshift(mainImage);
            logger.devLog(
              "📸 [ADMIN PRODUCTS CREATE SERVICE] Moved mainProductImage to first position in media",
            );
          }
        }

        // Separate main images from variant images and clean them
        const { main } = separateMainAndVariantImages(rawMedia, allVariantImages);
        const finalMedia = cleanImageUrls(main);
        
        logger.devLog('📸 [ADMIN PRODUCTS CREATE SERVICE] Final main media count:', finalMedia.length);
        logger.devLog('📸 [ADMIN PRODUCTS CREATE SERVICE] Variant images excluded:', allVariantImages.length);

        const categoryLinks = await normalizeProductCategoryLinks(
          {
            primaryCategoryId: data.primaryCategoryId,
            categoryIds: data.categoryIds,
          },
          tx,
        );

        const product = await tx.product.create({
          data: {
            brandId: data.brandId || undefined,
            primaryCategoryId: categoryLinks.primaryCategoryId ?? undefined,
            categoryIds: categoryLinks.categoryIds,
            categories: toProductCategoriesConnect(categoryLinks.categoryIds),
            productClass: resolveProductClass(data.productClass),
            media: finalMedia,
            published: data.published,
            featured: data.featured ?? false,
            warrantyYears: normalizeProductWarrantyYears(data.warrantyYears),
            publishedAt: data.published ? new Date() : undefined,
            translations: {
              create: {
                locale: data.locale || "en",
                title: data.title,
                slug: data.slug,
                subtitle: isProductSubtitleHtmlEmpty(data.subtitle)
                  ? undefined
                  : sanitizeProductSubtitleHtml(data.subtitle ?? ''),
                description: data.description?.length
                  ? toPrismaProductDescription(filterProductDescriptionForSave(data.description))
                  : undefined,
              },
            },
            variants: {
              create: variantsData,
            },
            labels: data.labels && data.labels.length > 0
              ? {
                  create: data.labels.map((label) => ({
                    type: label.type,
                    value: label.value,
                    position: label.position,
                    color: label.color || undefined,
                  })),
                }
              : undefined,
          },
        });

        // Create ProductAttribute relations if attributeIds provided
        if (data.attributeIds && data.attributeIds.length > 0) {
          try {
            // Ensure table exists (for Vercel deployments where migrations might not run)
            await ensureProductAttributesTable();
            
            logger.devLog('🔗 [ADMIN PRODUCTS CREATE SERVICE] Creating ProductAttribute relations for product:', product.id, 'attributes:', data.attributeIds);
            await tx.productAttribute.createMany({
              data: data.attributeIds.map((attributeId) => ({
                productId: product.id,
                attributeId,
              })),
              skipDuplicates: true,
            });
            logger.devLog('✅ [ADMIN PRODUCTS CREATE SERVICE] Created ProductAttribute relations:', data.attributeIds);
          } catch (error: unknown) {
            console.error('❌ [ADMIN PRODUCTS CREATE SERVICE] Failed to create ProductAttribute relations:', error);
            console.error('   Product ID:', product.id);
            console.error('   Attribute IDs:', data.attributeIds);
            console.error('   Error code:', getPrismaErrorCode(error));
            console.error('   Error message:', getErrorMessage(error));
            // Re-throw to fail the transaction
            throw error;
          }
        }

        return await tx.product.findUnique({
          where: { id: product.id },
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
      });

      if (result?.id) {
        await syncProductListingReadModel(result.id);
      }

      // Revalidate cache
      try {
        logger.devLog('🧹 [ADMIN PRODUCTS CREATE SERVICE] Revalidating paths for new product');
        revalidatePath('/');
        revalidatePath('/products');
        // @ts-expect-error - revalidateTag type issue in Next.js
        revalidateTag('products');
        await cacheService.deletePattern("products:*");
        await cacheService.deletePattern("cache:products:*");
        await invalidateCategoryPublicCaches();
      } catch (e) {
        console.warn('⚠️ [ADMIN PRODUCTS CREATE SERVICE] Revalidation failed:', e);
      }

      return result;
    } catch (error: unknown) {
      console.error("❌ [ADMIN PRODUCTS CREATE SERVICE] createProduct error:", error);
      throw error;
    }
  }
}

export const adminProductsCreateService = new AdminProductsCreateService();





