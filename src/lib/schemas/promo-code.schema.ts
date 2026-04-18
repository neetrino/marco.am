import { z } from "zod";

export const promoCodeDiscountTypeSchema = z.enum(["percentage", "fixed"]);
export const promoCodeScopeSchema = z.enum(["all", "retail", "wholesale"]);

const nullableFiniteNumberSchema = z
  .number()
  .finite()
  .nonnegative()
  .nullable()
  .optional();

const nullableIsoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const promoCodeRecordSchema = z
  .object({
    id: z.string().min(1),
    code: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .regex(/^[A-Z0-9_-]+$/),
    title: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    isActive: z.boolean().default(true),
    discountType: promoCodeDiscountTypeSchema,
    discountValue: z.number().positive(),
    maxDiscountAmount: nullableFiniteNumberSchema,
    minSubtotal: nullableFiniteNumberSchema,
    usageLimitTotal: z.number().int().positive().nullable().optional(),
    usageLimitPerUser: z.number().int().positive().nullable().optional(),
    startsAt: nullableIsoDateTimeSchema,
    endsAt: nullableIsoDateTimeSchema,
    scope: promoCodeScopeSchema.default("all"),
  })
  .superRefine((record, ctx) => {
    if (record.discountType === "percentage" && record.discountValue > 100) {
      ctx.addIssue({
        path: ["discountValue"],
        code: z.ZodIssueCode.custom,
        message: "Percentage discount cannot exceed 100",
      });
    }

    if (record.startsAt && record.endsAt) {
      const startsAtTime = Date.parse(record.startsAt);
      const endsAtTime = Date.parse(record.endsAt);
      if (Number.isFinite(startsAtTime) && Number.isFinite(endsAtTime) && startsAtTime > endsAtTime) {
        ctx.addIssue({
          path: ["endsAt"],
          code: z.ZodIssueCode.custom,
          message: "endsAt must be greater than or equal to startsAt",
        });
      }
    }
  });

export const promoCodeStorageSchema = z.array(promoCodeRecordSchema);

export type PromoCodeRecord = z.infer<typeof promoCodeRecordSchema>;
