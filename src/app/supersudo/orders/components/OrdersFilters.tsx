'use client';

import {
  ADMIN_ORDER_LIST_STATUS_VALUES,
  isAdminOrderListStatus,
} from '@/lib/constants/admin-order-list-status';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ListFilter, Search, Trash2, X } from 'lucide-react';
import { useTranslation } from '../../../../lib/i18n-client';
import type { useOrders } from '../useOrders';
import { ADMIN_ORDER_STATUS_I18N_KEY } from '../utils/order-status-labels';

interface OrdersFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
  totalOrders?: number;
  updateMessage: { type: 'success' | 'error'; text: string } | null;
  setStatusFilter: (value: string) => void;
  setPaymentStatusFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setPage: (value: number | ((prev: number) => number)) => void;
  router: ReturnType<typeof useOrders>['router'];
  searchParams: ReturnType<typeof useOrders>['searchParams'];
}

const FILTER_PANEL_ID = 'orders-filters-panel';

const PAYMENT_STATUS_I18N_KEY: Record<string, string> = {
  paid: 'admin.orders.paid',
  pending: 'admin.orders.pendingPayment',
  failed: 'admin.orders.failed',
};

type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function OrdersFilters({
  statusFilter,
  paymentStatusFilter,
  searchQuery,
  totalOrders = 0,
  updateMessage,
  setStatusFilter,
  setPaymentStatusFilter,
  setSearchQuery,
  setPage,
  router,
  searchParams,
}: OrdersFiltersProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const statusValues = useMemo(() => ['', ...ADMIN_ORDER_LIST_STATUS_VALUES] as const, []);

  const pushOrdersUrl = (params: URLSearchParams) => {
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    pushOrdersUrl(params);
  };

  const handlePaymentStatusChange = (newPaymentStatus: string) => {
    setPaymentStatusFilter(newPaymentStatus);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newPaymentStatus) {
      params.set('paymentStatus', newPaymentStatus);
    } else {
      params.delete('paymentStatus');
    }
    pushOrdersUrl(params);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }
    pushOrdersUrl(params);
  };

  const handleClearAll = () => {
    setStatusFilter('');
    setPaymentStatusFilter('');
    setSearchQuery('');
    setPage(1);
    router.push('/supersudo/orders', { scroll: false });
  };

  const getOrderStatusLabel = (value: string): string => {
    if (isAdminOrderListStatus(value)) {
      return t(ADMIN_ORDER_STATUS_I18N_KEY[value]);
    }
    return value;
  };

  const getPaymentStatusLabel = (value: string): string => {
    const key = PAYMENT_STATUS_I18N_KEY[value];
    return key ? t(key) : value;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count += 1;
    if (paymentStatusFilter) count += 1;
    return count;
  }, [paymentStatusFilter, statusFilter]);

  const activeFilterChips = useMemo((): ActiveFilterChip[] => {
    const chips: ActiveFilterChip[] = [];

    if (statusFilter) {
      chips.push({
        key: 'order-status',
        label: getOrderStatusLabel(statusFilter),
        onRemove: () => handleStatusChange(''),
      });
    }

    if (paymentStatusFilter) {
      chips.push({
        key: 'payment-status',
        label: getPaymentStatusLabel(paymentStatusFilter),
        onRemove: () => handlePaymentStatusChange(''),
      });
    }

    return chips;
  }, [paymentStatusFilter, statusFilter, t]);

  const hasActiveFilters = activeFilterCount > 0;
  const hasAnythingToClear = searchQuery.length > 0 || hasActiveFilters;

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!rootRef.current?.contains(target)) {
        setPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [panelOpen]);

  const openPanel = () => setPanelOpen(true);
  const togglePanel = () => setPanelOpen((open) => !open);

  const fieldClass =
    'admin-field border-slate-300/90 bg-white text-sm transition-all focus:border-slate-800';

  return (
    <div className="space-y-3 mb-5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 shadow-sm">
          {t('admin.orders.totalOrdersCount').replace('{count}', totalOrders.toLocaleString())}
        </div>
      </div>

      <div ref={rootRef}>
        <div className="relative">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-white/95 shadow-sm shadow-slate-200/60 transition-colors ${
              panelOpen ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200/80'
            }`}
          >
            <Search
              className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-slate-400 sm:ml-4"
              aria-hidden
            />

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-2 pl-1 pr-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex max-w-[13rem] items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 py-0.5 pl-2.5 pr-1 text-xs font-medium text-slate-700"
                >
                  <span className="truncate">{chip.label}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      chip.onRemove();
                    }}
                    className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-800"
                    aria-label={t('admin.orders.removeFilterChip', { label: chip.label })}
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={openPanel}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setPage(1);
                  }
                }}
                placeholder={
                  activeFilterChips.length > 0
                    ? t('admin.orders.searchWithFiltersPlaceholder')
                    : t('admin.orders.searchPlaceholder')
                }
                autoComplete="off"
                className="min-w-[7rem] flex-1 border-0 bg-transparent py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                aria-label={t('admin.orders.searchLabel')}
                aria-expanded={panelOpen}
                aria-controls={FILTER_PANEL_ID}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (hasAnythingToClear) {
                  handleClearAll();
                  return;
                }
                togglePanel();
              }}
              className={`relative mr-2 flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors sm:mr-3 ${
                hasAnythingToClear
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : panelOpen
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              aria-label={
                hasAnythingToClear ? t('admin.orders.clearAll') : t('admin.orders.openFilters')
              }
              aria-expanded={panelOpen}
              aria-controls={FILTER_PANEL_ID}
            >
              {hasAnythingToClear ? (
                <Trash2 className="h-4 w-4" aria-hidden />
              ) : (
                <ListFilter className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          {panelOpen ? (
            <div
              id={FILTER_PANEL_ID}
              className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-300/30"
            >
              <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{t('admin.orders.filtersTitle')}</p>
                  {hasAnythingToClear ? (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {t('admin.orders.clearAll')}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('admin.orders.status')}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className={fieldClass}
                  >
                    {statusValues.map((value) => (
                      <option key={value || 'all'} value={value}>
                        {value === '' ? t('admin.orders.allStatuses') : getOrderStatusLabel(value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('admin.orders.payment')}
                  </label>
                  <select
                    value={paymentStatusFilter}
                    onChange={(event) => handlePaymentStatusChange(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">{t('admin.orders.allPaymentStatuses')}</option>
                    <option value="paid">{t('admin.orders.paid')}</option>
                    <option value="pending">{t('admin.orders.pendingPayment')}</option>
                    <option value="failed">{t('admin.orders.failed')}</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {updateMessage ? (
        <div
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${
            updateMessage.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {updateMessage.text}
        </div>
      ) : null}
    </div>
  );
}
