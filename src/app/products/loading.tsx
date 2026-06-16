import { ProductsShopClientShell } from './ProductsShopClientShell';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';

/** Route-level fallback — header paints immediately; body skeleton matches page Suspense. */
export default function ProductsLoading() {
  return (
    <ProductsShopClientShell>
      <ProductsShopLoadingSkeleton variant="body" />
    </ProductsShopClientShell>
  );
}
