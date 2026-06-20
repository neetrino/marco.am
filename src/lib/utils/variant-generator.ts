import { db } from "@white-shop/db";
import { logger } from "./logger";



/**
 * Find or create AttributeValue by attribute key and value string
 * @param attributeKey Attribute key (e.g., "color", "size")
 * @param valueString Value string (e.g., "Red", "Large")
 * @param locale Locale for creating translation if needed
 * @returns AttributeValue ID or null if not found
 */
export async function findOrCreateAttributeValue(
  attributeKey: string,
  valueString: string,
  locale: string = "en"
): Promise<string | null> {
  logger.debug('Finding/Creating AttributeValue', { attributeKey, valueString });

  // Find attribute by key
  const attribute = await db.attribute.findUnique({
    where: { key: attributeKey },
    include: {
      values: {
        where: {
          value: valueString,
        },
      },
    },
  });

  if (!attribute) {
    logger.warn('Attribute not found', { attributeKey });
    return null;
  }

  // If value exists, return its ID
  if (attribute.values.length > 0) {
    logger.debug('Found existing AttributeValue', { attributeValueId: attribute.values[0].id });
    return attribute.values[0].id;
  }

  // Create new AttributeValue
  const newValue = await db.attributeValue.create({
    data: {
      attributeId: attribute.id,
      value: valueString,
      translations: {
        create: {
          locale,
          label: valueString,
        },
      },
    },
  });

  logger.info('Created new AttributeValue', { attributeValueId: newValue.id });
  return newValue.id;
}
