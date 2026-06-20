import { z } from "zod";

import {
  HOME_SITE_FOOTER_STORAGE_VERSION,
} from "@/lib/constants/site-footer";

const localeTripleSchema = z.object({
  en: z.string().max(800),
  hy: z.string().max(800),
  ru: z.string().max(800),
});

const hrefSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    (h) => h.startsWith("/") || /^https?:\/\//i.test(h),
    "Must be a site path or http(s) URL",
  );

const siteFooterSocialPlatformSchema = z.enum([
  "instagram",
  "facebook",
  "telegram",
  "whatsapp",
  "viber",
]);
const navLinkSchema = z.object({
  id: z.string().min(1).max(64),
  label: localeTripleSchema,
  href: hrefSchema,
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

const socialLinkSchema = z
  .object({
    id: z.string().min(1).max(64),
    platform: siteFooterSocialPlatformSchema,
    /** Required when `active` — HTTPS URL for the social profile. */
    href: z.string().url().max(2048).optional(),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999),
  })
  .refine(
    (row) =>
      !row.active ||
      (row.href !== undefined && row.href.startsWith("https://")),
    "Active social rows need an HTTPS URL",
  );

export const siteFooterStorageSchema = z.object({
  version: z.literal(HOME_SITE_FOOTER_STORAGE_VERSION),
  /** Column headings — full locale triple for admin; public API resolves one locale. */
  companyColumnTitle: localeTripleSchema,
  supportColumnTitle: localeTripleSchema,
  contactsColumnTitle: localeTripleSchema,
  contact: z.object({
    address: localeTripleSchema,
    phoneDisplay: localeTripleSchema,
    /** Dial string for `tel:` (digits, spaces, + allowed). */
    phoneTel: z
      .string()
      .min(5)
      .max(40)
      .regex(/^[\d+()\s.-]+$/u, "Invalid phone tel format"),
    email: z.string().email().max(254),
  }),
  mapEmbed: z.object({
    enabled: z.boolean(),
    /** Google Maps / OpenStreetMap embed HTTPS URL (validated on write). */
    iframeSrc: z.string().url().max(2048).optional(),
  }),
  companyLinks: z.array(navLinkSchema).max(20),
  supportLinks: z.array(navLinkSchema).max(20),
  legalLinks: z.array(navLinkSchema).max(20),
  socialLinks: z.array(socialLinkSchema).max(10),
});

export type SiteFooterStorage = z.infer<typeof siteFooterStorageSchema>;
