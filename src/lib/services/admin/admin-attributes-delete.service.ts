import { db } from "@white-shop/db";
import { thrown } from "@/lib/types/catch-utils";
import { getErrorMessage, getPrismaErrorCode } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

class AdminAttributesDeleteService {
  /**
   * Delete attribute
   */
  async deleteAttribute(attributeId: string) {
    try {
      logger.devLog('🗑️ [ADMIN ATTRIBUTES DELETE SERVICE] Սկսվում է attribute-ի հեռացում:', {
        attributeId,
        timestamp: new Date().toISOString(),
      });

      // Ստուգում ենք, արդյոք attribute-ը գոյություն ունի
      logger.devLog('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է attribute-ի գոյությունը...');
      const attribute = await db.attribute.findUnique({
        where: { id: attributeId },
        select: {
          id: true,
          key: true,
        },
      });

      if (!attribute) {
        logger.devLog('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը չի գտնվել:', attributeId);
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute not found",
          detail: `Attribute with id '${attributeId}' does not exist`,
        };
      }

      logger.devLog('✅ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը գտնվել է:', {
        id: attribute.id,
        key: attribute.key,
      });

      // Ստուգում ենք, արդյոք attribute-ը օգտագործվում է արտադրանքներում
      logger.devLog('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է, արդյոք attribute-ը օգտագործվում է արտադրանքներում...');
      
      let productAttributesCount = 0;
      
      // Ստուգում ենք, արդյոք db.productAttribute գոյություն ունի
      if (db.productAttribute) {
        try {
          productAttributesCount = await db.productAttribute.count({
            where: { attributeId },
          });
          logger.devLog('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes count:', productAttributesCount);
        } catch (countError: unknown) {
          console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes count սխալ:', {
            error: countError,
            message: getErrorMessage(countError),
            code: getPrismaErrorCode(countError),
          });
          // Եթե count-ը չի աշխատում, փորձում ենք findMany-ով
          try {
            const productAttributes = await db.productAttribute.findMany({
              where: { attributeId },
              select: { id: true },
            });
            productAttributesCount = productAttributes.length;
            logger.devLog('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes count (via findMany):', productAttributesCount);
          } catch (_findError: unknown) {
            console.warn('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes findMany-ը նույնպես չի աշխատում, skip անում ենք ստուգումը');
            productAttributesCount = 0;
          }
        }
      } else {
        console.warn('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] db.productAttribute-ը undefined է, skip անում ենք product attributes ստուգումը');
      }

      if (productAttributesCount > 0) {
        logger.devLog('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը օգտագործվում է արտադրանքներում:', productAttributesCount);
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cannot delete attribute",
          detail: `Attribute is used in ${productAttributesCount} product(s). Please remove it from products first.`,
        };
      }

      // Ստուգում ենք, արդյոք attribute values-ները օգտագործվում են variants-ներում
      logger.devLog('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է, արդյոք attribute values-ները օգտագործվում են variants-ներում...');
      const attributeValues = await db.attributeValue.findMany({
        where: { attributeId },
        select: { id: true },
      });

      logger.devLog('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Attribute values count:', attributeValues.length);

      if (attributeValues.length > 0) {
        const valueIds = attributeValues.map((v: { id: string }) => v.id);
        logger.devLog('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է variant options...');
        
        let variantOptionsCount = 0;
        try {
          variantOptionsCount = await db.productVariantOption.count({
            where: {
              valueId: { in: valueIds },
            },
          });
          logger.devLog('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Variant options count:', variantOptionsCount);
        } catch (countError: unknown) {
          console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Variant options count սխալ:', {
            error: countError,
            message: getErrorMessage(countError),
            code: getPrismaErrorCode(countError),
          });
          // Եթե count-ը չի աշխատում, փորձում ենք findMany-ով
          const variantOptions = await db.productVariantOption.findMany({
            where: {
              valueId: { in: valueIds },
            },
            select: { id: true },
          });
          variantOptionsCount = variantOptions.length;
          logger.devLog('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Variant options count (via findMany):', variantOptionsCount);
        }

        if (variantOptionsCount > 0) {
          logger.devLog('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute values-ները օգտագործվում են variants-ներում:', variantOptionsCount);
          throw {
            status: 400,
            type: "https://api.shop.am/problems/validation-error",
            title: "Cannot delete attribute",
            detail: `Some attribute values are used in ${variantOptionsCount} variant(s). Please remove them from variants first.`,
          };
        }
      }

      // Հեռացնում ենք attribute-ը (values-ները կհեռացվեն cascade-ով)
      logger.devLog('🗑️ [ADMIN ATTRIBUTES DELETE SERVICE] Հեռացվում է attribute-ը...');
      await db.attribute.delete({
        where: { id: attributeId },
      });

      logger.devLog('✅ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը հաջողությամբ հեռացվել է:', {
        attributeId,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true };
    } catch (error: unknown) {
      const loose = thrown(error);
      // Եթե սա մեր ստեղծած սխալ է, ապա վերադարձնում ենք այն
      if (loose.status && loose.type) {
        console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Ստանդարտ սխալ:', {
          status: loose.status,
          type: loose.type,
          title: loose.title,
          detail: loose.detail,
        });
        throw error;
      }

      // Մանրամասն լոգավորում
      console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute հեռացման սխալ:', {
        attributeId,
        error: {
          name: loose.name,
          message: loose.message,
          code: loose.code,
          meta: loose.meta,
          stack: typeof loose.stack === 'string' ? loose.stack.substring(0, 1000) : undefined,
        },
        timestamp: new Date().toISOString(),
      });

      // Prisma սխալների մշակում
      if (getPrismaErrorCode(error) === 'P2025') {
        logger.devLog('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Prisma P2025: Գրառումը չի գտնվել');
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute not found",
          detail: `Attribute with id '${attributeId}' does not exist`,
        };
      }

      // Գեներիկ սխալ
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: getErrorMessage(error) || "Failed to delete attribute",
      };
    }
  }

  /**
   * Delete attribute value
   */
  async deleteAttributeValue(attributeValueId: string) {
    try {
      logger.devLog('🗑️ [ADMIN ATTRIBUTES DELETE SERVICE] Deleting attribute value:', attributeValueId);

      // First check if attribute value exists
      const attributeValue = await db.attributeValue.findUnique({
        where: { id: attributeValueId },
        select: {
          id: true,
          attributeId: true,
        },
      });

      if (!attributeValue) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute value not found",
          detail: `Attribute value with id '${attributeValueId}' does not exist`,
        };
      }

      // Check if value is used in any variants
      const variantOptionsCount = await db.productVariantOption.count({
        where: {
          valueId: attributeValueId,
        },
      });

      if (variantOptionsCount > 0) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cannot delete attribute value",
          detail: `Attribute value is used in ${variantOptionsCount} variant(s). Please remove it from variants first.`,
        };
      }

      // Delete attribute value
      await db.attributeValue.delete({
        where: { id: attributeValueId },
      });

      // Return updated attribute
      const attribute = await db.attribute.findUnique({
        where: { id: attributeValue.attributeId },
        include: {
          translations: {
            where: { locale: "en" },
            take: 1,
          },
          values: {
            include: {
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!attribute) {
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Internal Server Error",
          detail: "Failed to retrieve updated attribute",
        };
      }

      const translation = attribute.translations[0];
      const values = attribute.values || [];

      return {
        id: attribute.id,
        key: attribute.key,
        name: translation?.name || attribute.key,
        type: attribute.type,
        filterable: attribute.filterable,
        values: values.map((val: (typeof values)[number]) => {
          const valTranslation = val.translations?.[0];
          return {
            id: val.id,
            value: val.value,
            label: valTranslation?.label || val.value,
          };
        }),
      };
    } catch (error: unknown) {
      console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Error deleting attribute value:', error);
      if (thrown(error).status) {
        throw error;
      }
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: getErrorMessage(error) || "Failed to delete attribute value",
      };
    }
  }
}

export const adminAttributesDeleteService = new AdminAttributesDeleteService();






