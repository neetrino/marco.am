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




