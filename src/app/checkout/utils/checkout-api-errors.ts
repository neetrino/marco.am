import { ApiError, getApiOrErrorMessage } from "../../../lib/api-client/types";
import type { CheckoutFormData } from "../types";

type CheckoutFieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "shippingAddress"
  | "shippingCity"
  | "notes";

type CheckoutValidationIssue = {
  field?: string;
  code?: string;
  message?: string;
};

type CheckoutErrorBody = {
  detail?: string;
  message?: string;
  errors?: CheckoutValidationIssue[];
};

type TranslationFn = (key: string) => string;

export type CheckoutFieldError = {
  field: CheckoutFieldName;
  message: string;
};

export type CheckoutSubmissionErrorResult = {
  fieldErrors: CheckoutFieldError[];
  globalError: string | null;
};

const CHECKOUT_FIELD_NAMES: readonly CheckoutFieldName[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "shippingAddress",
  "shippingCity",
  "notes",
];

const CODE_TO_TRANSLATION_KEY: Record<string, string> = {
  required_first_name: "checkout.errors.firstNameRequired",
  required_last_name: "checkout.errors.lastNameRequired",
  required_email: "checkout.errors.emailRequired",
  invalid_email: "checkout.errors.invalidEmail",
  required_phone: "checkout.errors.phoneRequired",
  invalid_phone: "checkout.errors.invalidPhone",
  required_shipping_address: "checkout.errors.addressRequired",
  required_shipping_city: "checkout.errors.cityRequired",
  notes_too_long: "checkout.errors.notesTooLong",
};

function parseCheckoutErrorBody(error: unknown): CheckoutErrorBody | null {
  if (!(error instanceof ApiError)) {
    return null;
  }
  const payload = error.data;
  if (!payload || typeof payload !== "object") {
    return null;
  }
  return payload as CheckoutErrorBody;
}

function normalizeCheckoutField(field: string | undefined): CheckoutFieldName | null {
  if (typeof field !== "string" || field.length === 0) {
    return null;
  }
  if ((CHECKOUT_FIELD_NAMES as readonly string[]).includes(field)) {
    return field as CheckoutFieldName;
  }
  return null;
}

function issueMessage(issue: CheckoutValidationIssue, t: TranslationFn): string {
  const key =
    typeof issue.code === "string" ? CODE_TO_TRANSLATION_KEY[issue.code] : undefined;
  if (key) {
    return t(key);
  }
  if (typeof issue.message === "string" && issue.message.length > 0) {
    return issue.message;
  }
  return t("checkout.errors.failedToCreateOrder");
}

export function parseCheckoutSubmissionError(
  error: unknown,
  t: TranslationFn
): CheckoutSubmissionErrorResult {
  const fallback = t("checkout.errors.failedToCreateOrder");
  const body = parseCheckoutErrorBody(error);
  const issues = Array.isArray(body?.errors) ? body.errors : [];
  const fieldErrors: CheckoutFieldError[] = [];

  for (const issue of issues) {
    const fieldName = normalizeCheckoutField(issue.field);
    if (!fieldName) {
      continue;
    }
    fieldErrors.push({
      field: fieldName,
      message: issueMessage(issue, t),
    });
  }

  const generalMessage = getApiOrErrorMessage(error, fallback);
  const shouldHideGlobalMessage =
    fieldErrors.length > 0 &&
    typeof body?.detail === "string" &&
    fieldErrors.some((entry) => entry.message === body.detail);

  return {
    fieldErrors,
    globalError: shouldHideGlobalMessage ? null : generalMessage,
  };
}

export type CheckoutFormFieldName = keyof Pick<
  CheckoutFormData,
  CheckoutFieldName
>;
