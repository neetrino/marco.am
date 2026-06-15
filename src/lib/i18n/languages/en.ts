import type { StorefrontNamespace } from '../types';

import enCommon from '../../../locales/en/common.json';
import enHome from '../../../locales/en/home.json';
import enProduct from '../../../locales/en/product.json';
import enProducts from '../../../locales/en/products.json';
import enAttributes from '../../../locales/en/attributes.json';
import enDelivery from '../../../locales/en/delivery.json';
import enAbout from '../../../locales/en/about.json';
import enContact from '../../../locales/en/contact.json';
import enFaq from '../../../locales/en/faq.json';
import enLogin from '../../../locales/en/login.json';
import enCookies from '../../../locales/en/cookies.json';
import enDeliveryTerms from '../../../locales/en/delivery-terms.json';
import enTerms from '../../../locales/en/terms.json';
import enPrivacy from '../../../locales/en/privacy.json';
import enSupport from '../../../locales/en/support.json';
import enStores from '../../../locales/en/stores.json';
import enReturns from '../../../locales/en/returns.json';
import enRefundPolicy from '../../../locales/en/refund-policy.json';
import enProfile from '../../../locales/en/profile.json';
import enCheckout from '../../../locales/en/checkout.json';
import enRegister from '../../../locales/en/register.json';
import enCategories from '../../../locales/en/categories.json';
import enOrders from '../../../locales/en/orders.json';

export type StorefrontNamespacesPayload = Partial<Record<StorefrontNamespace, unknown>>;

/** English storefront namespaces — separate client chunk via dynamic import. */
export const enStorefrontNamespaces: StorefrontNamespacesPayload = {
  common: enCommon,
  home: enHome,
  product: enProduct,
  products: enProducts,
  attributes: enAttributes,
  delivery: enDelivery,
  about: enAbout,
  contact: enContact,
  faq: enFaq,
  login: enLogin,
  cookies: enCookies,
  'delivery-terms': enDeliveryTerms,
  terms: enTerms,
  privacy: enPrivacy,
  support: enSupport,
  stores: enStores,
  returns: enReturns,
  'refund-policy': enRefundPolicy,
  profile: enProfile,
  checkout: enCheckout,
  register: enRegister,
  categories: enCategories,
  orders: enOrders,
};
