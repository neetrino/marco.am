import { z } from "zod";
import {
  SHIPPING_ADDRESS_CITY_MAX_LENGTH,
  SHIPPING_ADDRESS_COMPANY_MAX_LENGTH,
  SHIPPING_ADDRESS_LINE_MAX_LENGTH,
  SHIPPING_ADDRESS_NAME_MAX_LENGTH,
  SHIPPING_ADDRESS_PHONE_MAX_LENGTH,
  SHIPPING_ADDRESS_POSTAL_MAX_LENGTH,
  SHIPPING_ADDRESS_STATE_MAX_LENGTH,
} from "@/lib/constants/shipping-address";

const optionalTrimmed = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined) return undefined;
      const t = v.trim();
      return t === "" ? undefined : t;
    })
    .pipe(z.string().max(max).optional());

/**
 * Body for `POST /api/v1/users/addresses` — saved courier/shipping address.
 */
export const shippingAddressCreateSchema = z
  .object({
    firstName: optionalTrimmed(SHIPPING_ADDRESS_NAME_MAX_LENGTH),
    lastName: optionalTrimmed(SHIPPING_ADDRESS_NAME_MAX_LENGTH),
    company: optionalTrimmed(SHIPPING_ADDRESS_COMPANY_MAX_LENGTH),
    addressLine1: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1).max(SHIPPING_ADDRESS_LINE_MAX_LENGTH)),
    addressLine2: optionalTrimmed(SHIPPING_ADDRESS_LINE_MAX_LENGTH),
    city: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1).max(SHIPPING_ADDRESS_CITY_MAX_LENGTH)),
    state: optionalTrimmed(SHIPPING_ADDRESS_STATE_MAX_LENGTH),
    postalCode: optionalTrimmed(SHIPPING_ADDRESS_POSTAL_MAX_LENGTH),
    countryCode: z
      .union([z.string().length(2), z.literal(""), z.undefined()])
      .transform((v) => (v === undefined || v === "" ? "AM" : v.toUpperCase())),
    phone: optionalTrimmed(SHIPPING_ADDRESS_PHONE_MAX_LENGTH),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type ShippingAddressCreateInput = z.infer<typeof shippingAddressCreateSchema>;

/**
 * Body for `PUT /api/v1/users/addresses/:addressId` — partial update.
 */
export const shippingAddressUpdateSchema = shippingAddressCreateSchema.partial().strict();

export type ShippingAddressUpdateInput = z.infer<typeof shippingAddressUpdateSchema>;

export function safeParseShippingAddressCreate(body: unknown) {
  return shippingAddressCreateSchema.safeParse(body);
}

export function safeParseShippingAddressUpdate(body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).length === 0
  ) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: "custom",
          message: "At least one field is required",
          path: [],
        },
      ]),
    };
  }
  return shippingAddressUpdateSchema.safeParse(body);
}
