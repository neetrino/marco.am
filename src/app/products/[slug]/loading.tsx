import { ProductPdpNavigationFallback } from './ProductPdpNavigationFallback';

/**
 * PLP → PDP: show card shell instantly while the RSC page stream completes.
 */
export default function ProductSlugLoading() {
  return <ProductPdpNavigationFallback />;
}
