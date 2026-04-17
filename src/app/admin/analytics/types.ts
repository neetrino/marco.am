export interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  orders: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
  topProducts: Array<{
    productId: string;
    title: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    image?: string | null;
  }>;
  leastSellingProducts: Array<{
    productId: string;
    title: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    image?: string | null;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  ordersByDay: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
  customerAnalytics: {
    newVsRepeat: {
      newCustomers: number;
      repeatCustomers: number;
      ordersFromNewCustomers: number;
      ordersFromRepeatCustomers: number;
      ordersUnattributed: number;
    };
    topCustomersBySpend: Array<{
      identityType: "user" | "email";
      userId: string | null;
      email: string | null;
      displayName: string;
      totalSpend: number;
      orderCount: number;
      currency: string;
    }>;
  };
}

export interface AdminStatsSummary {
  users?: {
    total?: number;
  };
}

export interface OrderStatusBreakdownData {
  windows: Array<{
    period: "today" | "week" | "month";
    dateRange: { start: string; end: string };
    byStatus: {
      pending: number;
      processing: number;
      completed: number;
      cancelled: number;
      other: number;
    };
    totalOrders: number;
  }>;
}

/** GET /api/v1/admin/analytics/stock */
export interface StockAnalyticsVariantRow {
  variantId: string;
  productId: string;
  sku: string | null;
  stock: number;
  stockReserved: number;
  productTitle: string;
  productSlug: string;
  brandName: string | null;
  imageUrl: string | null;
  updatedAt: string;
}

export interface StockAnalyticsData {
  locale: string;
  lowStockThreshold: number;
  outOfStock: {
    total: number;
    items: StockAnalyticsVariantRow[];
  };
  lowStock: {
    total: number;
    items: StockAnalyticsVariantRow[];
  };
}




