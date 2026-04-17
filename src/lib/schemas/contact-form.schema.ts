import { z } from "zod";
import {
  CONTACT_FORM_MESSAGE_MAX,
  CONTACT_FORM_NAME_MAX,
  CONTACT_FORM_SUBJECT_MAX,
} from "@/lib/constants/contact-form";
import { isValidEmail } from "@/lib/utils/email";

export const contactFormBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(CONTACT_FORM_NAME_MAX),
  email: z
    .string()
    .trim()
    .min(1, "email is required")
    .max(254)
    .refine((v) => isValidEmail(v), { message: "Invalid email format" }),
  subject: z
    .string()
    .trim()
    .min(1, "subject is required")
    .max(CONTACT_FORM_SUBJECT_MAX),
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(CONTACT_FORM_MESSAGE_MAX),
  /** Honeypot — must stay empty (hidden field; bots often fill it). */
  website: z.string().optional(),
  /** Cloudflare Turnstile token — required when `TURNSTILE_SECRET_KEY` is set. */
  turnstileToken: z.string().optional(),
});

export type ContactFormBody = z.infer<typeof contactFormBodySchema>;

export function safeParseContactForm(body: unknown) {
  return contactFormBodySchema.safeParse(body);
}
