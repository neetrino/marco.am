import {
  createAttribute,
  reorderAttributes,
  updateAttributeTranslation,
} from "./admin-attributes-write/attribute-operations";
import {
  addAttributeValue,
  reorderAttributeValues,
  updateAttributeValue,
} from "./admin-attributes-write/value-operations";
import {
  syncProductsReadModelByAttributeIdAndFacetCounts,
  syncProductsReadModelByAttributeValueIdAndFacetCounts,
} from "@/lib/read-model/product-read-model-sync";

/**
 * Service for admin attribute write operations
 */
class AdminAttributesWriteService {
  /**
   * Create attribute
   */
  async createAttribute(data: {
    name: string;
    key: string;
    type?: string;
    filterable?: boolean;
    locale?: string;
  }) {
    return createAttribute(data);
  }

  /**
   * Update attribute translation (name)
   */
  async updateAttributeTranslation(
    attributeId: string,
    data: {
      name: string;
      locale?: string;
    }
  ) {
    const result = await updateAttributeTranslation(attributeId, data);
    await syncProductsReadModelByAttributeIdAndFacetCounts(attributeId);
    return result;
  }

  /**
   * Add attribute value
   */
  async addAttributeValue(
    attributeId: string,
    data: { label: string; locale?: string }
  ) {
    return addAttributeValue(attributeId, data);
  }

  /**
   * Update attribute value
   */
  async updateAttributeValue(
    attributeId: string,
    valueId: string,
    data: {
      label?: string;
      colors?: string[];
      imageUrl?: string | null;
      locale?: string;
    }
  ) {
    const result = await updateAttributeValue(attributeId, valueId, data);
    await syncProductsReadModelByAttributeValueIdAndFacetCounts(valueId);
    return result;
  }

  async reorderAttributes(data: { attributeId: string; targetAttributeId: string }) {
    return reorderAttributes(data);
  }

  async reorderAttributeValues(data: {
    attributeId: string;
    valueId: string;
    targetValueId: string;
  }) {
    return reorderAttributeValues(data);
  }
}

export const adminAttributesWriteService = new AdminAttributesWriteService();
