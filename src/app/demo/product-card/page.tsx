import { ProductCardFigma } from '@/components/ProductCard/ProductCardFigma';

/** Figma asset URL for product image (node 101-3473) — valid 7 days */
const FIGMA_PRODUCT_IMAGE =
  'https://www.figma.com/api/mcp/asset/318e684e-077f-4b41-8633-4889efe0fc8b';

export default function DemoProductCardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 font-montserrat-arm text-2xl font-bold text-gray-900">
        Product Card — Figma implementation (node 101-3473)
      </h1>
      <div className="flex justify-start">
        <ProductCardFigma
          slug="automatic-coffee-machine-verocup-100"
          title="Automatic Coffee Machine VeroCup 100"
          brandName="Bosch"
          price="189,000 ֏"
          imageUrl={FIGMA_PRODUCT_IMAGE}
          rating={5}
          reviewCount={15}
          warrantyText="3 ՏԱՐԻ ԵՐԱՇԽԻՔ"
          discountPercent={15}
          inStock
          onAddToCart={() => {}}
          onWishlistToggle={() => {}}
          onCompareToggle={() => {}}
        />
      </div>
    </div>
  );
}
