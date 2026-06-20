import { z } from "zod";

import {
  BANNER_MANAGEMENT_VERSION,
  BANNER_SLOT_IDS,
} from "@/lib/constants/banner-management";
import { buildLocalizedTextMapSchema } from "@/lib/schemas/locale-map.schema";

function isAllowedHref(raw: string): boolean {
  const href = raw.trim();
  if (href.length === 0) return false;

  const lowered = href.toLowerCase();
  if (lowered.startsWith("javascript:") || lowered.startsWith("data:")) {
    return false;
  }

  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    /^https?:\/\//i.test(href) ||
    lowered.startsWith("mailto:")
  );
}

const bannerTitleSchema = buildLocalizedTextMapSchema({ max: 200 });

const bannerScheduleSchema = z
  .object({
    startsAt: z.union([z.string().datetime({ offset: true }), z.null()]),
    endsAt: z.union([z.string().datetime({ offset: true }), z.null()]),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt === null || value.endsAt === null) return;

    const starts = Date.parse(value.startsAt);
    const ends = Date.parse(value.endsAt);
    if (!Number.isFinite(starts) || !Number.isFinite(ends)) return;

    if (ends <= starts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schedule endsAt must be greater than startsAt",
        path: ["endsAt"],
      });
    }
  });

const bannerItemSchema = z.object({
  id: z.string().min(1).max(64),
  slot: z.enum(BANNER_SLOT_IDS),
  title: bannerTitleSchema,
  imageDesktopUrl: z.union([z.string().max(2048), z.null()]),
  imageMobileUrl: z.union([z.string().max(2048), z.null()]),
  link: z.object({
    href: z
      .string()
      .min(1)
      .max(2048)
      .refine(isAllowedHref, "Invalid or unsafe href"),
    openInNewTab: z.boolean(),
  }),
  schedule: bannerScheduleSchema,
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const bannerManagementStorageSchema = z.object({
  version: z.literal(BANNER_MANAGEMENT_VERSION),
  banners: z.array(bannerItemSchema).max(200),
});

export type BannerManagementStorage = z.infer<
  typeof bannerManagementStorageSchema
>;
