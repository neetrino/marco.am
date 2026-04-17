/**
 * Order filters interface
 */
export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Update order data interface
 */
export interface UpdateOrderData {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
}

/**
 * Optional context when an admin updates an order (audit trail).
 */
export interface UpdateOrderContext {
  actorUserId?: string;
}




