import { apiClient } from "@/lib/api-client";
import {
  customerOrderReorderPath,
  type CustomerOrderLinks,
} from "@/lib/constants/customer-order-api-paths";

/** Response body from `POST /api/v1/orders/{number}/reorder` (see `prefillCartFromOrder`). */
type CustomerReorderResponse = {
  orderNumber: string;
  added: Array<{
    variantId: string;
    productId: string;
    quantity: number;
  }>;
  skipped: Array<{
    variantId: string | null;
    sku: string;
    reason: string;
  }>;
  cart: unknown;
};

/**
 * Merges a past order's lines into the signed-in user's cart using server rules
 * (published, stock, merge with existing cart).
 */
export async function postCustomerReorder(
  orderNumber: string,
  links?: CustomerOrderLinks | null
): Promise<CustomerReorderResponse> {
  const href = links?.reorder?.href ?? customerOrderReorderPath(orderNumber);
  return apiClient.post<CustomerReorderResponse>(href);
}
