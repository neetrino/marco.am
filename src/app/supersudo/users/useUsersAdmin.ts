'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import {
  buildAdminUsersListApiParams,
  buildAdminUsersListCacheKey,
  buildUsersDefaultListCacheKey,
} from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

export interface AdminUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  blocked: boolean;
  ordersCount?: number;
  createdAt: string;
}

export interface UsersListResponse {
  data: AdminUserRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type RoleFilter = 'all' | 'admin' | 'customer';

function buildListInput(page: number, search: string, roleFilter: RoleFilter) {
  return {
    page,
    search,
    role: roleFilter === 'all' ? '' : roleFilter,
  };
}

export function useUsersAdmin() {
  const defaultCacheKey = buildUsersDefaultListCacheKey();
  const cachedDefault = readAdminSessionCache<UsersListResponse>(
    defaultCacheKey,
    ADMIN_SESSION_CACHE_TTL_MS,
  );

  const hadCacheRef = useRef(cachedDefault !== null);
  const [users, setUsers] = useState<AdminUserRow[]>(cachedDefault?.data ?? []);
  const [loading, setLoading] = useState(cachedDefault === null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UsersListResponse['meta'] | null>(cachedDefault?.meta ?? null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const fetchUsers = useCallback(async (options?: { force?: boolean }) => {
    const listInput = buildListInput(page, appliedSearch, roleFilter);
    const cacheKey = buildAdminUsersListCacheKey(listInput);
    const cached = readAdminSessionCache<UsersListResponse>(cacheKey, ADMIN_SESSION_CACHE_TTL_MS);

    if (!options?.force && cached !== null) {
      setUsers(cached.data ?? []);
      setMeta(cached.meta ?? null);
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<UsersListResponse>('/api/v1/supersudo/users', {
          params: buildAdminUsersListApiParams(listInput),
        }),
      );
      setUsers(response.data ?? []);
      setMeta(response.meta ?? null);
      writeAdminSessionCache(cacheKey, response);
      hadCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Admin users list fetch failed', { error: err });
      if (!hadCacheRef.current) {
        setUsers([]);
        setMeta(null);
      }
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const submitSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setRoleFilter('all');
    setPage(1);
  };

  const setRoleFilterAndResetPage = (nextRole: RoleFilter) => {
    setRoleFilter(nextRole);
    setPage(1);
  };

  return {
    users,
    loading,
    searchInput,
    setSearchInput,
    appliedSearch,
    page,
    setPage,
    meta,
    roleFilter,
    setRoleFilter: setRoleFilterAndResetPage,
    fetchUsers,
    submitSearch,
    clearFilters,
  };
}
