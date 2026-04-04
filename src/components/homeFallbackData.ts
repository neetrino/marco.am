import type { LanguageCode } from '../lib/language';

type LocalizedText = {
  en: string;
  hy: string;
  ru: string;
};

type LocalizedProductSeed = {
  id: string;
  title: LocalizedText;
  brand: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  href?: string;
};

type LocalizedCategorySeed = {
  id: string;
  slug: string;
  title: LocalizedText;
  image: string;
};

export interface HomeFallbackCategory {
  id: string;
  slug: string;
  title: string;
  productCount: number;
  image: string;
}

export interface HomeFallbackProduct {
  id: string;
  href: string;
  title: string;
  brand: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
}

function pickText(text: LocalizedText, language: LanguageCode): string {
  if (language === 'hy') return text.hy;
  if (language === 'ru') return text.ru;
  return text.en;
}

const fallbackCategories: LocalizedCategorySeed[] = [
  {
    id: 'fridges',
    slug: 'electronics',
    title: {
      en: 'Refrigerators',
      hy: 'Սառնարաններ',
      ru: 'Холодильники',
    },
    image:
      'https://images.pexels.com/photos/4108794/pexels-photo-4108794.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  },
  {
    id: 'tvs',
    slug: 'electronics',
    title: {
      en: 'TVs',
      hy: 'Հեռուստացույցներ',
      ru: 'Телевизоры',
    },
    image:
      'https://images.pexels.com/photos/6782362/pexels-photo-6782362.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  },
  {
    id: 'washers',
    slug: 'home',
    title: {
      en: 'Washers',
      hy: 'Լվացքի մեքենաներ',
      ru: 'Стиральные машины',
    },
    image:
      'https://images.pexels.com/photos/5824900/pexels-photo-5824900.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  },
  {
    id: 'phones',
    slug: 'electronics',
    title: {
      en: 'Smartphones',
      hy: 'Սմարթֆոններ',
      ru: 'Смартфоны',
    },
    image:
      'https://www.figma.com/api/mcp/asset/55ec56b3-4ee8-4aa4-99cf-5c4b087d0383',
  },
  {
    id: 'laptops',
    slug: 'electronics',
    title: {
      en: 'Laptops',
      hy: 'Նոթբուքեր',
      ru: 'Ноутбуки',
    },
    image:
      'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  },
  {
    id: 'sofas',
    slug: 'home',
    title: {
      en: 'Sofas',
      hy: 'Բազմոցներ',
      ru: 'Диваны',
    },
    image:
      'https://www.figma.com/api/mcp/asset/5a76e8b4-cf6f-4f9a-b9a7-bc43fe98119a',
  },
  {
    id: 'vacuums',
    slug: 'home',
    title: {
      en: 'Vacuums',
      hy: 'Փոշեկուլներ',
      ru: 'Пылесосы',
    },
    image:
      'https://images.pexels.com/photos/4107123/pexels-photo-4107123.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  },
  {
    id: 'acs',
    slug: 'home',
    title: {
      en: 'Air Conditioners',
      hy: 'Օդորակիչներ',
      ru: 'Кондиционеры',
    },
    image:
      'https://images.pexels.com/photos/5824870/pexels-photo-5824870.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  },
];

const featuredProducts: LocalizedProductSeed[] = [
  {
    id: 'feature-sofa',
    title: {
      en: 'Bellini Corner Sofa',
      hy: 'Bellini անկյունային բազմոց',
      ru: 'Угловой диван Bellini',
    },
    brand: 'Marco Casa',
    image:
      'https://www.figma.com/api/mcp/asset/5a76e8b4-cf6f-4f9a-b9a7-bc43fe98119a',
    price: 349900,
    compareAtPrice: 419900,
    badge: '-17%',
  },
  {
    id: 'feature-tv',
    title: {
      en: 'Hisense 4K Smart TV',
      hy: 'Hisense 4K սմարթ TV',
      ru: 'Hisense 4K Smart TV',
    },
    brand: 'Hisense',
    image:
      'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 289900,
    compareAtPrice: 339900,
    badge: '-15%',
  },
  {
    id: 'feature-phone',
    title: {
      en: 'Galaxy Series Smartphone',
      hy: 'Galaxy շարքի սմարթֆոն',
      ru: 'Смартфон серии Galaxy',
    },
    brand: 'Samsung',
    image:
      'https://www.figma.com/api/mcp/asset/55ec56b3-4ee8-4aa4-99cf-5c4b087d0383',
    price: 429900,
    compareAtPrice: 499900,
    badge: '-14%',
  },
  {
    id: 'feature-washer',
    title: {
      en: 'Steam Wash Front Loader',
      hy: 'Steam Wash լվացքի մեքենա',
      ru: 'Стиральная машина Steam Wash',
    },
    brand: 'LG',
    image:
      'https://images.pexels.com/photos/5824900/pexels-photo-5824900.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 259900,
    compareAtPrice: 314900,
    badge: '-17%',
  },
  {
    id: 'feature-fridge',
    title: {
      en: 'FreshLine Refrigerator',
      hy: 'FreshLine սառնարան',
      ru: 'Холодильник FreshLine',
    },
    brand: 'Panasonic',
    image:
      'https://images.pexels.com/photos/4108794/pexels-photo-4108794.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 379900,
    compareAtPrice: 439900,
    badge: '-13%',
  },
  {
    id: 'feature-laptop',
    title: {
      en: 'UltraSlim Work Laptop',
      hy: 'UltraSlim աշխատանքային նոթբուք',
      ru: 'Ноутбук UltraSlim',
    },
    brand: 'Acer',
    image:
      'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=900',
    price: 319900,
    compareAtPrice: 369900,
    badge: '-14%',
  },
];

const newProducts: LocalizedProductSeed[] = [
  {
    id: 'new-phone',
    title: {
      en: 'Neo 5G Smartphone',
      hy: 'Neo 5G սմարթֆոն',
      ru: 'Смартфон Neo 5G',
    },
    brand: 'Marco Mobile',
    image:
      'https://www.figma.com/api/mcp/asset/93836d40-5cc3-42f0-badf-d7f90198e7dc',
    price: 459900,
    badge: 'NEW',
  },
  {
    id: 'new-vacuum',
    title: {
      en: 'Cyclone Cordless Vacuum',
      hy: 'Cyclone անլար փոշեկուլ',
      ru: 'Беспроводной пылесос Cyclone',
    },
    brand: 'Dyson',
    image:
      'https://images.pexels.com/photos/4107123/pexels-photo-4107123.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 229900,
    badge: 'NEW',
  },
  {
    id: 'new-tv',
    title: {
      en: 'Quantum Mini LED TV',
      hy: 'Quantum Mini LED TV',
      ru: 'Quantum Mini LED TV',
    },
    brand: 'Samsung',
    image:
      'https://images.pexels.com/photos/6782362/pexels-photo-6782362.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 519900,
    badge: 'NEW',
  },
  {
    id: 'new-ac',
    title: {
      en: 'Smart Air Conditioner',
      hy: 'Սմարթ օդորակիչ',
      ru: 'Умный кондиционер',
    },
    brand: 'Hisense',
    image:
      'https://images.pexels.com/photos/5824870/pexels-photo-5824870.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 239900,
    badge: 'NEW',
  },
  {
    id: 'new-speaker',
    title: {
      en: 'Portable Sound Speaker',
      hy: 'Portable Sound բարձրախոս',
      ru: 'Портативная колонка Sound',
    },
    brand: 'JBL',
    image:
      'https://images.pexels.com/photos/63703/pexels-photo-63703.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 79900,
    badge: 'NEW',
  },
  {
    id: 'new-kitchen',
    title: {
      en: 'Compact Kitchen Mixer',
      hy: 'Compact խոհանոցային միքսեր',
      ru: 'Компактный кухонный миксер',
    },
    brand: 'Bosch',
    image:
      'https://images.pexels.com/photos/699614/pexels-photo-699614.jpeg?auto=compress&cs=tinysrgb&w=900',
    price: 114900,
    badge: 'NEW',
  },
];

export function getFallbackTopCategories(language: LanguageCode): HomeFallbackCategory[] {
  return fallbackCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    title: pickText(category.title, language),
    productCount: 0,
    image: category.image,
  }));
}

function mapProducts(
  products: LocalizedProductSeed[],
  language: LanguageCode,
  badgeLabels?: Partial<Record<string, string>>
): HomeFallbackProduct[] {
  return products.map((product) => ({
    id: product.id,
    href: product.href || '/products',
    title: pickText(product.title, language),
    brand: product.brand,
    image: product.image,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    badge: product.badge ? badgeLabels?.[product.badge] || product.badge : undefined,
  }));
}

export function getFallbackFeaturedProducts(language: LanguageCode): HomeFallbackProduct[] {
  return mapProducts(featuredProducts, language);
}

export function getFallbackNewProducts(language: LanguageCode): HomeFallbackProduct[] {
  const badgeLabels = {
    NEW:
      language === 'hy'
        ? 'ՆՈՐ'
        : language === 'ru'
          ? 'НОВОЕ'
          : 'NEW',
  };

  return mapProducts(newProducts, language, badgeLabels);
}
