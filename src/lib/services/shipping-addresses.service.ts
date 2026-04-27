import { db } from "@white-shop/db";
import type { Prisma } from "@white-shop/db/prisma";
import type {
  ShippingAddressCreateInput,
  ShippingAddressUpdateInput,
} from "@/lib/schemas/shipping-address.schema";

function toAddressCreateData(
  input: ShippingAddressCreateInput
): Omit<Prisma.AddressCreateInput, "user"> {
  return {
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    company: input.company ?? null,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state ?? null,
    postalCode: input.postalCode ?? null,
    countryCode: input.countryCode,
    phone: input.phone ?? null,
  };
}

function mergeAddressUpdate(
  input: ShippingAddressUpdateInput
): Prisma.AddressUpdateInput {
  const data: Prisma.AddressUpdateInput = {};
  if (input.firstName !== undefined) data.firstName = input.firstName ?? null;
  if (input.lastName !== undefined) data.lastName = input.lastName ?? null;
  if (input.company !== undefined) data.company = input.company ?? null;
  if (input.addressLine1 !== undefined) data.addressLine1 = input.addressLine1;
  if (input.addressLine2 !== undefined) data.addressLine2 = input.addressLine2 ?? null;
  if (input.city !== undefined) data.city = input.city;
  if (input.state !== undefined) data.state = input.state ?? null;
  if (input.postalCode !== undefined) data.postalCode = input.postalCode ?? null;
  if (input.countryCode !== undefined) data.countryCode = input.countryCode;
  if (input.phone !== undefined) data.phone = input.phone ?? null;
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;
  return data;
}

/**
 * If the user has addresses but none marked default, sets the lexicographically first id as default.
 */
async function ensureUserHasDefaultAddress(userId: string): Promise<void> {
  const total = await db.address.count({ where: { userId } });
  if (total === 0) return;

  const defaultCount = await db.address.count({ where: { userId, isDefault: true } });
  if (defaultCount > 0) return;

  const first = await db.address.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (first) {
    await db.address.update({
      where: { id: first.id },
      data: { isDefault: true },
    });
  }
}

class ShippingAddressesService {
  async getAddresses(userId: string) {
    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
    return { data: addresses };
  }

  async addAddress(userId: string, input: ShippingAddressCreateInput) {
    const payload = toAddressCreateData(input);

    return db.$transaction(async (tx) => {
      const existingCount = await tx.address.count({ where: { userId } });
      const wantsDefault = input.isDefault === true;
      const shouldBeDefault = existingCount === 0 || wantsDefault;

      if (shouldBeDefault && existingCount > 0) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          ...payload,
          userId,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async updateAddress(userId: string, addressId: string, input: ShippingAddressUpdateInput) {
    const existing = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Address not found",
      };
    }

    const data = mergeAddressUpdate(input);

    const updated = await db.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });

    await ensureUserHasDefaultAddress(userId);
    return updated;
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Address not found",
      };
    }

    await db.address.delete({
      where: { id: addressId },
    });

    await ensureUserHasDefaultAddress(userId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const owned = await db.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });

    if (!owned) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Address not found",
      };
    }

    return db.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }
}

export const shippingAddressesService = new ShippingAddressesService();
