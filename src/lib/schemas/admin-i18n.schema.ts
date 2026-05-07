import { z } from "zod";

const i18nTranslationScopeValues = [
  "home-hero",
  "home-why-choose-us",
  "home-brand-partners",
  "home-footer",
  "banners",
  "reels",
  "site-content",
  "site-legal-pages",
] as const;

export const i18nTranslationScopeSchema = z.enum(i18nTranslationScopeValues);

export const i18nTranslationEntrySchema = z.object({
  key: z.string().trim().min(1).max(400),
  hy: z.string().max(10000),
  ru: z.string().max(10000),
  en: z.string().max(10000),
});

export const updateI18nTranslationsPayloadSchema = z.object({
  scope: i18nTranslationScopeSchema,
  entries: z.array(i18nTranslationEntrySchema).max(5000),
  strict: z.boolean().optional().default(true),
});

export type I18nTranslationScope = z.infer<typeof i18nTranslationScopeSchema>;
export type I18nTranslationEntry = z.infer<typeof i18nTranslationEntrySchema>;
export type UpdateI18nTranslationsPayload = z.infer<
  typeof updateI18nTranslationsPayloadSchema
>;
