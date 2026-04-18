import { z } from "zod";

import { SITE_CONTENT_STORAGE_VERSION } from "@/lib/constants/site-content";

const localeTripleSchema = z.object({
  hy: z.string().max(5000),
  ru: z.string().max(5000),
  en: z.string().max(5000),
});

const safeHrefSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    (href) => href.startsWith("/") || /^https?:\/\//i.test(href),
    "Must be a site path or http(s) URL",
  );

const mapEmbedSchema = z.object({
  enabled: z.boolean(),
  iframeSrc: z.string().url().max(2048).optional(),
});

const socialLinksSchema = z.object({
  instagram: z.string().url().max(2048).optional(),
  facebook: z.string().url().max(2048).optional(),
  linkedin: z.string().url().max(2048).optional(),
  telegram: z.string().url().max(2048).optional(),
  whatsapp: z.string().url().max(2048).optional(),
  viber: z.string().url().max(2048).optional(),
});

const aboutSchema = z.object({
  heroImageUrl: z.string().url().max(2048),
  subtitle: localeTripleSchema,
  title: localeTripleSchema,
  paragraph1: localeTripleSchema,
  paragraph2: localeTripleSchema,
  paragraph3: localeTripleSchema,
  teamSubtitle: localeTripleSchema,
  teamTitle: localeTripleSchema,
  teamDescription: localeTripleSchema,
});

const contactSchema = z.object({
  phoneDisplay: localeTripleSchema,
  phoneTel: z
    .string()
    .min(5)
    .max(40)
    .regex(/^[\d+()\s.-]+$/u, "Invalid phone tel format"),
  email: z.string().email().max(254),
  address: localeTripleSchema,
  workingHours: z.object({
    weekdays: localeTripleSchema,
    saturday: localeTripleSchema,
  }),
  callToUs: z.object({
    title: localeTripleSchema,
    description: localeTripleSchema,
  }),
  writeToUs: z.object({
    title: localeTripleSchema,
    description: localeTripleSchema,
    emailLabel: localeTripleSchema,
  }),
  headquarterTitle: localeTripleSchema,
  mapEmbed: mapEmbedSchema,
  socialLinks: socialLinksSchema,
});

const brandPagesSchema = z.object({
  sectionTitle: localeTripleSchema,
  fallbackDescriptionTemplate: localeTripleSchema,
  ctaLabel: localeTripleSchema,
  catalogPath: safeHrefSchema,
});

export const siteContentStorageSchema = z.object({
  version: z.literal(SITE_CONTENT_STORAGE_VERSION),
  about: aboutSchema,
  contact: contactSchema,
  brandPages: brandPagesSchema,
});

export type SiteContentStorage = z.infer<typeof siteContentStorageSchema>;
