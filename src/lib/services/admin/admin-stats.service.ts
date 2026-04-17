import { getStats } from "./admin-stats/stats-calculator";
import { getUserActivity } from "./admin-stats/user-activity";
import { getRecentOrders } from "./admin-stats/recent-orders";
import { getTopProducts } from "./admin-stats/top-products";
import { getActivity } from "./admin-stats/activity";
import { getAnalytics } from "./admin-stats/analytics";
import { getStockAnalytics } from "./admin-stats/stock-analytics";
import { getOrderStatusBreakdown } from "./admin-stats/order-status-breakdown";

/**
 * Service for admin statistics operations
 */
class AdminStatsService {
  /**
   * Get dashboard stats
   */
  async getStats() {
    return getStats();
  }

  /**
   * Get user activity (recent registrations and active users)
   */
  async getUserActivity(limit: number = 10) {
    return getUserActivity(limit);
  }

  /**
   * Get recent orders for dashboard
   */
  async getRecentOrders(limit: number = 5) {
    return getRecentOrders(limit);
  }

  /**
   * Get top products for dashboard
   */
  async getTopProducts(limit: number = 5) {
    return getTopProducts(limit);
  }

  /**
   * Get recent activity for dashboard
   */
  async getActivity(limit: number = 10) {
    return getActivity(limit);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period: string = 'week', startDate?: string, endDate?: string) {
    return getAnalytics(period, startDate, endDate);
  }

  /**
   * Low stock and out-of-stock variant lists (admin).
   */
  async getStockAnalytics(params: {
    locale: string;
    lowStockThreshold: number;
    limit: number;
    offset: number;
  }) {
    return getStockAnalytics(params);
  }

  /**
   * Order counts by status for today, last 7 days, last 30 days (createdAt window).
   */
  async getOrderStatusBreakdown() {
    return getOrderStatusBreakdown();
  }
}

export const adminStatsService = new AdminStatsService();
