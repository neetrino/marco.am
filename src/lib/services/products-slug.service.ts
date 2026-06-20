import { getProductPdpFromReadModel } from "@/lib/read-model/products-pdp-read-model";
import { buildProductQuery } from "./products-slug/product-query-builder";
import { transformProduct } from "./products-slug/product-transformer";

/**
 * Service for fetching products by slug
 */
class ProductsSlugService {
  /**
   * Get product by slug.
   * Hot path: single indexed fetch from the PDP read-model. Falls back to the
   * operational query (deep include) only on a read-model miss.
   */
  async findBySlug(slug: string, lang: string = "en") {
    const fromReadModel = await getProductPdpFromReadModel(slug, lang);
    if (fromReadModel) {
      return fromReadModel;
    }

    const product = await buildProductQuery(slug, lang);

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with slug '${slug}' does not exist or is not published`,
      };
    }

    // Transform product data to response format
    return transformProduct(product, lang);
  }
}

export const productsSlugService = new ProductsSlugService();
