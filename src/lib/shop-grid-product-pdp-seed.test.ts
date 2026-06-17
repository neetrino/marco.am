import { describe, expect, it } from 'vitest';

import { shopGridProductToPdpNavigationSeed } from '@/lib/shop-grid-product-pdp-seed';
import type { ShopGridProduct } from '@/app/products/shop-grid-product';

describe('shopGridProductToPdpNavigationSeed', () => {
  it('copies canonical PLP gallery into navigation seed', () => {
    const row: ShopGridProduct = {
      id: 'p1',
      slug: 'fridge-x',
      title: 'Fridge X',
      price: 117600,
      compareAtPrice: 147000,
      image: 'https://marco.am/wp-content/uploads/2025/02/2.png',
      images: [
        'https://marco.am/wp-content/uploads/2025/02/2.png',
        'https://marco.am/wp-content/uploads/2025/02/3.png',
        'https://marco.am/wp-content/uploads/2025/02/4.png',
      ],
      inStock: true,
      brand: { id: 'b1', slug: 'geepas', name: 'GEEPAS', logoUrl: null },
      defaultVariantId: null,
      colors: [],
      labels: [],
    };

    const seed = shopGridProductToPdpNavigationSeed(row);
    expect(seed.images).toEqual(row.images);
    expect(seed.image).toBe(row.image);
    expect(seed.discountBadge?.type).toBe('percentage');
  });
});
