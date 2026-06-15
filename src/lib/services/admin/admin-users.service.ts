import { db } from "@white-shop/db";
import { bumpAuthEpoch } from "@/lib/auth/auth-epoch";
import { sanitizeUserRoles } from "@/lib/constants/user-roles";

class AdminUsersService {
  /**
   * Get users
   */
  async getUsers(_filters: Record<string, unknown>) {
    const users = await db.user.findMany({
      where: {
        deletedAt: null,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return {
      data: users.map((user: { id: string; email: string | null; phone: string | null; firstName: string | null; lastName: string | null; roles: string[] | null; blocked: boolean; createdAt: Date; _count?: { orders?: number } }) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        blocked: user.blocked,
        createdAt: user.createdAt,
        ordersCount: user._count?.orders ?? 0,
      })),
    };
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: { blocked?: boolean; roles?: string[] }) {
    const roles = data.roles !== undefined ? sanitizeUserRoles(data.roles) : undefined;

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        blocked: data.blocked,
        roles,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await bumpAuthEpoch(userId);
    return updated;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
        detail: `User with id '${userId}' does not exist`,
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

    await bumpAuthEpoch(userId);
    return { success: true };
  }
}

export const adminUsersService = new AdminUsersService();
