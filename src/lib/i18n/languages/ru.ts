import type { StorefrontNamespacesPayload } from './en';

import ruCommon from '../../../locales/ru/common.json';
import ruHome from '../../../locales/ru/home.json';
import ruProduct from '../../../locales/ru/product.json';
import ruProducts from '../../../locales/ru/products.json';
import ruAttributes from '../../../locales/ru/attributes.json';
import ruDelivery from '../../../locales/ru/delivery.json';
import ruAbout from '../../../locales/ru/about.json';
import ruContact from '../../../locales/ru/contact.json';
import ruFaq from '../../../locales/ru/faq.json';
import ruLogin from '../../../locales/ru/login.json';
import ruCookies from '../../../locales/ru/cookies.json';
import ruDeliveryTerms from '../../../locales/ru/delivery-terms.json';
import ruTerms from '../../../locales/ru/terms.json';
import ruPrivacy from '../../../locales/ru/privacy.json';
import ruSupport from '../../../locales/ru/support.json';
import ruStores from '../../../locales/ru/stores.json';
import ruReturns from '../../../locales/ru/returns.json';
import ruRefundPolicy from '../../../locales/ru/refund-policy.json';
import ruProfile from '../../../locales/ru/profile.json';
import ruCheckout from '../../../locales/ru/checkout.json';
import ruRegister from '../../../locales/ru/register.json';
import ruCategories from '../../../locales/ru/categories.json';
import ruOrders from '../../../locales/ru/orders.json';

/** Russian storefront namespaces — separate client chunk via dynamic import. */
export const ruStorefrontNamespaces: StorefrontNamespacesPayload = {
  common: ruCommon,
  home: ruHome,
  product: ruProduct,
  products: ruProducts,
  attributes: ruAttributes,
  delivery: ruDelivery,
  about: ruAbout,
  contact: ruContact,
  faq: ruFaq,
  login: ruLogin,
  cookies: ruCookies,
  'delivery-terms': ruDeliveryTerms,
  terms: ruTerms,
  privacy: ruPrivacy,
  support: ruSupport,
  stores: ruStores,
  returns: ruReturns,
  'refund-policy': ruRefundPolicy,
  profile: ruProfile,
  checkout: ruCheckout,
  register: ruRegister,
  categories: ruCategories,
  orders: ruOrders,
};
