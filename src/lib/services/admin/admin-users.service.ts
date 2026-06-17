import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { bumpAuthEpoch } from "@/lib/auth/auth-epoch";
import { sanitizeUserRoles } from "@/lib/constants/user-roles";
import type {
  AdminUserListItem,
  AdminUsersListFilters,
  AdminUsersListResult,
} from "./admin-users.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildUsersWhereClause(filters: AdminUsersListFilters): Prisma.UserWhereInput {
  const search = filters.search?.trim();
  const role = filters.role?.trim();

  const and: Prisma.UserWhereInput[] = [{ deletedAt: null }];

  if (role === "admin" || role === "customer") {
    and.push({ roles: { has: role } });
  }

  if (search) {
    and.push({
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  return { AND: and };
}

function mapUserRow(user: {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  blocked: boolean;
  createdAt: Date;
  _count: { orders: number };
}): AdminUserListItem {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    blocked: user.blocked,
    createdAt: user.createdAt.toISOString(),
    ordersCount: user._count.orders,
  };
}

class AdminUsersService {
  async getUsers(filters: AdminUsersListFilters = {}): Promise<AdminUsersListResult> {
    const page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, filters.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const where = buildUsersWhereClause(filters);

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
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
            select: { orders: true },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      data: users.map(mapUserRow),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

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
