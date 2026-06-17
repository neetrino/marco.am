export type AdminUsersListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
};

export type AdminUserListItem = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  blocked: boolean;
  createdAt: string;
  ordersCount: number;
};

export type AdminUsersListResult = {
  data: AdminUserListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
