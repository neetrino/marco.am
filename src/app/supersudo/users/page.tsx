'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button, Input } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { showPopupConfirm } from '@/components/popup-service';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminTablePagination } from '../components/AdminTablePagination';
import { logger } from "@/lib/utils/logger";

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  roles: string[];
  blocked: boolean;
  ordersCount?: number;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/users';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UsersResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      logger.devLog('👥 [ADMIN] Fetching users...', { page, search, roleFilter });
      
      const response = await apiClient.get<UsersResponse>('/api/v1/supersudo/users', {
        params: {
          page: page.toString(),
          limit: '20',
          search: search || '',
          role: roleFilter === 'all' ? '' : roleFilter,
        },
      });

      logger.devLog('✅ [ADMIN] Users fetched:', response);
      setUsers(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchUsers();
    }
     
  }, [isLoggedIn, isAdmin, page, search, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    // Ընտրում ենք միայն այն օգտատերերին, որոնք տեսանելի են ընթացիկ ֆիլտրով
    const visibleUsers =
      roleFilter === 'all'
        ? users
        : users.filter((u) =>
            roleFilter === 'admin'
              ? u.roles?.includes('admin')
              : u.roles?.includes('customer')
          );

    if (visibleUsers.length === 0) return;

    setSelectedIds((prev) => {
      const allIds = visibleUsers.map((u) => u.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!(await showPopupConfirm(t('admin.users.deleteConfirm').replace('{count}', selectedIds.size.toString())))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map(id => apiClient.delete(`/api/v1/supersudo/users/${id}`))
      );
      const failed = results.filter(r => r.status === 'rejected');
      setSelectedIds(new Set());
      await fetchUsers();
      alert(t('admin.users.bulkDeleteFinished').replace('{success}', (ids.length - failed.length).toString()).replace('{total}', ids.length.toString()));
    } catch (err) {
      console.error('❌ [ADMIN] Bulk delete users error:', err);
      alert(t('admin.users.failedToDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleBlocked = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      const newStatus = !currentStatus;
      await apiClient.put(`/api/v1/supersudo/users/${userId}`, {
        blocked: newStatus,
      });
      
      logger.devLog(`✅ [ADMIN] User ${newStatus ? 'blocked' : 'unblocked'} successfully`);
      
      // Refresh users list
      fetchUsers();
      
      if (newStatus) {
        alert(t('admin.users.userBlocked').replace('{name}', userName));
      } else {
        alert(t('admin.users.userActive').replace('{name}', userName));
      }
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error updating user status:', err);
      alert(t('admin.users.errorUpdatingStatus').replace('{message}', getApiOrErrorMessage(err, t('admin.common.unknownErrorFallback'))));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  // Տեսանելի օգտատերերի filter Admin / Customer ֆիլտրով
  const filteredUsers =
    roleFilter === 'all'
      ? users
      : users.filter((user) =>
          roleFilter === 'admin'
            ? user.roles?.includes('admin')
            : user.roles?.includes('customer')
        );

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.users.title')}
      backLabel={t('admin.users.backToAdmin')}
      onBack={() => router.push('/supersudo')}
      headerActions={
        (search || roleFilter !== 'all') ? (
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            {t('admin.products.clearAll')}
          </button>
        ) : undefined
      }
    >
            <Card className="mb-5 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/60 sm:p-5">
              <form onSubmit={handleSearch} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('admin.users.search')}
                    </label>
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('admin.users.searchPlaceholder')}
                    className="admin-field border-slate-300/90 bg-slate-50/70 transition-all focus:border-slate-800"
                  />
                  </div>
                  <Button type="submit" variant="primary">
                    {t('admin.users.search')}
                  </Button>
                </div>

                {/* Admin / Customer filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('admin.users.adminCustomer')}
                  </span>
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/80 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleFilter('all');
                        setPage(1);
                        logger.devLog('👥 [ADMIN] Role filter changed to: all');
                      }}
                      className={`px-3 py-1 rounded-full transition-all ${
                        roleFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t('admin.users.all')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleFilter('admin');
                        setPage(1);
                        logger.devLog('👥 [ADMIN] Role filter changed to: admin');
                      }}
                      className={`px-3 py-1 rounded-full transition-all ${
                        roleFilter === 'admin'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t('admin.users.admins')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleFilter('customer');
                        setPage(1);
                        logger.devLog('👥 [ADMIN] Role filter changed to: customer');
                      }}
                      className={`px-3 py-1 rounded-full transition-all ${
                        roleFilter === 'customer'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t('admin.users.customers')}
                    </button>
                  </div>
                </div>
              </form>
            </Card>

            <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
              selectedIds.size > 0
                ? 'border-amber-200/80 bg-amber-50/80'
                : 'border-slate-200 bg-slate-50/70'
            }`}>
              <div className={`text-sm font-medium ${selectedIds.size > 0 ? 'text-amber-900' : 'text-slate-600'}`}>
                {t('admin.users.selectedUsers').replace('{count}', selectedIds.size.toString())}
              </div>
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className={`${
                  selectedIds.size > 0
                    ? 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {bulkDeleting ? t('admin.users.deleting') : t('admin.users.deleteSelected')}
              </Button>
            </div>

            {/* Users Table */}
            <Card className="admin-table-card overflow-hidden rounded-2xl border-slate-200/80 shadow-md shadow-slate-200/60">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-slate-600">{t('admin.users.loadingUsers')}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600">{t('admin.users.noUsers')}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/85">
                        <tr>
                          <th className="px-4 py-3">
                            <input
                              type="checkbox"
                              aria-label={t('admin.users.selectAll')}
                              checked={users.length > 0 && users.every(u => selectedIds.has(u.id))}
                              onChange={toggleSelectAll}
                              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.users.user')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.users.contact')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.users.orders')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.users.roles')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.users.status')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.users.created')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="group transition-colors hover:bg-amber-50/50">
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                aria-label={t('admin.users.selectUser').replace('{email}', user.email)}
                                checked={selectedIds.has(user.id)}
                                onChange={() => toggleSelect(user.id)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-amber-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-xs text-slate-500">{user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">{user.email}</div>
                              {user.phone && (
                                <div className="text-sm text-slate-500">{user.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-700">
                                {user.ordersCount ?? 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                {user.roles?.map((role) => (
                                  <span
                                    key={role}
                                    className="rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-700"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleBlocked(
                                    user.id,
                                    user.blocked,
                                    `${user.firstName} ${user.lastName}`,
                                  )
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  user.blocked
                                    ? 'bg-slate-300 focus:ring-slate-400'
                                    : 'bg-emerald-500 focus:ring-emerald-500'
                                }`}
                                title={user.blocked ? t('admin.users.clickToActivate') : t('admin.users.clickToBlock')}
                                role="switch"
                                aria-checked={!user.blocked}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                    user.blocked ? 'translate-x-1' : 'translate-x-6'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {new Date(user.createdAt).toLocaleDateString('hy-AM')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {meta && (
                    <AdminTablePagination
                      embedded
                      currentPage={page}
                      totalPages={meta.totalPages}
                      totalItems={meta.total}
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </Card>
    </AdminPageLayout>
  );
}

