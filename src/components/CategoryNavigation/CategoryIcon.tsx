'use client';

import Image from 'next/image';
import { getCategoryIcon, type Category } from './utils';
import { SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC } from '../home/home-special-offers.constants';

interface Product {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface CategoryIconProps {
  category: Category;
  product: Product | null;
  isActive: boolean;
  t: (path: string) => string;
}

/**
 * Component for displaying category icon/image
 */
export function CategoryIcon({ category, product: _product, isActive, t }: CategoryIconProps) {
  const title = category.title.toLowerCase();
  const slug = category.slug.toLowerCase();

  // Special categories (all, new, sale) use getCategoryIcon
  if (slug === 'all' || title.includes('new') || title.includes('sale')) {
    return <>{getCategoryIcon(category.title, category.slug, isActive, t)}</>;
  }

  const displayImageSrc = SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC;

  // Regular categories always show unified image
  return (
    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-2 flex items-center justify-center overflow-hidden transition-all ${
      isActive ? 'border-gray-400 shadow-md' : 'border-gray-200'
    }`}>
      <Image
        src={displayImageSrc}
        alt={category.title}
        width={80}
        height={80}
        className="w-full h-full object-cover"
        unoptimized
      />
    </div>
  );
}




