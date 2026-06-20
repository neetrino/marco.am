import { db } from "@white-shop/db";
import { formatProductForList } from "./product-formatter";

type ProductDiscountRow = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  discountPercent: number;
};

const PRODUCT_DISCOUNTS_SELECT = {
  id: true,
  discountPercent: true,
  media: true,
  published: true,
  featured: true,
  productClass: true,
  createdAt: true,
  translations: {
    take: 1,
    select: { slug: true, title: true },
  },
  variants: {
    where: { published: true },
    take: 1,
    orderBy: { price: "asc" as const },
    select: { price: true, stock: true, compareAtPrice: true },
  },
} as const;

/**
 * Lightweight product rows for quick-settings discount UI (no pagination, minimal fields).
 */
export async function getProductDiscountsList(localeInput?: string): Promise<{ data: ProductDiscountRow[] }> {
  const locale = localeInput?.trim().toLowerCase() || "en";

  const products = await db.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      ...PRODUCT_DISCOUNTS_SELECT,
      translations: {
        where: { locale },
        take: 1,
        select: { slug: true, title: true },
      },
    },
  });

  const data = products.map((product): ProductDiscountRow => {
    const formatted = formatProductForList(
      {
        ...product,
        categoryIds: [],
        primaryCategoryId: null,
      },
      locale,
    );
    return {
      id: formatted.id,
      title: formatted.title,
      image: formatted.image,
      price: formatted.price,
      discountPercent: formatted.discountPercent,
    };
  });

  return { data };
}
