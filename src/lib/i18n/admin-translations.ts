import type { LanguageCode } from '../language';
import type { TranslationStore } from './types';

import enAdmin from '../../locales/en/admin.json';
import hyAdmin from '../../locales/hy/admin.json';
import ruAdmin from '../../locales/ru/admin.json';

/** Admin locale payloads — loaded on `/supersudo` client routes only. */
export const adminTranslations: Pick<TranslationStore, LanguageCode> = {
  en: { admin: enAdmin },
  hy: { admin: hyAdmin },
  ru: { admin: ruAdmin },
};
