import { describe, expect, it } from 'vitest';
import {
  buildProductListingRowsForLocales,
  type CategoryAncestry,
} from '@/lib/read-model/product-listing-row-builder';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const rebuiltAt = new Date('2026-01-03T00:00:00.000Z');

const EMPTY_ANCESTRY: CategoryAncestry = {
  parentById: new Map<string, string | null>(),
  slugByIdLocale: new Map<string, string>(),
};

describe('buildProductListingRowsForLocales', () => {
  it('builds compact localized PLP rows from normalized product data', () => {
    const rows = buildProductListingRowsForLocales({
      locales: ['en', 'hy'],
      rebuiltAt,
      categoryAncestry: EMPTY_ANCESTRY,
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
        discountType: 'NONE',
        discountValue: null,
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
            discountType: 'NONE',
            discountValue: null,
            discountExpiresAt: null,
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
      price: 90,
      originalPrice: 100,
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

  it('marks draft products as unpublished in listing rows', () => {
    const rows = buildProductListingRowsForLocales({
      locales: ['en'],
      rebuiltAt,
      categoryAncestry: EMPTY_ANCESTRY,
      discountSettings: { globalDiscount: 0, categoryDiscounts: {}, brandDiscounts: {} },
      product: {
        id: 'draft-prod',
        published: false,
        createdAt,
        updatedAt,
        translations: [{ locale: 'en', title: 'Draft Phone', slug: 'draft-phone' }],
        variants: [],
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      productId: 'draft-prod',
      isPublished: false,
      title: 'Draft Phone',
    });
  });

  it('falls back to the first translation when a locale-specific translation is missing', () => {
    const rows = buildProductListingRowsForLocales({
      locales: ['en', 'ru'],
      categoryAncestry: EMPTY_ANCESTRY,
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

  it('denormalizes ancestor category ids and slugs so parent filters match subcategory products', () => {
    const ancestry: CategoryAncestry = {
      parentById: new Map<string, string | null>([
        ['cat-child', 'cat-parent'],
        ['cat-parent', null],
      ]),
      slugByIdLocale: new Map<string, string>([
        ['cat-child:en', 'sofas'],
        ['cat-parent:en', 'furniture'],
      ]),
    };
    const rows = buildProductListingRowsForLocales({
      locales: ['en'],
      categoryAncestry: ancestry,
      discountSettings: { globalDiscount: 0, categoryDiscounts: {}, brandDiscounts: {} },
      product: {
        id: 'prod3',
        primaryCategoryId: 'cat-child',
        createdAt,
        updatedAt,
        translations: [{ locale: 'en', title: 'Sofa', slug: 'sofa' }],
        variants: [],
        categories: [{ id: 'cat-child', translations: [{ locale: 'en', title: 'Sofas', slug: 'sofas' }] }],
      },
    });

    expect(rows[0]?.categoryIds).toEqual(['cat-child', 'cat-parent']);
    expect(rows[0]?.categorySlugs).toEqual(['sofas', 'furniture']);
  });

  it('strips HTML from subtitle when building searchText', () => {
    const rows = buildProductListingRowsForLocales({
      locales: ['hy'],
      categoryAncestry: EMPTY_ANCESTRY,
      discountSettings: { globalDiscount: 0, categoryDiscounts: {}, brandDiscounts: {} },
      product: {
        id: 'prod-html-subtitle',
        createdAt,
        updatedAt,
        translations: [
          {
            locale: 'hy',
            title: 'MIDEA MID60S130i',
            slug: 'marco-21777-midea-mid60s130i',
            subtitle: '<p><strong>*</strong> Dimensions may vary</p>',
          },
        ],
        variants: [{ id: 'var1', price: 100, stock: 1, published: true }],
      },
    });

    expect(rows[0]?.searchText).toContain('midea mid60s130i');
    expect(rows[0]?.searchText).toContain('dimensions may vary');
    expect(rows[0]?.searchText).not.toContain('<p>');
    expect(rows[0]?.searchText).not.toContain('<strong>');
  });
});
