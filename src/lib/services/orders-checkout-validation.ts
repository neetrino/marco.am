import { isCourierShipping, type ShippingMethodId } from "../constants/shipping-method";
import type { CheckoutData } from "../types/checkout";
import { isValidEmail } from "../utils/email";

const VALIDATION_TYPE = "https://api.shop.am/problems/validation-error";
const VALIDATION_TITLE = "Validation Error";

const MAX_ORDER_NOTES_LENGTH = 2000;

/** Matches storefront `checkout` phone rule (digits, optional leading +). */
const PHONE_CHECKOUT_PATTERN = /^\+?[0-9]{8,15}$/;

type CheckoutValidationField =
  | "email"
  | "phone"
  | "firstName"
  | "lastName"
  | "shippingAddress"
  | "shippingCity"
  | "notes";

type CheckoutValidationCode =
  | "required_email"
  | "required_phone"
  | "invalid_email"
  | "invalid_phone"
  | "required_first_name"
  | "required_last_name"
  | "required_shipping_address"
  | "required_shipping_city"
  | "notes_too_long";

export type CheckoutValidationIssue = {
  field: CheckoutValidationField;
  code: CheckoutValidationCode;
  message: string;
};

export type ValidatedCheckoutCustomer = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  notes: string | null;
};

function throwValidation(issues: readonly CheckoutValidationIssue[]): never {
  const firstIssue = issues[0];
  const detail = firstIssue?.message ?? "Validation failed";
  throw {
    status: 400,
    type: VALIDATION_TYPE,
    title: VALIDATION_TITLE,
    detail,
    errors: issues,
  };
}

/**
 * Validates and normalizes checkout contact fields and notes.
 * Enforces courier address rules when {@link shippingMethod} is courier.
 */
export function validateCheckoutCustomer(
  data: CheckoutData,
  shippingMethod: ShippingMethodId
): ValidatedCheckoutCustomer {
  const emailRaw = typeof data.email === "string" ? data.email.trim() : "";
  const phoneRaw = typeof data.phone === "string" ? data.phone.trim() : "";
  const requiredContactIssues: CheckoutValidationIssue[] = [];
  if (!emailRaw || !phoneRaw) {
    if (!emailRaw) {
      requiredContactIssues.push({
        field: "email",
        code: "required_email",
        message: "Email is required",
      });
    }
    if (!phoneRaw) {
      requiredContactIssues.push({
        field: "phone",
        code: "required_phone",
        message: "Phone is required",
      });
    }
    throwValidation(requiredContactIssues);
  }
  if (!isValidEmail(emailRaw)) {
    throwValidation([
      {
        field: "email",
        code: "invalid_email",
        message: "Invalid email format",
      },
    ]);
  }
  const phoneNormalized = phoneRaw.replace(/\s/g, "");
  if (!PHONE_CHECKOUT_PATTERN.test(phoneNormalized)) {
    throwValidation([
      {
        field: "phone",
        code: "invalid_phone",
        message: "Invalid phone number",
      },
    ]);
  }

  const firstName = typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName = typeof data.lastName === "string" ? data.lastName.trim() : "";
  const requiredNameIssues: CheckoutValidationIssue[] = [];
  if (!firstName || !lastName) {
    if (!firstName) {
      requiredNameIssues.push({
        field: "firstName",
        code: "required_first_name",
        message: "First name is required",
      });
    }
    if (!lastName) {
      requiredNameIssues.push({
        field: "lastName",
        code: "required_last_name",
        message: "Last name is required",
      });
    }
    throwValidation(requiredNameIssues);
  }

  if (isCourierShipping(shippingMethod)) {
    const sa = data.shippingAddress;
    const line = (sa?.addressLine1 ?? sa?.address ?? "").trim();
    const city = (sa?.city ?? "").trim();
    const requiredShippingIssues: CheckoutValidationIssue[] = [];
    if (!line || !city) {
      if (!line) {
        requiredShippingIssues.push({
          field: "shippingAddress",
          code: "required_shipping_address",
          message: "Shipping address is required for courier delivery",
        });
      }
      if (!city) {
        requiredShippingIssues.push({
          field: "shippingCity",
          code: "required_shipping_city",
          message: "City is required for courier delivery",
        });
      }
      throwValidation(requiredShippingIssues);
    }
  }

  const notesTrimmed = typeof data.notes === "string" ? data.notes.trim() : "";
  if (notesTrimmed.length > MAX_ORDER_NOTES_LENGTH) {
    throwValidation([
      {
        field: "notes",
        code: "notes_too_long",
        message: `Notes must be at most ${MAX_ORDER_NOTES_LENGTH} characters`,
      },
    ]);
  }
  const notes = notesTrimmed.length > 0 ? notesTrimmed : null;

  return {
    email: emailRaw.toLowerCase(),
    phone: phoneNormalized,
    firstName,
    lastName,
    notes,
  };
}
