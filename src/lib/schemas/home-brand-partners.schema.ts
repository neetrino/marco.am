import { z } from "zod";

import {
  HOME_BRAND_PARTNERS_MAX_ENTRIES,
  HOME_BRAND_PARTNERS_STORAGE_VERSION,
} from "@/lib/constants/home-brand-partners";

const localeTripleSchema = z.object({
  en: z.string().max(200),
  hy: z.string().max(200),
  ru: z.string().max(200),
});

const entrySchema = z.object({
  id: z.string().min(1).max(64),
  brandId: z.string().min(1),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  logoScale: z.enum(["default", "large"]).optional(),
});

export const homeBrandPartnersStorageSchema = z.object({
  version: z.literal(HOME_BRAND_PARTNERS_STORAGE_VERSION),
  sectionTitle: localeTripleSchema,
  /** Empty = show all published brands (slug order). Non-empty = curated list. */
  entries: z.array(entrySchema).max(HOME_BRAND_PARTNERS_MAX_ENTRIES),
});

export type HomeBrandPartnersStorage = z.infer<typeof homeBrandPartnersStorageSchema>;
