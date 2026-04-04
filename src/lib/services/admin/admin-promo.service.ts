import { db } from "@white-shop/db";

export interface CreatePromoCodeData {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number | null;
}

export interface UpdatePromoCodeData {
  code?: string;
  type?: "percent" | "fixed";
  value?: number;
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number | null;
}

class AdminPromoService {
  async list() {
    return db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const promo = await db.promoCode.findUnique({
      where: { id },
    });
    if (!promo) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Not found",
        detail: "Promo code not found",
      };
    }
    return promo;
  }

  async create(data: CreatePromoCodeData) {
    const code = data.code.trim().toUpperCase();
    const existing = await db.promoCode.findUnique({
      where: { code },
    });
    if (existing) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "A promo code with this code already exists",
      };
    }
    return db.promoCode.create({
      data: {
        code,
        type: data.type,
        value: data.value,
        active: data.active ?? true,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        maxUses: data.maxUses ?? null,
        minOrderAmount: data.minOrderAmount ?? null,
      },
    });
  }

  async update(id: string, data: UpdatePromoCodeData) {
    await this.getById(id);
    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code.trim().toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    if (data.validTo !== undefined) updateData.validTo = data.validTo ? new Date(data.validTo) : null;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    return db.promoCode.update({
      where: { id },
      data: updateData as Parameters<typeof db.promoCode.update>[0]["data"],
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await db.promoCode.delete({ where: { id } });
    return { success: true };
  }
}

export const adminPromoService = new AdminPromoService();
