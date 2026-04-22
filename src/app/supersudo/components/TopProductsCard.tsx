'use client';

import { Card, Button } from '@shop/ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency } from '../utils/dashboardUtils';

interface TopProduct {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
}

interface TopProductsCardProps {
  topProducts: TopProduct[];
  topProductsLoading: boolean;
}

export function TopProductsCard({ topProducts, topProductsLoading }: TopProductsCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-marco-black">{t('admin.dashboard.topSellingProducts')}</h2>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl border border-marco-border bg-white px-3 py-1.5 text-marco-text/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/15 hover:text-marco-black hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-yellow/45"
          onClick={() => router.push('/supersudo/products')}
        >
          {t('admin.dashboard.viewAll')}
        </Button>
      </div>
      <div className="space-y-3">
        {topProductsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-marco-text/65">
            <p>{t('admin.dashboard.noSalesData')}</p>
          </div>
        ) : (
          topProducts.map((product, index) => (
            <div
              key={product.variantId}
              className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-marco-border/80 bg-white/80 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
              onClick={() => router.push(`/supersudo/products/${product.productId}`)}
            >
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-marco-yellow/25 text-xs font-bold text-marco-black/70">
                  {index + 1}
                </div>
              </div>
              {product.image && (
                <div className="flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-marco-border/70"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-marco-black">{product.title}</p>
                <p className="text-xs text-marco-text/70">SKU: {product.sku}</p>
                <p className="mt-1 text-xs text-marco-text/55">
                  {t('admin.dashboard.sold').replace('{count}', product.totalQuantity.toString())} • {t('admin.dashboard.orders').replace('{count}', product.orderCount.toString())}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-marco-black">
                  {formatCurrency(product.totalRevenue, 'USD')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

