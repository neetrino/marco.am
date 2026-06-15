import type { StorefrontNamespacesPayload } from './en';

import hyCommon from '../../../locales/hy/common.json';
import hyHome from '../../../locales/hy/home.json';
import hyProduct from '../../../locales/hy/product.json';
import hyProducts from '../../../locales/hy/products.json';
import hyAttributes from '../../../locales/hy/attributes.json';
import hyDelivery from '../../../locales/hy/delivery.json';
import hyAbout from '../../../locales/hy/about.json';
import hyContact from '../../../locales/hy/contact.json';
import hyFaq from '../../../locales/hy/faq.json';
import hyLogin from '../../../locales/hy/login.json';
import hyCookies from '../../../locales/hy/cookies.json';
import hyDeliveryTerms from '../../../locales/hy/delivery-terms.json';
import hyTerms from '../../../locales/hy/terms.json';
import hyPrivacy from '../../../locales/hy/privacy.json';
import hySupport from '../../../locales/hy/support.json';
import hyStores from '../../../locales/hy/stores.json';
import hyReturns from '../../../locales/hy/returns.json';
import hyRefundPolicy from '../../../locales/hy/refund-policy.json';
import hyProfile from '../../../locales/hy/profile.json';
import hyCheckout from '../../../locales/hy/checkout.json';
import hyRegister from '../../../locales/hy/register.json';
import hyCategories from '../../../locales/hy/categories.json';
import hyOrders from '../../../locales/hy/orders.json';

/** Armenian storefront namespaces — separate client chunk via dynamic import. */
export const hyStorefrontNamespaces: StorefrontNamespacesPayload = {
  common: hyCommon,
  home: hyHome,
  product: hyProduct,
  products: hyProducts,
  attributes: hyAttributes,
  delivery: hyDelivery,
  about: hyAbout,
  contact: hyContact,
  faq: hyFaq,
  login: hyLogin,
  cookies: hyCookies,
  'delivery-terms': hyDeliveryTerms,
  terms: hyTerms,
  privacy: hyPrivacy,
  support: hySupport,
  stores: hyStores,
  returns: hyReturns,
  'refund-policy': hyRefundPolicy,
  profile: hyProfile,
  checkout: hyCheckout,
  register: hyRegister,
  categories: hyCategories,
  orders: hyOrders,
};
