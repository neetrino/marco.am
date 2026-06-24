/** Throws a structured 404 for missing admin product records. */
export function createProductNotFoundError(productId: string): never {
  throw {
    status: 404,
    type: "https://api.shop.am/problems/not-found",
    title: "Product not found",
    detail: `Product with id '${productId}' does not exist`,
  };
}
