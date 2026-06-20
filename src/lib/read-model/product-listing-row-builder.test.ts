import { describe, expect, it } from 'vitest';
import { buildProductListingRowsForLocales } from '@/lib/read-model/product-listing-row-builder';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const rebuiltAt = new Date('2026-01-03T00:00:00.000Z');

describe('buildProductListingRowsForLocales', () => {
  it('builds compact localized PLP rows from normalized product data', () => {
    const rows = buildProductListingRowsForLocales({
      locales: ['en', 'hy'],
      rebuiltAt,
      discountSettings: {
        globalDiscount: 0,
        categoryDiscounts: { cat1: 10 },
        brandDiscounts: {},
      },
      product: {
        id: 'prod1',
        brandId: 'brand1',
        primaryCategoryId: 'cat1',
        categoryIds: ['cat2'],
        media: [{ url: 'https://cdn.example.com/main.png', position: 1 }],
        discountPercent: 0,
        warrantyYears: 2,
        published: true,
        publishedAt: createdAt,
        deletedAt: null,
        createdAt,
        updatedAt,
        translations: [
          { locale: 'en', title: 'Phone X', slug: 'phone-x', subtitle: 'Fast phone' },
          { locale: 'hy', title: 'Հեռախոս X', slug: 'heraxos-x', subtitle: 'Արագ հեռախոս' },
        ],
        brand: {
          id: 'brand1',
          slug: 'brand-one',
          logoUrl: 'https://cdn.example.com/brand.svg',
          translations: [{ locale: 'en', name: 'Brand One' }],
        },
        variants: [
          {
            id: 'var1',
            imageUrl: 'https://cdn.example.com/variant.png',
            price: 100,
            compareAtPrice: null,
            stock: 5,
            published: true,
            attributes: null,
            options: [
              {
                attributeKey: 'color',
                value: 'Black',
                attributeValue: {
                  value: 'black',
                  imageUrl: null,
                  colors: ['#000000'],
                  translations: [{ locale: 'en', label: 'Black' }],
                  attribute: { key: 'color' },
                },
              },
              {
                attributeKey: 'size',
                value: 'XL',
                attributeValue: {
                  value: 'xl',
                  translations: [{ locale: 'en', label: 'XL' }],
                  attribute: { key: 'size' },
                },
              },
              {
                attributeKey: 'material',
                value: 'Metal',
                attributeValue: {
                  value: 'metal',
                  translations: [{ locale: 'en', label: 'Metal' }],
                  attribute: {
                    key: 'material',
                    type: 'select',
                    filterable: true,
                    translations: [{ locale: 'en', name: 'Material' }],
                  },
                },
              },
            ],
          },
        ],
        labels: [{ id: 'label1', type: 'text', value: 'New', position: 'top-left', color: null }],
        categories: [
          {
            id: 'cat1',
            translations: [
              { locale: 'en', title: 'Phones', slug: 'phones' },
              { locale: 'hy', title: 'Հեռախոսներ', slug: 'heraxosner' },
            ],
          },
        ],
      },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      productId: 'prod1',
      locale: 'en',
      slug: 'phone-x',
      title: 'Phone X',
      brandSlug: 'brand-one',
      brandName: 'Brand One',
      categoryIds: ['cat1', 'cat2'],
      categorySlugs: ['phones'],
      price: 100,
      originalPrice: 111.11111111111111,
      discountPercent: 10,
      defaultVariantId: 'var1',
      inStock: true,
      image: 'https://cdn.example.com/variant.png',
      images: ['https://cdn.example.com/variant.png'],
      warrantyYears: 2,
      rebuiltAt,
    });
    expect(rows[0]?.searchText).toContain('phone x');
    expect(rows[0]?.searchText).toContain('brand one');
    expect(rows[0]?.colors).toEqual([
      { value: 'Black', imageUrl: null, colors: ['#000000'] },
    ]);
    expect(rows[0]?.colorTokens).toEqual(['black']);
    expect(rows[0]?.sizeTokens).toEqual(['XL']);
    expect(rows[0]?.technicalSpecTokens).toEqual(['material=metal']);
    expect(rows[0]?.technicalSpecs).toEqual([
      {
        key: 'material',
        label: 'Material',
        type: 'select',
        value: 'metal',
        valueLabel: 'Metal',
      },
    ]);
    expect(rows[1]).toMatchObject({
      locale: 'hy',
      slug: 'heraxos-x',
      title: 'Հեռախոս X',
      categorySlugs: ['heraxosner'],
    });
  });

  it('falls back to the first translation when a locale-specific translation is missing', () => {
    const rows = buildProductListingRowsForLocales({
      locales: ['en', 'ru'],
      discountSettings: { globalDiscount: 0, categoryDiscounts: {}, brandDiscounts: {} },
      product: {
        id: 'prod2',
        createdAt,
        updatedAt,
        translations: [{ locale: 'en', title: 'Only EN', slug: 'only-en' }],
        variants: [],
      },
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.locale)).toEqual(['en', 'ru']);
    expect(rows[1]).toMatchObject({ slug: 'only-en', title: 'Only EN' });
  });
});
