import { db } from "@white-shop/db";
import { logger } from "../../../utils/logger";
import { formatAttribute } from "./utils";

/**
 * Create attribute
 */
export async function createAttribute(data: {
  name: string;
  key: string;
  type?: string;
  filterable?: boolean;
  locale?: string;
}) {
  logger.info('Creating attribute', { key: data.key });

  // Check if attribute with this key already exists
  const existing = await db.attribute.findUnique({
    where: { key: data.key },
  });

  if (existing) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Attribute already exists",
      detail: `Attribute with key '${data.key}' already exists`,
    };
  }

  const locale = data.locale || "en";

  const attribute = await db.attribute.create({
    data: {
      key: data.key,
      type: data.type || "select",
      filterable: data.filterable !== false,
      translations: {
        create: {
          locale,
          name: data.name,
        },
      },
    },
    include: {
      translations: {
        where: { locale },
      },
      values: {
        include: {
          translations: {
            where: { locale },
          },
        },
      },
    },
  });

  return formatAttribute(attribute, locale);
}

/**
 * Update attribute translation (name)
 */
export async function updateAttributeTranslation(
  attributeId: string,
  data: {
    name: string;
    locale?: string;
  }
) {
  logger.info('Updating attribute translation', { attributeId, name: data.name });

  const attribute = await db.attribute.findUnique({
    where: { id: attributeId },
    include: {
      translations: {
        where: { locale: data.locale || "en" },
      },
    },
  });

  if (!attribute) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Attribute not found",
      detail: `Attribute with id '${attributeId}' does not exist`,
    };
  }

  const locale = data.locale || "en";

  // Use upsert to handle both create and update cases
  await db.attributeTranslation.upsert({
    where: {
      attributeId_locale: {
        attributeId,
        locale,
      },
    },
    update: {
      name: data.name.trim(),
    },
    create: {
      attributeId,
      locale,
      name: data.name.trim(),
    },
  });

  // Return updated attribute with all values
  const updatedAttribute = await db.attribute.findUnique({
    where: { id: attributeId },
    include: {
      translations: {
        where: { locale },
      },
      values: {
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!updatedAttribute) {
    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: "Failed to retrieve updated attribute",
    };
  }

  return formatAttribute(updatedAttribute, locale);
}

/**
 * Reorder attributes within the global attributes list.
 */
export async function reorderAttributes(data: {
  attributeId: string;
  targetAttributeId: string;
}) {
  const attributeId = data.attributeId.trim();
  const targetAttributeId = data.targetAttributeId.trim();
  if (!attributeId || !targetAttributeId) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/bad-request",
      title: "Invalid reorder request",
      detail: "attributeId and targetAttributeId are required",
    };
  }

  const orderedIds = (
    await db.attribute.findMany({
      select: { id: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    })
  ).map((item) => item.id);

  const sourceIndex = orderedIds.findIndex((id) => id === attributeId);
  const targetIndex = orderedIds.findIndex((id) => id === targetAttributeId);
  if (sourceIndex < 0 || targetIndex < 0) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Attribute not found",
      detail: "Attribute or target attribute does not exist",
    };
  }

  if (sourceIndex === targetIndex) {
    return { success: true, moved: false };
  }

  const [movingId] = orderedIds.splice(sourceIndex, 1);
  orderedIds.splice(targetIndex, 0, movingId);

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.attribute.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return { success: true, moved: true };
}




