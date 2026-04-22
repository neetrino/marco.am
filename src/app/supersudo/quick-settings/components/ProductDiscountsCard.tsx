'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { logger } from "@/lib/utils/logger";

interface Product {
  id: string;
  title: string;
  image?: string;
  price?: number;
  discountPercent?: number;
}

interface ProductDiscountsCardProps {
  products: Product[];
  productsLoading: boolean;
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

const PRODUCT_ITEMS_PER_PAGE = 12;

export function ProductDiscountsCard({
  products,
  productsLoading,
  productDiscounts,
  setProductDiscounts,
  handleProductDiscountSave,
  savingProductId,
}: ProductDiscountsCardProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(products.length / PRODUCT_ITEMS_PER_PAGE)),
    [products.length],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCT_ITEMS_PER_PAGE;
    return products.slice(startIndex, startIndex + PRODUCT_ITEMS_PER_PAGE);
  }, [currentPage, products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="admin-card border-slate-200/80 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="mb-6">
        <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">{t('admin.quickSettings.productDiscounts')}</h2>
        <p className="text-sm text-slate-600">{t('admin.quickSettings.productDiscountsSubtitle')}</p>
      </div>

      {productsLoading ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900"></div>
          <p className="text-slate-600">{t('admin.quickSettings.loadingProducts')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center">
          <p className="text-slate-600">{t('admin.quickSettings.noProducts')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProducts.map((product) => {
            const currentDiscount = Number(productDiscounts[product.id] ?? product.discountPercent ?? 0);
            const originalPrice = product.price || 0;
            const discountedPrice = currentDiscount > 0 && originalPrice > 0
              ? Math.round(originalPrice * (1 - currentDiscount / 100))
              : originalPrice;

            return (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 p-3 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
              >
                {product.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{product.title}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    {currentDiscount > 0 && originalPrice > 0 ? (
                      <>
                        <span className="select-none text-xs font-semibold text-slate-700">
                          {formatPrice(discountedPrice)}
                        </span>
                        <span className="select-none text-xs text-slate-400 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          -{currentDiscount}%
                        </span>
                      </>
                    ) : (
                      <span className="select-none text-xs text-slate-500">
                        {originalPrice > 0 ? formatPrice(originalPrice) : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={productDiscounts[product.id] ?? product.discountPercent ?? 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      const discountValue = value === '' ? 0 : parseFloat(value) || 0;
                      logger.devLog(`🔄 [QUICK SETTINGS] Updating discount for product ${product.id}: ${discountValue}%`);
                      setProductDiscounts((prev) => {
                        const updated = {
                          ...prev,
                          [product.id]: discountValue,
                        };
                        logger.devLog(`✅ [QUICK SETTINGS] Updated productDiscounts:`, updated);
                        return updated;
                      });
                    }}
                    className="w-20 border-slate-300 bg-white"
                    placeholder="0"
                  />
                  <span className="w-6 text-sm font-semibold text-slate-700">%</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleProductDiscountSave(product.id)}
                    disabled={savingProductId === product.id}
                    className="px-4 shadow-sm"
                  >
                    {savingProductId === product.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      t('admin.quickSettings.save')
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="text-sm font-medium text-slate-700">
                {t('admin.quickSettings.showingPage')
                  .replace('{page}', currentPage.toString())
                  .replace('{totalPages}', totalPages.toString())
                  .replace('{total}', products.length.toString())}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50"
                >
                  {t('admin.quickSettings.previous')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50"
                >
                  {t('admin.quickSettings.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

