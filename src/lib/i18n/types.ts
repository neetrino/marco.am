import type { LanguageCode } from '../language';

export type StorefrontNamespace =
  | 'common'
  | 'home'
  | 'product'
  | 'products'
  | 'attributes'
  | 'delivery'
  | 'about'
  | 'contact'
  | 'faq'
  | 'login'
  | 'cookies'
  | 'delivery-terms'
  | 'terms'
  | 'privacy'
  | 'support'
  | 'stores'
  | 'returns'
  | 'refund-policy'
  | 'profile'
  | 'checkout'
  | 'register'
  | 'categories'
  | 'orders';

export type AdminNamespace = 'admin';

export type Namespace = StorefrontNamespace | AdminNamespace;

export type ProductField = 'title' | 'shortDescription' | 'longDescription';

export type TranslationStore = Partial<Record<LanguageCode, Partial<Record<Namespace, unknown>>>>;

export const STOREFRONT_NAMESPACES: readonly StorefrontNamespace[] = [
  'common',
  'home',
  'product',
  'products',
  'attributes',
  'delivery',
  'about',
  'contact',
  'faq',
  'login',
  'cookies',
  'delivery-terms',
  'terms',
  'privacy',
  'support',
  'stores',
  'returns',
  'refund-policy',
  'profile',
  'checkout',
  'register',
  'categories',
  'orders',
] as const;

export const ALL_NAMESPACES: readonly Namespace[] = [...STOREFRONT_NAMESPACES, 'admin'];

export const ALL_NAMESPACES_SET = new Set<Namespace>(ALL_NAMESPACES);
