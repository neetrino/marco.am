import { getErrorMessage } from "@/lib/types/errors";
import { db } from "@white-shop/db";
import { bumpAuthEpoch } from "@/lib/auth/auth-epoch";
import { buildCustomerOrderLinks } from "../constants/customer-order-api-paths";
import * as bcrypt from "bcryptjs";
import type { UpdateProfileRequest } from "@/lib/schemas/user-profile.schema";
import { applyUserProfileUpdate } from "@/lib/services/user-profile-update";
import { logger } from "@/lib/utils/logger";

class UsersService {
  private async getOrdersByStatus(userId: string): Promise<Record<string, number>> {
    const grouped = await db.order.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    });

    const out: Record<string, number> = {};
    grouped.forEach((row) => {
      out[row.status] = row._count._all;
    });
    return out;
  }

  private async getTotalSpentForDashboard(userId: string): Promise<number> {
    const paidCompleted = await db.order.aggregate({
      where: {
        userId,
        OR: [{ status: "completed" }, { paymentStatus: "paid" }],
      },
      _sum: { total: true },
    });
    return paidCompleted._sum.total ?? 0;
  }

  private async getRecentOrdersWithItemCounts(userId: string) {
    const recentOrders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        subtotal: true,
        discountAmount: true,
        shippingAmount: true,
        taxAmount: true,
        currency: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return recentOrders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      currency: order.currency,
      itemsCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
      links: buildCustomerOrderLinks(order.number),
    }));
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        phoneVerified: true,
        locale: true,
        roles: true,
        addresses: true,
      },
    });

    if (!user) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
      };
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      locale: user.locale,
      roles: user.roles,
      addresses: user.addresses,
    };
  }

  /**
   * Update user profile (name, contact, locale). Returns same shape as {@link getProfile}.
   */
  async updateProfile(userId: string, data: UpdateProfileRequest) {
    await applyUserProfileUpdate(userId, data);
    return this.getProfile(userId);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Validate input parameters
    if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.trim() === '') {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Old password is required and must be a non-empty string",
      };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "New password is required and must be a non-empty string",
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid credentials",
        detail: "User not found or password not set",
      };
    }

    // Validate that passwordHash is a valid string
    if (typeof user.passwordHash !== 'string' || user.passwordHash.trim() === '') {
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "User password hash is invalid",
      };
    }

    let isValid: boolean;
    try {
      isValid = await bcrypt.compare(oldPassword.trim(), user.passwordHash);
    } catch (compareError: unknown) {
      logger.error("UsersService changePassword: bcrypt.compare failed", {
        message: getErrorMessage(compareError),
        userId,
        hasOldPassword: !!oldPassword,
        hasPasswordHash: !!user.passwordHash,
      });
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to verify password",
      };
    }

    if (!isValid) {
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid password",
        detail: "The old password is incorrect",
      };
    }

    try {
      const newPasswordHash = await bcrypt.hash(newPassword.trim(), 10);
      await db.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
        select: { id: true },
      });
      await bumpAuthEpoch(userId);

      return { success: true };
    } catch (hashError: unknown) {
      logger.error("UsersService changePassword: bcrypt.hash failed", {
        message: getErrorMessage(hashError),
        userId,
      });
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to hash new password",
      };
    }
  }

  /**
   * Get user dashboard statistics
   */
  async getDashboard(userId: string) {
    const [totalOrders, ordersByStatus, totalSpent, addressesCount, recentOrders] =
      await Promise.all([
        db.order.count({ where: { userId } }),
        this.getOrdersByStatus(userId),
        this.getTotalSpentForDashboard(userId),
        db.address.count({ where: { userId } }),
        this.getRecentOrdersWithItemCounts(userId),
      ]);

    const pendingOrders = ordersByStatus.pending ?? 0;
    const completedOrders = ordersByStatus.completed ?? 0;

    return {
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent,
        addressesCount,
        ordersByStatus,
      },
      recentOrders,
    };
  }

  /**
   * Soft-delete the authenticated user's account (same semantics as admin user delete).
   */
  async deleteAccount(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
      };
    }

    if (user.deletedAt) {
      throw {
        status: 410,
        type: "https://api.shop.am/problems/gone",
        title: "Account already deleted",
        detail: "This account has already been removed",
      };
    }

    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        blocked: true,
      },
      select: { id: true },
    });

    return { success: true as const };
  }
}

export const usersService = new UsersService();

