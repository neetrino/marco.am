'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import {
  buildAdminMessagesListApiParams,
  buildAdminMessagesListCacheKey,
  buildMessagesDefaultListCacheKey,
} from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

export interface AdminMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface MessagesListResponse {
  data: AdminMessageRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useMessagesAdmin() {
  const defaultCacheKey = buildMessagesDefaultListCacheKey();
  const cachedDefault = readAdminSessionCache<MessagesListResponse>(
    defaultCacheKey,
    ADMIN_SESSION_CACHE_TTL_MS,
  );

  const hadCacheRef = useRef(cachedDefault !== null);
  const [messages, setMessages] = useState<AdminMessageRow[]>(cachedDefault?.data ?? []);
  const [loading, setLoading] = useState(cachedDefault === null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MessagesListResponse['meta'] | null>(cachedDefault?.meta ?? null);

  const fetchMessages = useCallback(async (options?: { force?: boolean }) => {
    const listInput = { page };
    const cacheKey = buildAdminMessagesListCacheKey(listInput);
    const cached = readAdminSessionCache<MessagesListResponse>(cacheKey, ADMIN_SESSION_CACHE_TTL_MS);

    if (!options?.force && cached !== null) {
      setMessages(cached.data ?? []);
      setMeta(cached.meta ?? null);
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<MessagesListResponse>('/api/v1/supersudo/messages', {
          params: buildAdminMessagesListApiParams(listInput),
        }),
      );
      setMessages(response.data ?? []);
      setMeta(response.meta ?? null);
      writeAdminSessionCache(cacheKey, response);
      hadCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Admin messages list fetch failed', { error: err });
      if (!hadCacheRef.current) {
        setMessages([]);
        setMeta(null);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    page,
    setPage,
    meta,
    fetchMessages,
  };
}
