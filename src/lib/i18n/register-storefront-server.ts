import { registerStorefrontLanguage } from './translation-store';
import { enStorefrontNamespaces } from './languages/en';
import { hyStorefrontNamespaces } from './languages/hy';
import { ruStorefrontNamespaces } from './languages/ru';

registerStorefrontLanguage('en', enStorefrontNamespaces);
registerStorefrontLanguage('hy', hyStorefrontNamespaces);
registerStorefrontLanguage('ru', ruStorefrontNamespaces);
