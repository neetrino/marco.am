'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/types/errors';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminTablePagination } from '../components/AdminTablePagination';
import { logger } from "@/lib/utils/logger";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface MessagesResponse {
  data: Message[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/messages';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MessagesResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      logger.devLog('📧 [ADMIN] Fetching messages...', { page });
      
      const response = await apiClient.get<MessagesResponse>('/api/v1/supersudo/messages', {
        params: {
          page: page.toString(),
          limit: '20',
        },
      });

      logger.devLog('✅ [ADMIN] Messages fetched:', response);
      setMessages(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchMessages();
    }
     
  }, [isLoggedIn, isAdmin, page]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (messages.length === 0) return;
    setSelectedIds((prev) => {
      const allIds = messages.map((m) => m.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.messages.deleteConfirm').replace('{count}', selectedIds.size.toString()))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/v1/supersudo/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to delete messages');
      }
      
      setSelectedIds(new Set());
      await fetchMessages();
      alert(t('admin.messages.deletedSuccess'));
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Bulk delete messages error:', err);
      alert(t('admin.messages.failedToDelete') + ': ' + getErrorMessage(err));
    } finally {
      setBulkDeleting(false);
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

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.messages.title')}
      backLabel={t('admin.messages.backToAdmin')}
      onBack={() => router.push('/supersudo')}
      headerActions={
        selectedIds.size > 0 ? (
          <button
            type="button"
            onClick={handleClearSelection}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            {t('admin.products.clearAll')}
          </button>
        ) : undefined
      }
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-medium text-slate-600">{t('admin.messages.title')}</p>
        <p className="text-sm text-slate-500">
          {t('admin.messages.selectedMessages').replace('{count}', selectedIds.size.toString())}
        </p>
      </div>

      <Card className="admin-table-card overflow-hidden rounded-2xl border-slate-200/80 shadow-md shadow-slate-200/60">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('admin.messages.loadingMessages')}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">{t('admin.messages.noMessages')}</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4">
                    <div
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                        selectedIds.size > 0
                          ? 'border-amber-200/80 bg-amber-50/80 shadow-sm'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className={`text-sm font-medium ${selectedIds.size > 0 ? 'text-amber-900' : 'text-slate-600'}`}>
                        {t('admin.messages.selectedMessages').replace('{count}', selectedIds.size.toString())}
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || bulkDeleting}
                        className={
                          selectedIds.size > 0
                            ? 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                            : 'border-slate-200 bg-white text-slate-400'
                        }
                      >
                        {bulkDeleting ? t('admin.messages.deleting') : t('admin.messages.deleteSelected')}
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/85">
                        <tr>
                          <th className="w-14 py-2.5 text-center align-middle">
                            <input
                              type="checkbox"
                              aria-label={t('admin.messages.selectAll')}
                              checked={messages.length > 0 && messages.every(m => selectedIds.has(m.id))}
                              onChange={toggleSelectAll}
                              className="mx-auto h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                            />
                          </th>
                          <th className="whitespace-nowrap py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.messages.name')}
                          </th>
                          <th className="whitespace-nowrap py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.messages.email')}
                          </th>
                          <th className="whitespace-nowrap py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.messages.subject')}
                          </th>
                          <th className="whitespace-nowrap py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.messages.message')}
                          </th>
                          <th className="whitespace-nowrap py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('admin.messages.date')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {messages.map((message) => (
                          <tr key={message.id} className="group transition-colors hover:bg-amber-50/50">
                            <td className="w-14 py-3 text-center align-middle">
                              <input
                                type="checkbox"
                                aria-label={t('admin.messages.selectMessage').replace('{email}', message.email)}
                                checked={selectedIds.has(message.id)}
                                onChange={() => toggleSelect(message.id)}
                                className="mx-auto h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                              />
                            </td>
                            <td className="whitespace-nowrap py-3 pl-6 pr-3">
                              <div className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-amber-900">
                                {message.name}
                              </div>
                            </td>
                            <td className="whitespace-nowrap py-3 pl-6 pr-3">
                              <div className="text-sm text-slate-700">{message.email}</div>
                            </td>
                            <td className="py-3 pl-6 pr-3">
                              <div className="max-w-[14rem] truncate text-sm font-medium text-slate-800">
                                {message.subject}
                              </div>
                            </td>
                            <td className="py-3 pl-6 pr-3">
                              <div className="max-w-[22rem] truncate text-sm text-slate-700">{message.message}</div>
                            </td>
                            <td className="whitespace-nowrap py-3 pl-6 pr-3 text-sm text-slate-600">
                              {new Date(message.createdAt).toLocaleDateString('hy-AM')}
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

