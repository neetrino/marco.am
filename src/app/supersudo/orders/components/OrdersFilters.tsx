'use client';

import { ADMIN_ORDER_LIST_STATUS_VALUES } from '@/lib/constants/admin-order-list-status';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { useOrders } from '../useOrders';
import { ADMIN_ORDER_STATUS_I18N_KEY } from '../utils/order-status-labels';

interface OrdersFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
  updateMessage: { type: 'success' | 'error'; text: string } | null;
  setStatusFilter: (value: string) => void;
  setPaymentStatusFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setPage: (value: number | ((prev: number) => number)) => void;
  router: ReturnType<typeof useOrders>['router'];
  searchParams: ReturnType<typeof useOrders>['searchParams'];
}

export function OrdersFilters({
  statusFilter,
  paymentStatusFilter,
  searchQuery,
  updateMessage,
  setStatusFilter,
  setPaymentStatusFilter,
  setSearchQuery,
  setPage,
  router,
  searchParams,
}: OrdersFiltersProps) {
  const { t } = useTranslation();
  const statusValues = useMemo(
    () => ['', ...ADMIN_ORDER_LIST_STATUS_VALUES] as const,
    []
  );
  const statusLabels = useMemo(
    () =>
      statusValues.map((value) =>
        value === '' ? t('admin.orders.allStatuses') : t(ADMIN_ORDER_STATUS_I18N_KEY[value])
      ),
    [statusValues, t]
  );
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    ready: false,
  });
  const [isIndicatorMoving, setIsIndicatorMoving] = useState(false);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = statusValues.findIndex((v) => v === statusFilter);
      const fallbackIndex = activeIndex >= 0 ? activeIndex : 0;
      const activeButton = buttonRefs.current[fallbackIndex];
      if (!activeButton) {
        return;
      }

      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
        ready: true,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [statusFilter, statusLabels, statusValues]);

  useEffect(() => {
    setIsIndicatorMoving(true);
    const timeoutId = window.setTimeout(() => setIsIndicatorMoving(false), 420);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusFilter]);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
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
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
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
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  return (
    <Card className="admin-card mb-1 border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative max-w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-100/70 p-1"
          role="group"
          aria-label={t('admin.orders.orderStatusFilters')}
        >
          <div
            className={`absolute top-1 h-[calc(100%-0.5rem)] rounded-lg border border-yellow-400/80 bg-gradient-to-r from-amber-300 to-yellow-400 shadow-[0_8px_20px_rgba(251,191,36,0.35)] transition-[left,width,opacity,transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[left,width,transform] ${
              indicatorStyle.ready ? 'opacity-100' : 'opacity-0'
            } ${isIndicatorMoving ? 'scale-[1.03] -translate-y-[1px] shadow-[0_10px_24px_rgba(251,191,36,0.45)]' : 'scale-100 translate-y-0'}`}
            style={{
              left: `${indicatorStyle.left + 2}px`,
              width: `${Math.max(indicatorStyle.width - 2, 0)}px`,
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 inline-flex min-w-max items-center gap-2">
            {statusValues.map((value, index) => {
              const isActive = statusFilter === value;
              const label = statusLabels[index];

              return (
                <button
                  key={value || 'all'}
                  ref={(element) => {
                    buttonRefs.current[index] = element;
                  }}
                  type="button"
                  onClick={() => handleStatusChange(value)}
                  className={`inline-flex h-10 shrink-0 whitespace-nowrap items-center justify-center rounded-lg border px-4 text-center text-sm font-medium leading-5 transition-colors ${
                    isActive
                      ? 'border-transparent bg-transparent text-marco-black'
                      : 'border-transparent bg-white text-gray-700 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <select
          className="admin-field h-10 min-w-[210px] border-slate-300 bg-white shadow-sm"
          value={paymentStatusFilter}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
        >
          <option value="">{t('admin.orders.allPaymentStatuses')}</option>
          <option value="paid">{t('admin.orders.paid')}</option>
          <option value="pending">{t('admin.orders.pendingPayment')}</option>
          <option value="failed">{t('admin.orders.failed')}</option>
        </select>
        <div className="relative isolate min-w-[220px] flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.5 3a5.5 5.5 0 014.4 8.8l3.65 3.65a1 1 0 01-1.42 1.42l-3.65-3.65A5.5 5.5 0 118.5 3zm-3.5 5.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder={t('admin.orders.searchPlaceholder')}
            className="admin-field relative z-10 h-10 w-full appearance-none border-slate-300 bg-white pl-9 pr-3 text-slate-800 shadow-sm [text-decoration:none] placeholder:text-slate-400 placeholder:[text-decoration:none]"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        {updateMessage && (
          <div
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${
              updateMessage.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {updateMessage.text}
          </div>
        )}
      </div>
    </Card>
  );
}

