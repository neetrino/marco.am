import { ProductPdpNavigationFallback } from './ProductPdpNavigationFallback';

/**
 * Instant navigation state: paints the PLP/card shell (image, title, brand, price) from the
 * client navigation seed with zero server round-trip, while the page slot streams full detail.
 */
export default function ProductSlugLoading() {
  return <ProductPdpNavigationFallback />;
}
