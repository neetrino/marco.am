import { db } from "@white-shop/db";
import type { PromoCodeRecord } from "@/lib/schemas/promo-code.schema";
import { promoCodeRecordSchema, promoCodeStorageSchema } from "@/lib/schemas/promo-code.schema";

const PROMO_CODES_SETTING_KEY = "promoCodes";
const CANCELED_ORDER_STATUS = "cancelled";

type ResolvePromoDiscountInput = {
  couponCode?: string | null;
  subtotal: number;
  userId?: string;
  customerEmail?: string;
  productClasses?: string[];
  now?: Date;
};

type PromoUsage = {
  totalUses: number;
  userUses: number;
};

type PromoDiscountResolution = {
  couponCode: string | null;
  discountAmount: number;
};

function normalizeCouponCode(rawCode?: string | null): string {
  return (rawCode ?? "").trim().toUpperCase();
}

function parsePromoStorage(raw: unknown): PromoCodeRecord[] {
  const parsed = promoCodeStorageSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

function matchesScope(scope: PromoCodeRecord["scope"], productClasses: string[]): boolean {
  if (scope === "all" || productClasses.length === 0) {
    return true;
  }
  const hasRetail = productClasses.includes("retail");
  const hasWholesale = productClasses.includes("wholesale");
  if (scope === "retail") {
    return hasRetail && !hasWholesale;
  }
  return hasWholesale && !hasRetail;
}

class PromoCodesService {
  async getRecords(): Promise<PromoCodeRecord[]> {
    const setting = await db.settings.findUnique({
      where: { key: PROMO_CODES_SETTING_KEY },
      select: { value: true },
    });
    return parsePromoStorage(setting?.value);
  }

  async getAdminList() {
    const records = await this.getRecords();
    const usageByCode = await Promise.all(
      records.map(async (record) => {
        const totalUses = await db.order.count({
          where: { couponCode: record.code, status: { not: CANCELED_ORDER_STATUS } },
        });
        return [record.code, totalUses] as const;
      })
    );
    const usageMap = new Map(usageByCode);
    return records.map((record) => ({
      ...record,
      usageCount: usageMap.get(record.code) ?? 0,
    }));
  }

  async upsertRecord(input: unknown): Promise<PromoCodeRecord> {
    const parsed = promoCodeRecordSchema.safeParse(input);
    if (!parsed.success) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: parsed.error.flatten(),
      };
    }
    const nextRecord = { ...parsed.data, code: normalizeCouponCode(parsed.data.code) };
    const records = await this.getRecords();
    const withoutTarget = records.filter(
      (record) =>
        record.id !== nextRecord.id && normalizeCouponCode(record.code) !== normalizeCouponCode(nextRecord.code)
    );
    withoutTarget.push(nextRecord);
    await db.settings.upsert({
      where: { key: PROMO_CODES_SETTING_KEY },
      update: { value: withoutTarget, updatedAt: new Date() },
      create: {
        key: PROMO_CODES_SETTING_KEY,
        value: withoutTarget,
        description: "Admin-managed promo codes with limits and date windows",
      },
    });
    return nextRecord;
  }

  async deleteRecord(id: string) {
    const records = await this.getRecords();
    const nextRecords = records.filter((record) => record.id !== id);
    await db.settings.upsert({
      where: { key: PROMO_CODES_SETTING_KEY },
      update: { value: nextRecords, updatedAt: new Date() },
      create: {
        key: PROMO_CODES_SETTING_KEY,
        value: nextRecords,
        description: "Admin-managed promo codes with limits and date windows",
      },
    });
    return { success: true };
  }

  async resolveDiscount(input: ResolvePromoDiscountInput): Promise<PromoDiscountResolution> {
    const couponCode = normalizeCouponCode(input.couponCode);
    if (!couponCode) {
      return { couponCode: null, discountAmount: 0 };
    }
    const records = await this.getRecords();
    const promo = records.find((record) => normalizeCouponCode(record.code) === couponCode);
    if (!promo) {
      throw this.validationError("Invalid promo code");
    }
    const now = input.now ?? new Date();
    this.assertPromoValidity(promo, input, now);
    const usage = await this.getUsage(promo.code, input.userId, input.customerEmail);
    this.assertUsageLimits(promo, usage);
    const discountAmount = this.computeDiscountAmount(promo, input.subtotal);
    return { couponCode: promo.code, discountAmount };
  }

  async ensureCouponCanBeStored(rawCode: string): Promise<string> {
    const couponCode = normalizeCouponCode(rawCode);
    if (!couponCode) {
      throw this.validationError("couponCode is required");
    }
    const records = await this.getRecords();
    const promo = records.find((record) => normalizeCouponCode(record.code) === couponCode);
    if (!promo) {
      throw this.validationError("Invalid promo code");
    }
    const now = new Date();
    if (!promo.isActive) {
      throw this.validationError("Promo code is inactive");
    }
    if (promo.startsAt && new Date(promo.startsAt) > now) {
      throw this.validationError("Promo code is not active yet");
    }
    if (promo.endsAt && new Date(promo.endsAt) < now) {
      throw this.validationError("Promo code has expired");
    }
    return promo.code;
  }

  private assertPromoValidity(
    promo: PromoCodeRecord,
    input: ResolvePromoDiscountInput,
    now: Date
  ) {
    if (!promo.isActive) {
      throw this.validationError("Promo code is inactive");
    }
    if (promo.startsAt && new Date(promo.startsAt) > now) {
      throw this.validationError("Promo code is not active yet");
    }
    if (promo.endsAt && new Date(promo.endsAt) < now) {
      throw this.validationError("Promo code has expired");
    }
    if (promo.minSubtotal != null && input.subtotal < promo.minSubtotal) {
      throw this.validationError(`Promo code requires minimum subtotal of ${promo.minSubtotal}`);
    }
    if (!matchesScope(promo.scope, input.productClasses ?? [])) {
      throw this.validationError("Promo code does not match cart product class");
    }
  }

  private assertUsageLimits(promo: PromoCodeRecord, usage: PromoUsage) {
    if (promo.usageLimitTotal != null && usage.totalUses >= promo.usageLimitTotal) {
      throw this.validationError("Promo code usage limit reached");
    }
    if (promo.usageLimitPerUser != null && usage.userUses >= promo.usageLimitPerUser) {
      throw this.validationError("Promo code per-user limit reached");
    }
  }

  private async getUsage(code: string, userId?: string, customerEmail?: string): Promise<PromoUsage> {
    const whereBase = { couponCode: code, status: { not: CANCELED_ORDER_STATUS } };
    const totalUses = await db.order.count({ where: whereBase });
    if (userId) {
      const userUses = await db.order.count({ where: { ...whereBase, userId } });
      return { totalUses, userUses };
    }
    if (customerEmail) {
      const userUses = await db.order.count({
        where: { ...whereBase, customerEmail: customerEmail.toLowerCase() },
      });
      return { totalUses, userUses };
    }
    return { totalUses, userUses: 0 };
  }

  private computeDiscountAmount(promo: PromoCodeRecord, subtotal: number): number {
    if (subtotal <= 0) {
      return 0;
    }
    const rawDiscount =
      promo.discountType === "percentage"
        ? subtotal * (promo.discountValue / 100)
        : promo.discountValue;
    const withCap =
      promo.maxDiscountAmount != null ? Math.min(rawDiscount, promo.maxDiscountAmount) : rawDiscount;
    return Math.max(0, Math.min(withCap, subtotal));
  }

  private validationError(detail: string) {
    return {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail,
    };
  }
}

export const promoCodesService = new PromoCodesService();
