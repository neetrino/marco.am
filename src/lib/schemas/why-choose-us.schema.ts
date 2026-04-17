import { z } from "zod";
import {
  WHY_CHOOSE_US_STORAGE_VERSION,
} from "@/lib/constants/why-choose-us";

const localeTripleSchema = z.object({
  en: z.string().max(200),
  hy: z.string().max(200),
  ru: z.string().max(200),
});

/** Preset keys map to storefront icons; copy is fully CMS-controlled per locale. */
export const whyChooseUsIconKeySchema = z.enum([
  "warranty",
  "fast_delivery",
  "installment",
  "original",
]);

export type WhyChooseUsIconKey = z.infer<typeof whyChooseUsIconKeySchema>;

const itemSchema = z.object({
  id: z.string().min(1).max(64),
  title: localeTripleSchema,
  /** Short supporting line (optional empty). */
  body: localeTripleSchema,
  iconKey: whyChooseUsIconKeySchema,
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const whyChooseUsStorageSchema = z.object({
  version: z.literal(WHY_CHOOSE_US_STORAGE_VERSION),
  sectionTitle: localeTripleSchema,
  items: z.array(itemSchema).min(1).max(8),
});

export type WhyChooseUsStorage = z.infer<typeof whyChooseUsStorageSchema>;
