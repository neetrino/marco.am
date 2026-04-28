import { getErrorMessage } from "@/lib/types/errors";
import { db } from "@white-shop/db";
import { buildCustomerOrderLinks } from "../constants/customer-order-api-paths";
import * as bcrypt from "bcryptjs";
import type { UpdateProfileRequest } from "@/lib/schemas/user-profile.schema";
import { applyUserProfileUpdate } from "@/lib/services/user-profile-update";
import { logger } from "@/lib/utils/logger";

class UsersService {
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
    // Get all orders for the user
    const orders = await db.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: { status: string }) => o.status === "pending").length;
    const completedOrders = orders.filter((o: { status: string }) => o.status === "completed").length;
    const totalSpent = orders
      .filter((o: { status: string; paymentStatus: string }) => o.status === "completed" || o.paymentStatus === "paid")
      .reduce((sum: number, o: { total: number }) => sum + o.total, 0);

    // Count addresses
    const addressesCount = await db.address.count({
      where: { userId },
    });

    // Count orders by status
    const ordersByStatus: Record<string, number> = {};
    orders.forEach((order: { status: string }) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map((order: { id: string; number: string; status: string; paymentStatus: string; fulfillmentStatus: string; total: number; subtotal: number; discountAmount: number; shippingAmount: number; taxAmount: number; currency: string | null; createdAt: Date; items: Array<unknown> }) => ({
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
      itemsCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
      links: buildCustomerOrderLinks(order.number),
    }));

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

